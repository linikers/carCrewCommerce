/**
 * Regras fiscais — domínio puro (#78).
 *
 * Nada aqui emite nota. Este módulo responde duas perguntas:
 * 1. o cadastro está completo e válido?
 * 2. dada a origem da venda, **deve** emitir?
 *
 * A emissão em si é o #79.
 */

export type OrigemVenda = "site" | "shopee" | "mercado_livre" | "manual" | "pdv";

export const ORIGEM_LABEL: Record<OrigemVenda, string> = {
  site: "Loja própria",
  shopee: "Shopee",
  mercado_livre: "Mercado Livre",
  manual: "Lançado à mão",
  pdv: "Balcão (PDV)",
};

/** Política de emissão por canal. */
export interface PoliticaEmissao {
  /** Loja própria: desligado por padrão — o dono decide quando ligar. */
  emitirSite: boolean;
  /** Marketplace: ligado por padrão — sem nota o repasse fica travado. */
  emitirMarketplace: boolean;
  /** Balcão: futuro (PDV). */
  emitirPdv: boolean;
  /** homologacao | producao */
  ambiente: "homologacao" | "producao";
  /** Emitir só depois do pagamento confirmado (padrão) ou na criação. */
  momento: "pagamento_confirmado" | "criacao";
}

export const POLITICA_PADRAO: PoliticaEmissao = {
  emitirSite: false,
  emitirMarketplace: true,
  emitirPdv: false,
  ambiente: "homologacao",
  momento: "pagamento_confirmado",
};

export interface ProdutoFiscal {
  ncm: string | null;
  cfop: string | null;
  cstIcms: string | null;
  unidade: string | null;
  origem: number | null;
}

export interface PendenciaProduto {
  produtoId: number;
  nome: string;
  sku: string | null;
  faltando: string[];
}

/** CNPJ válido (algoritmo oficial, não só contagem de dígitos). */
export function cnpjValido(cnpj: string): boolean {
  const digitos = (cnpj || "").replace(/\D/g, "");
  if (digitos.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digitos)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, ...pesos1];

  const calcula = (base: string, pesos: number[]) =>
    base
      .split("")
      .reduce((soma, digito, i) => soma + Number(digito) * pesos[i], 0);

  const resto = (soma: number) => {
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const dv1 = resto(calcula(digitos.slice(0, 12), pesos1));
  const dv2 = resto(calcula(digitos.slice(0, 13), pesos2));

  return dv1 === Number(digitos[12]) && dv2 === Number(digitos[13]);
}

export function ncmValido(ncm: string): boolean {
  return /^\d{8}$/.test((ncm || "").replace(/\D/g, ""));
}

export function cfopValido(cfop: string): boolean {
  return /^\d{4}$/.test((cfop || "").replace(/\D/g, ""));
}

/** O que falta na peça para ela poder entrar numa nota. */
export function pendenciasDoProduto(produto: ProdutoFiscal & { id: number; nome: string; sku: string | null }): string[] {
  const faltando: string[] = [];
  if (!produto.ncm || !ncmValido(produto.ncm)) faltando.push("NCM");
  if (!produto.cfop || !cfopValido(produto.cfop)) faltando.push("CFOP");
  if (!produto.cstIcms) faltando.push("CST/ICMS");
  if (!produto.unidade) faltando.push("Unidade");
  return faltando;
}

/**
 * A pergunta central: esta venda deve gerar nota?
 * Regra do dono: site é opcional, marketplace é padrão.
 */
export function deveEmitir(origem: OrigemVenda, politica: PoliticaEmissao): boolean {
  switch (origem) {
    case "site":
      return politica.emitirSite;
    case "shopee":
    case "mercado_livre":
      return politica.emitirMarketplace;
    case "pdv":
      return politica.emitirPdv;
    case "manual":
      return false;
  }
}

/** Emissão bloqueada de fato, com o motivo escrito para o dono ler. */
export function porQueNaoEmite(
  origem: OrigemVenda,
  politica: PoliticaEmissao,
  temCertificado: boolean,
  cadastroCompleto: boolean
): string | null {
  if (!deveEmitir(origem, politica)) {
    return `Emissão desligada para ${ORIGEM_LABEL[origem].toLowerCase()}.`;
  }
  if (!cadastroCompleto) return "Cadastro da empresa incompleto (CNPJ, IE e endereço).";
  if (!temCertificado) return "Sem certificado A1 válido — a nota não pode ser assinada.";
  return null;
}
