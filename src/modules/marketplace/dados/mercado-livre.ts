import { lerCredencialCompleta, salvarCredencial } from "./credenciais";

/**
 * Cliente HTTP do Mercado Livre (OAuth + leitura de pedidos).
 *
 * Por que OAuth e não "colar token": o access token do ML dura ~6 h. Pedir para
 * o dono colar token a cada 6 horas não é integração — o refresh token é o que
 * mantém a conexão viva, e ele só existe se o fluxo for OAuth.
 *
 * Nada aqui escreve no ML: as chamadas são GET (usuário e pedidos).
 */

const API = "https://api.mercadolibre.com";
const AUTORIZACAO = "https://auth.mercadolivre.com.br/authorization";

export interface CredencialML {
  clientId: string;
  clientSecret: string;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiraEm?: string;
}

export function urlAutorizacao(clientId: string, redirectUri: string, state: string): string {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `${AUTORIZACAO}?${q.toString()}`;
}

interface RespostaToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user_id?: number;
}

async function pedirToken(corpo: URLSearchParams): Promise<RespostaToken> {
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: corpo.toString(),
  });
  const texto = await res.text();
  if (!res.ok) {
    // a mensagem daqui é o que o dono lê na tela: não engolir
    throw new Error(`Mercado Livre recusou a autorização (${res.status}): ${texto.slice(0, 200)}`);
  }
  return JSON.parse(texto) as RespostaToken;
}

/** Troca o `code` do callback por access + refresh token. */
export async function trocarCodigo(args: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<RespostaToken> {
  return pedirToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: args.clientId,
      client_secret: args.clientSecret,
      code: args.code,
      redirect_uri: args.redirectUri,
    })
  );
}

export async function renovarToken(args: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<RespostaToken> {
  return pedirToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: args.clientId,
      client_secret: args.clientSecret,
      refresh_token: args.refreshToken,
    })
  );
}

function expiracao(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

/** Grava os tokens cifrados na credencial do canal. */
export async function salvarTokens(
  dados: RespostaToken,
  extras: Record<string, unknown> = {}
): Promise<void> {
  await salvarCredencial("mercado_livre", {
    ...extras,
    accessToken: dados.access_token,
    ...(dados.refresh_token ? { refreshToken: dados.refresh_token } : {}),
    expiraEm: expiracao(dados.expires_in),
    ...(dados.user_id ? { userId: String(dados.user_id) } : {}),
  });
}

export async function credencialML(): Promise<CredencialML | null> {
  const dados = (await lerCredencialCompleta("mercado_livre")) as Record<string, unknown> | null;
  if (!dados) return null;
  const clientId = String(dados.clientId ?? "");
  const clientSecret = String(dados.clientSecret ?? "");
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    userId: dados.userId ? String(dados.userId) : undefined,
    accessToken: dados.accessToken ? String(dados.accessToken) : undefined,
    refreshToken: dados.refreshToken ? String(dados.refreshToken) : undefined,
    expiraEm: dados.expiraEm ? String(dados.expiraEm) : undefined,
  };
}

async function get<T>(caminho: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API}${caminho}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (res.status === 401) throw new Error("TOKEN_INVALIDO");
  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`Mercado Livre ${res.status} em ${caminho}: ${texto.slice(0, 160)}`);
  }
  return (await res.json()) as T;
}

/**
 * Access token válido: renova quando está perto de vencer (5 min de margem) ou
 * quando o ML responde 401 na primeira tentativa.
 */
export async function accessTokenValido(): Promise<{ token: string; cred: CredencialML }> {
  const cred = await credencialML();
  if (!cred) throw new Error("Credenciais do Mercado Livre não cadastradas");
  if (!cred.accessToken && !cred.refreshToken) {
    throw new Error("Conecte o Mercado Livre (botão Conectar) antes de importar");
  }

  const venceEm = cred.expiraEm ? new Date(cred.expiraEm).getTime() : 0;
  const pertoDeVencer = venceEm > 0 && venceEm - Date.now() < 5 * 60 * 1000;

  if (cred.accessToken && !pertoDeVencer) {
    return { token: cred.accessToken, cred };
  }

  if (!cred.refreshToken) throw new Error("Token vencido e sem refresh token: reconecte o Mercado Livre");

  const novo = await renovarToken({
    clientId: cred.clientId,
    clientSecret: cred.clientSecret,
    refreshToken: cred.refreshToken,
  });
  await salvarTokens(novo);
  return { token: novo.access_token, cred: { ...cred, accessToken: novo.access_token } };
}

export interface UsuarioML {
  id: number;
  nickname: string;
  email?: string;
  site_id?: string;
}

export async function usuario(accessToken: string): Promise<UsuarioML> {
  return get<UsuarioML>("/users/me", accessToken);
}

export interface PedidoML {
  id: number;
  status: string;
  date_closed?: string;
  total_amount?: number;
  order_items?: {
    quantity?: number;
    unit_price?: number;
    sale_fee?: number;
    item?: { id?: string; seller_sku?: string; title?: string };
  }[];
  shipping?: { id?: number; cost?: number; base_cost?: number; logistic_type?: string };
  payments?: { total_paid_amount?: number }[];
}

/** Busca pedidos do vendedor no período, com paginação. */
export async function buscarPedidos(args: {
  accessToken: string;
  sellerId: string;
  de: Date;
  ate: Date;
  offset?: number;
  limite?: number;
}): Promise<{ total: number; resultados: PedidoML[] }> {
  const q = new URLSearchParams({
    seller: args.sellerId,
    "order.date_created.from": args.de.toISOString(),
    "order.date_created.to": args.ate.toISOString(),
    sort: "date_desc",
    limit: String(Math.min(args.limite ?? 50, 50)),
    offset: String(args.offset ?? 0),
  });

  const dados = await get<{ paging?: { total?: number }; results?: PedidoML[] }>(
    `/orders/search?${q.toString()}`,
    args.accessToken
  );

  return { total: dados.paging?.total ?? 0, resultados: dados.results ?? [] };
}
