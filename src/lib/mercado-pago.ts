import { createHmac, timingSafeEqual } from "node:crypto";
import prisma from "@/lib/prisma";
import { cifrar, decifrar } from "@/modules/_nucleo/cripto";

/**
 * Mercado Pago — credencial e cobrança PIX.
 *
 * A loja só tinha chave PIX estática: o QR é gerado, o cliente paga, e
 * ninguém fica sabendo — o pedido continua "aguardando pagamento" até alguém
 * conferir o extrato na mão. Com a conta do Mercado Pago configurada, a
 * cobrança nasce lá com `external_reference` = id do pedido e o webhook fecha
 * o pedido sozinho.
 *
 * Regras:
 * - token e segredo do webhook nunca voltam para a tela (só `tem*: true`);
 * - campo vazio no painel significa "manter o que está gravado";
 * - sem credencial, o checkout continua no PIX de chave estática.
 */

const CONFIG_KEY = "pagamentos";

/**
 * Cartão de crédito no Mercado Pago.
 *
 * As credenciais são as mesmas do PIX (Public Key no navegador, Access Token no
 * servidor — ver "Credenciais" na doc do MP). Aqui ficam só as regras da loja:
 * se aceita cartão, até quantas parcelas e a partir de quando passa a ter juros.
 */
export interface CartaoConfig {
  habilitado: boolean;
  /** 1 a 12 — o Mercado Pago aceita até 12x. */
  maxParcelas: number;
  /** Parcelas sem juros (0 = todas com juros, conforme o MP). */
  semJurosAte: number;
}

export interface ConfigMercadoPago {
  habilitado: boolean;
  ambiente: "producao" | "teste";
  publicKey: string | null;
  /** Nunca sai do servidor. Na tela vira `temAccessToken`. */
  accessToken: string | null;
  webhookSecret: string | null;
  cartao: CartaoConfig;
  atualizadoEm: string | null;
}

/** O que a tela pode ver. */
export interface ConfigMercadoPagoPublica {
  habilitado: boolean;
  ambiente: "producao" | "teste";
  publicKey: string | null;
  temAccessToken: boolean;
  temWebhookSecret: boolean;
  cartao: CartaoConfig;
  atualizadoEm: string | null;
  /** URL que precisa ser cadastrada no painel do Mercado Pago. */
  urlWebhook: string;
}

interface MercadoPagoSalvo {
  habilitado?: boolean;
  ambiente?: "producao" | "teste";
  publicKey?: string | null;
  accessTokenCifrado?: string | null;
  webhookSecretCifrado?: string | null;
  cartao?: { habilitado?: boolean; maxParcelas?: number; semJurosAte?: number };
  atualizadoEm?: string | null;
}

const CARTAO_PADRAO: CartaoConfig = { habilitado: false, maxParcelas: 12, semJurosAte: 0 };

function lerCartao(salvo?: MercadoPagoSalvo["cartao"]): CartaoConfig {
  const max = Number(salvo?.maxParcelas);
  const semJuros = Number(salvo?.semJurosAte);
  const maxParcelas = Number.isFinite(max) ? Math.min(12, Math.max(1, Math.trunc(max))) : 12;
  return {
    habilitado: salvo?.habilitado === true,
    maxParcelas,
    semJurosAte: Number.isFinite(semJuros) ? Math.min(maxParcelas, Math.max(0, Math.trunc(semJuros))) : 0,
  };
}

async function lerConfigBruta(): Promise<Record<string, unknown>> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CONFIG_KEY } });
    if (row?.valor && typeof row.valor === "object") {
      return row.valor as Record<string, unknown>;
    }
  } catch (erro) {
    console.error("[mercado-pago] falha ao ler config:", erro);
  }
  return {};
}

function decifrarSeguro(blob: string | null | undefined): string | null {
  if (!blob) return null;
  try {
    return decifrar(blob);
  } catch (erro) {
    console.error("[mercado-pago] não consegui decifrar o segredo:", erro);
    return null;
  }
}

export async function lerConfigMercadoPago(): Promise<ConfigMercadoPago> {
  const bruto = await lerConfigBruta();
  const mp = (bruto.mercadopago ?? {}) as MercadoPagoSalvo;

  return {
    habilitado: mp.habilitado === true,
    ambiente: mp.ambiente === "teste" ? "teste" : "producao",
    publicKey: mp.publicKey ?? null,
    accessToken: decifrarSeguro(mp.accessTokenCifrado),
    webhookSecret: decifrarSeguro(mp.webhookSecretCifrado),
    cartao: lerCartao(mp.cartao),
    atualizadoEm: mp.atualizadoEm ?? null,
  };
}

