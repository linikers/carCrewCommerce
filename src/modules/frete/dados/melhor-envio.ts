import type { FreteConfig } from "./config";
import type { ItemFrete, OpcaoFrete } from "../dominio/cotacao";

/**
 * Cliente do Melhor Envio — cotação real (#75).
 *
 * Contrato conferido na doc oficial (`POST /api/v2/me/shipment/calculate`):
 * produtos em cm/kg, `insurance_value` unitário, resposta com `custom_price` e
 * `custom_delivery_time` (os valores com as taxas/descontos da conta) — a doc
 * manda usar os `custom_*`, não `price`/`delivery_time`.
 *
 * Sem token o frete não é cotado: quem chama cai na estimativa e diz que é
 * estimativa. Nada de inventar preço de transportadora.
 */

const BASE_PRODUCAO = "https://melhorenvio.com.br";
const BASE_SANDBOX = "https://sandbox.melhorenvio.com.br";

export class ErroFrete extends Error {
  constructor(
    message: string,
    readonly codigo: "SEM_TOKEN" | "EXPIRADO" | "API" | "RESPOSTA" = "API"
  ) {
    super(message);
  }
}

interface RespostaME {
  id?: number | string;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  delivery_range?: { min?: number; max?: number };
  custom_delivery_range?: { min?: number; max?: number };
  company?: { name?: string };
  error?: string | null;
}

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  const n = Number(String(valor).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Converte a resposta do Melhor Envio nas opções da loja.
 * Exportada para poder testar o parsing sem rede.
 */
export function mapearResposta(resposta: RespostaME[]): OpcaoFrete[] {
  const opcoes: OpcaoFrete[] = [];

  for (const item of resposta) {
    // serviço indisponível para o trecho vem com `error` e sem preço
    if (item.error) continue;

    const preco = numero(item.custom_price ?? item.price);
    if (preco === null || preco <= 0) continue;

    const prazo = numero(item.custom_delivery_time ?? item.delivery_time);
    const faixa = item.custom_delivery_range ?? item.delivery_range;
    const min = numero(faixa?.min);
    const max = numero(faixa?.max);

    const dias =
      prazo !== null
        ? `${prazo} dia${prazo === 1 ? "" : "s"} útil${prazo === 1 ? "" : "eis"}`
        : min !== null && max !== null
          ? `${min} a ${max} dias úteis`
          : "prazo não informado";

    opcoes.push({
      id: String(item.id ?? item.name ?? "servico"),
      transportadora: item.company?.name || "Transportadora",
      modalidade: item.name || "",
      prazo: dias,
      valor: preco,
      estimado: false,
    });
  }

  return opcoes.sort((a, b) => a.valor - b.valor);
}

/** Renova o access token (o Melhor Envio expira em 30 dias). */
export async function renovarToken(config: FreteConfig): Promise<FreteConfig> {
  if (!config.refreshToken) {
    throw new ErroFrete("Sem refresh token: autorize o Melhor Envio de novo", "EXPIRADO");
  }

  const base = config.sandbox ? BASE_SANDBOX : BASE_PRODUCAO;
  const res = await fetch(`${base}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
    }),
  });

  if (!res.ok) {
    throw new ErroFrete(`Não foi possível renovar o token (HTTP ${res.status})`, "EXPIRADO");
  }

  const dados = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!dados.access_token) {
    throw new ErroFrete("Resposta sem access_token", "RESPOSTA");
  }

  const expiraEm = dados.expires_in
    ? new Date(Date.now() + dados.expires_in * 1000).toISOString()
    : null;

  return {
    ...config,
    accessToken: dados.access_token,
    refreshToken: dados.refresh_token || config.refreshToken,
    tokenExpiresAt: expiraEm,
  };
}

export function tokenVencido(config: FreteConfig): boolean {
  if (!config.tokenExpiresAt) return false;
  // margem de 1 dia para não vencer no meio de uma cotação
  const limite = new Date(config.tokenExpiresAt).getTime() - 24 * 60 * 60 * 1000;
  return Date.now() > limite;
}

/** Cotação real. Lança ErroFrete quando não há como cotar. */
export async function cotarNoMelhorEnvio(
  config: FreteConfig,
  cepDestino: string,
  itens: ItemFrete[],
  valorSegurado = 0
): Promise<OpcaoFrete[]> {
  if (!config.accessToken) {
    throw new ErroFrete("Melhor Envio não autorizado nesta loja", "SEM_TOKEN");
  }
  if (!config.originCep) {
    throw new ErroFrete("CEP de origem não configurado", "API");
  }

  const base = config.sandbox ? BASE_SANDBOX : BASE_PRODUCAO;

  const corpo = {
    from: { postal_code: config.originCep.replace(/\D/g, "") },
    to: { postal_code: cepDestino.replace(/\D/g, "") },
    products: itens.map((item, indice) => ({
      id: String(indice + 1),
      width: Math.max(1, Math.round(item.largura || 11)),
      height: Math.max(1, Math.round(item.altura || 2)),
      length: Math.max(1, Math.round(item.profundidade || 16)),
      // a API espera kg; o cadastro da loja guarda gramas
      weight: Math.max(0.1, Number(((item.peso || 300) / 1000).toFixed(3))),
      insurance_value: Number((valorSegurado / Math.max(1, itens.length)).toFixed(2)),
      quantity: Math.max(1, Math.round(item.quantidade || 1)),
    })),
    options: { receipt: false, own_hand: false },
  };

  const res = await fetch(`${base}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.accessToken}`,
      // o Melhor Envio exige identificação com e-mail de contato
      "User-Agent": "CarCrew Garage (contato@carcrew.com.br)",
    },
    body: JSON.stringify(corpo),
  });

  if (res.status === 401) {
    throw new ErroFrete("Token recusado pelo Melhor Envio", "EXPIRADO");
  }

  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new ErroFrete(
      `Melhor Envio respondeu ${res.status}: ${texto.slice(0, 140)}`,
      "API"
    );
  }

  const dados = (await res.json()) as RespostaME[] | { errors?: unknown };
  if (!Array.isArray(dados)) {
    throw new ErroFrete("Resposta inesperada do Melhor Envio", "RESPOSTA");
  }

  const opcoes = mapearResposta(dados);
  if (opcoes.length === 0) {
    throw new ErroFrete("Nenhuma transportadora atende este CEP", "API");
  }

  return opcoes;
}
