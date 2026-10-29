/**
 * Resultado de uma venda — domínio puro (#191).
 *
 * É a **única** fórmula do sistema. Pedido, relatório e simulador do painel
 * chamam esta função; três fórmulas diferentes dariam três números para a mesma
 * venda, que é exatamente o que o cliente reclamava do sistema antigo.
 *
 * Vocabulário fixo (não trocar sem trocar a tela):
 *   margemContribuicao = receita − custo − comissão − frete − imposto − embalagem
 *   resultado          = margemContribuicao − ads
 *
 * `ads` fica fora da margem de contribuição de propósito: mídia é despesa
 * discricionária, e o dono precisa ver quanto sobra antes de anunciar.
 */

export type CanalVenda = "site" | "mercado_livre" | "shopee" | "manual";

export const CANAIS_VENDA: CanalVenda[] = ["site", "mercado_livre", "shopee", "manual"];

export const ROTULO_CANAL: Record<CanalVenda, string> = {
  site: "Site",
  mercado_livre: "Mercado Livre",
  shopee: "Shopee",
  manual: "Manual / balcão",
};

export interface ComissaoCanal {
  /** % que a plataforma cobra sobre a venda */
  percentual: number;
  /** valor fixo por item (Shopee cobra; ML cobra em faixa de preço) */
  fixo: number;
}

export interface CustosVenda {
  receita: number;
  custoItens: number;
  comissao: number;
  freteVendedor: number;
  imposto: number;
  embalagem: number;
  ads: number;
}

export interface ResultadoVenda {
  receita: number;
  custoTotal: number;
  margemContribuicao: number;
  mcPercent: number;
  resultado: number;
  margemPercent: number;
  /** quanto de anúncio a venda aguenta antes de zerar */
  tetoAds: number;
  prejuizo: boolean;
}

export function arredondar(valor: number): number {
  return Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;
}

/** Comissão da plataforma: % sobre a receita + fixo por item. */
export function comissaoDe(
  canal: string,
  receita: number,
  comissoes: Record<string, ComissaoCanal | undefined>
): number {
  const regra = comissoes[canal];
  if (!regra) return 0;
  return arredondar((receita * regra.percentual) / 100 + regra.fixo);
}

export function impostoDe(receita: number, percentual: number): number {
  return arredondar((receita * percentual) / 100);
}

export function calcularResultado(custos: CustosVenda): ResultadoVenda {
  const receita = arredondar(custos.receita);

  const custosSemMidia = arredondar(
    custos.custoItens + custos.comissao + custos.freteVendedor + custos.imposto + custos.embalagem
  );
  const custoTotal = arredondar(custosSemMidia + custos.ads);

  // margem de contribuição = antes da mídia
  const margemContribuicao = arredondar(receita - custosSemMidia);
  const resultado = arredondar(margemContribuicao - custos.ads);

  return {
    receita,
    custoTotal,
    margemContribuicao,
    mcPercent: receita > 0 ? arredondar((margemContribuicao / receita) * 100) : 0,
    resultado,
    margemPercent: receita > 0 ? arredondar((resultado / receita) * 100) : 0,
    // arredonda para baixo no centavo: teto de ads não pode prometer lucro
    tetoAds: Math.max(0, Math.floor(margemContribuicao * 100) / 100),
    prejuizo: resultado < 0,
  };
}