export function configPublica(
  config: ConfigMercadoPago,
  baseUrl: string
): ConfigMercadoPagoPublica {
  return {
    habilitado: config.habilitado,
    ambiente: config.ambiente,
    publicKey: config.publicKey,
    temAccessToken: Boolean(config.accessToken),
    temWebhookSecret: Boolean(config.webhookSecret),
    cartao: config.cartao ?? CARTAO_PADRAO,
    atualizadoEm: config.atualizadoEm,
    urlWebhook: `${baseUrl}/api/webhooks/mercadopago`,
  };
}

export interface EntradaConfigMercadoPago {
  habilitado?: boolean;
  ambiente?: string;
  publicKey?: string | null;
  /** Vazio = manter o token atual. */
  accessToken?: string | null;
  /** Vazio = manter o segredo atual. */
  webhookSecret?: string | null;
  cartao?: { habilitado?: boolean; maxParcelas?: number; semJurosAte?: number };
}

export async function salvarConfigMercadoPago(
  entrada: EntradaConfigMercadoPago
): Promise<ConfigMercadoPago> {
  const bruto = await lerConfigBruta();
  const atual = (bruto.mercadopago ?? {}) as MercadoPagoSalvo;

  const tokenNovo = (entrada.accessToken ?? "").trim();
  const segredoNovo = (entrada.webhookSecret ?? "").trim();

  const mp: MercadoPagoSalvo = {
    habilitado:
      entrada.habilitado === undefined
        ? atual.habilitado === true
        : entrada.habilitado === true,
    ambiente: entrada.ambiente === "teste" ? "teste" : "producao",
    publicKey:
      entrada.publicKey === undefined
        ? atual.publicKey ?? null
        : (entrada.publicKey ?? "").trim() || null,
    accessTokenCifrado: tokenNovo
      ? cifrar(tokenNovo)
      : atual.accessTokenCifrado ?? null,
    webhookSecretCifrado: segredoNovo
      ? cifrar(segredoNovo)
      : atual.webhookSecretCifrado ?? null,
    cartao: entrada.cartao
      ? lerCartao({ ...atual.cartao, ...entrada.cartao })
      : lerCartao(atual.cartao),
    atualizadoEm: new Date().toISOString(),
  };

  // O objeto vai montado campo a campo: o Prisma não aceita `Record<string, unknown>`.
  const valor = {
    ...bruto,
    mercadopago: {
      habilitado: mp.habilitado === true,
      ambiente: mp.ambiente === "teste" ? "teste" : "producao",
      publicKey: mp.publicKey ?? null,
      accessTokenCifrado: mp.accessTokenCifrado ?? null,
      webhookSecretCifrado: mp.webhookSecretCifrado ?? null,
      cartao: {
        habilitado: mp.cartao?.habilitado === true,
        maxParcelas: mp.cartao?.maxParcelas ?? CARTAO_PADRAO.maxParcelas,
        semJurosAte: mp.cartao?.semJurosAte ?? CARTAO_PADRAO.semJurosAte,
      },
      atualizadoEm: mp.atualizadoEm ?? null,
    },
  };

  await prisma.configuracao.upsert({
    where: { chave: CONFIG_KEY },
    create: { chave: CONFIG_KEY, valor },
    update: { valor },
  });

  return lerConfigMercadoPago();
}

/* ------------------------------------------------------------------ */
/* API do Mercado Pago                                                 */
/* ------------------------------------------------------------------ */

const API = "https://api.mercadopago.com";

export class ErroMercadoPago extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
  }
}

