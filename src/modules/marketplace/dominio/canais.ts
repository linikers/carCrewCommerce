/**
 * Catálogo de canais de venda — domínio puro.
 *
 * Camada de cadastro: quais canais existem, o que cada um precisa para
 * autenticar e o que ainda não existe. Sincronizar catálogo/pedido é o #83/#84
 * e o hub genérico é o #82.
 */

export type IdCanal = "shopee" | "mercado_livre";

export interface CampoCredencial {
  chave: string;
  rotulo: string;
  /** senha = campo secreto (não volta na leitura) */
  tipo: "texto" | "senha" | "data";
  obrigatorio: boolean;
  ajuda?: string;
  placeholder?: string;
}

export interface Canal {
  id: IdCanal;
  nome: string;
  /** como obter as credenciais */
  doc: string;
  campos: CampoCredencial[];
  status: "pronto_para_cadastrar" | "em_breve";
}

export const CANAIS: Canal[] = [
  {
    id: "shopee",
    nome: "Shopee",
    doc: "Shopee Open Platform → Console do parceiro → credenciais do app e autorização da loja.",
    status: "pronto_para_cadastrar",
    campos: [
      { chave: "shopId", rotulo: "Shop ID", tipo: "texto", obrigatorio: true, ajuda: "ID numérico da loja autorizada" },
      { chave: "partnerId", rotulo: "Partner ID", tipo: "texto", obrigatorio: true },
      { chave: "partnerKey", rotulo: "Partner Key", tipo: "senha", obrigatorio: true },
      { chave: "accessToken", rotulo: "Access Token", tipo: "senha", obrigatorio: true },
      { chave: "refreshToken", rotulo: "Refresh Token", tipo: "senha", obrigatorio: false },
      { chave: "expiraEm", rotulo: "Token expira em", tipo: "data", obrigatorio: false },
    ],
  },
  {
    id: "mercado_livre",
    nome: "Mercado Livre",
    doc: "Mercado Livre Developers → criar aplicação → dados da aplicação (client id/secret) e OAuth do vendedor.",
    status: "pronto_para_cadastrar",
    campos: [
      { chave: "userId", rotulo: "User ID do vendedor", tipo: "texto", obrigatorio: true, ajuda: "Aparece na URL do seu perfil no ML" },
      { chave: "clientId", rotulo: "Client ID (App ID)", tipo: "texto", obrigatorio: true },
      { chave: "clientSecret", rotulo: "Client Secret", tipo: "senha", obrigatorio: true },
      { chave: "accessToken", rotulo: "Access Token", tipo: "senha", obrigatorio: true },
      { chave: "refreshToken", rotulo: "Refresh Token", tipo: "senha", obrigatorio: false },
      { chave: "expiraEm", rotulo: "Token expira em", tipo: "data", obrigatorio: false },
    ],
  },
];

/** Canais que ainda não têm integração — aparecem na tela como "em breve". */
export const CANAIS_EM_BREVE = [
  { nome: "Amazon", nota: "Marketplace Brasil — exige conta profissional" },
  { nome: "Magalu", nota: "Magazine Luiza — parceiro Magalu" },
  { nome: "TikTok Shop", nota: "Venda por vídeo — operação nova" },
  { nome: "Shein", nota: "Moda — encaixe baixo com peça automotiva" },
];

export function acharCanal(id: string): Canal | undefined {
  return CANAIS.find((c) => c.id === id);
}

/** O que falta preencher para o canal estar cadastrado. */
export function camposFaltando(canal: Canal, dados: Record<string, unknown>): string[] {
  return canal.campos
    .filter((campo) => campo.obrigatorio)
    .filter((campo) => {
      const valor = dados[campo.chave];
      return valor === undefined || valor === null || String(valor).trim() === "";
    })
    .map((campo) => campo.rotulo);
}

/**
 * Credencial "utilizável": obrigatórios preenchidos e token não vencido.
 * Usada só para mostrar situação — não autentica nada ainda.
 */
export function situacaoCredencial(
  canal: Canal,
  dados: Record<string, unknown>
): { estado: "vazio" | "incompleto" | "vencido" | "ok"; faltando: string[] } {
  const faltando = camposFaltando(canal, dados);
  if (Object.keys(dados).length === 0) return { estado: "vazio", faltando };
  if (faltando.length > 0) return { estado: "incompleto", faltando };

  const expira = dados.expiraEm ? new Date(String(dados.expiraEm)) : null;
  if (expira && !Number.isNaN(expira.getTime()) && expira.getTime() < Date.now()) {
    return { estado: "vencido", faltando };
  }

  return { estado: "ok", faltando };
}