async function chamar<T>(
  caminho: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  const resposta = await fetch(`${API}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : {};

  if (!resposta.ok) {
    const motivo =
      (dados as { message?: string; error?: string }).message ||
      (dados as { error?: string }).error ||
      `Mercado Pago respondeu ${resposta.status}`;
    throw new ErroMercadoPago(motivo, resposta.status);
  }

  return dados as T;
}

export interface CredencialMercadoPago {
  id: number;
  nickname?: string;
  email?: string;
  site_id?: string;
}

/** GET /users/me — prova que o token existe, não que ele aceita cobrança. */
export async function testarCredencial(
  config: ConfigMercadoPago
): Promise<CredencialMercadoPago> {
  if (!config.accessToken) {
    throw new ErroMercadoPago("Access token não configurado.");
  }
  return chamar<CredencialMercadoPago>("/users/me", config.accessToken);
}

export interface PixMercadoPago {
  paymentId: string;
  status: string;
  /** Copia e cola. */
  payload: string;
  /** PNG em data URL, pronto para <img>. */
  qrCode: string;
  ticketUrl: string | null;
  expiraEm: string | null;
}

interface RespostaPagamento {
  id: number;
  status: string;
  date_of_expiration?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

/**
 * Cria uma cobrança PIX no Mercado Pago.
 *
 * `external_reference` é o id do pedido: é por ele que o webhook acha o
 * pedido para marcar como pago.
 */
export async function criarPixMercadoPago(opts: {
  config: ConfigMercadoPago;
  valor: number;
  descricao: string;
  pedidoId: string;
  pagador: { nome: string; email: string; documento?: string | null };
}): Promise<PixMercadoPago> {
  const { config, valor, descricao, pedidoId, pagador } = opts;

  if (!config.accessToken) {
    throw new ErroMercadoPago("Conta do Mercado Pago não configurada.");
  }

  const [primeiro, ...resto] = pagador.nome.trim().split(/\s+/);
  const documento = (pagador.documento ?? "").replace(/\D/g, "");

  const corpo = {
    transaction_amount: Number(valor.toFixed(2)),
    description: descricao.slice(0, 250),
    payment_method_id: "pix",
    external_reference: pedidoId,
    payer: {
      email: pagador.email,
      first_name: primeiro || "Cliente",
      last_name: resto.join(" ") || "Car Crew",
      ...(documento
        ? { identification: { type: documento.length === 14 ? "CNPJ" : "CPF", number: documento } }
        : {}),
    },
  };

  const resposta = await chamar<RespostaPagamento>("/v1/payments", config.accessToken, {
    method: "POST",
    headers: { "X-Idempotency-Key": pedidoId },
    body: JSON.stringify(corpo),
  });

  const dados = resposta.point_of_interaction?.transaction_data;
  if (!dados?.qr_code) {
    throw new ErroMercadoPago("O Mercado Pago não devolveu o código PIX.");
  }

  return {
    paymentId: String(resposta.id),
    status: resposta.status,
    payload: dados.qr_code,
    qrCode: dados.qr_code_base64
      ? `data:image/png;base64,${dados.qr_code_base64}`
      : "",
    ticketUrl: dados.ticket_url ?? null,
    expiraEm: resposta.date_of_expiration ?? null,
  };
}

export async function consultarPagamento(
  config: ConfigMercadoPago,
  paymentId: string
): Promise<{
  id: number;
  status: string;
  externalReference: string | null;
  valor: number;
}> {
  if (!config.accessToken) {
    throw new ErroMercadoPago("Conta do Mercado Pago não configurada.");
  }

  const dados = await chamar<{
    id: number;
    status: string;
    external_reference?: string | null;
    transaction_amount?: number;
  }>(`/v1/payments/${encodeURIComponent(paymentId)}`, config.accessToken);

  return {
    id: dados.id,
    status: dados.status,
    externalReference: dados.external_reference ?? null,
    valor: Number(dados.transaction_amount ?? 0),
  };
}

/**
 * Assinatura do webhook (`x-signature: ts=…,v1=…`).
 *
 * O manifesto é montado com `data.id`, `x-request-id` e `ts`; sem o segredo
 * cadastrado no painel do MP não há como validar — nesse caso a rota recusa
 * (melhor não confirmar pagamento do que aceitar qualquer POST).
 */
export function assinaturaValida(opts: {
  segredo: string;
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
}): boolean {
  const { segredo, xSignature, xRequestId, dataId } = opts;
  if (!xSignature) return false;

  const partes = new Map(
    xSignature.split(",").map((p) => {
      const [chave, valor] = p.split("=");
      return [chave?.trim() ?? "", valor?.trim() ?? ""];
    })
  );

  const ts = partes.get("ts");
  const v1 = partes.get("v1");
  if (!ts || !v1) return false;

  const manifesto = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;

  const esperado = createHmac("sha256", segredo).update(manifesto).digest("hex");

  const a = Buffer.from(esperado, "utf8");
  const b = Buffer.from(v1, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
