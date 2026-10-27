import prisma from "@/lib/prisma";

/**
 * Política de preço por canal (#preco).
 *
 * O preço é um só número no banco (`produtos.preco`) e ele é o preço **do
 * site**, já com a política aplicada. O `precoBase` guarda a referência (o
 * preço praticado no marketplace), e a partir dele o site calcula o seu.
 *
 * Ordem de resolução:
 *   1. exceção do item no canal  (`preco_canal`)
 *   2. política do canal         (`configuracoes.preco.canais[canal]`)
 *   3. preço base
 *
 * Nada configurado = preço base, sem desconto. Ligar a política não mexe em
 * pedido antigo: o preço pago fica gravado no item.
 */

export const CANAIS = ["site", "mercado_livre", "shopee"] as const;
export type Canal = (typeof CANAIS)[number];

export const ROTULO_CANAL: Record<Canal, string> = {
  site: "Site",
  mercado_livre: "Mercado Livre",
  shopee: "Shopee",
};

export interface PoliticaPreco {
  /** % de desconto do site sobre o preço base (0–90) */
  sitePercent: number;
  /** % por canal de marketplace (0–90) */
  canais: Record<string, number>;
  /** como o preço aparece na vitrine */
  exibicao: "seco" | "comparativo";
  atualizadoEm?: string;
}

const CHAVE = "preco";

export const POLITICA_PADRAO: PoliticaPreco = {
  sitePercent: 0,
  canais: { mercado_livre: 0, shopee: 0 },
  exibicao: "seco",
};

function limitar(valor: unknown): number {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(90, Math.round(n * 2) / 2);
}

export async function lerPoliticaPreco(): Promise<PoliticaPreco> {
  try {
    const linha = await prisma.configuracao.findUnique({ where: { chave: CHAVE } });
    const valor = (linha?.valor ?? {}) as Partial<PoliticaPreco>;

    const canais: Record<string, number> = {};
    for (const canal of Object.keys(valor.canais ?? {})) {
      canais[canal] = limitar(valor.canais?.[canal]);
    }

    return {
      sitePercent: limitar(valor.sitePercent),
      canais,
      exibicao: valor.exibicao === "comparativo" ? "comparativo" : "seco",
    };
  } catch (erro) {
    console.error("[politica-preco] não consegui ler a configuração:", erro);
    return POLITICA_PADRAO;
  }
}

/** Salva a política na tabela `configuracoes`. */
export async function salvarPoliticaPreco(politica: PoliticaPreco): Promise<PoliticaPreco> {
  const antes = await lerPoliticaPreco();

  await prisma.configuracao.upsert({
    where: { chave: CHAVE },
    create: { chave: CHAVE, valor: politica as unknown as object },
    update: { valor: politica as unknown as object },
  });

  return antes;
}

/** Aplica um percentual sobre o preço base, arredondando em centavos. */
export function aplicarPercentual(precoBase: number, percentual: number): number {
  const base = Number(precoBase) || 0;
  if (base <= 0 || percentual <= 0) return Number(base.toFixed(2));
  return Number((base * (1 - percentual / 100)).toFixed(2));
}

/**
 * Preço de venda em um canal, dada a política e a eventual exceção do item.
 * `precoFixo` da exceção ganha de tudo.
 */
export function precoDoCanal(
  precoBase: number,
  canal: Canal,
  politica: PoliticaPreco,
  excecao?: { percentual?: number | null; precoFixo?: number | null } | null
): number {
  if (excecao?.precoFixo && excecao.precoFixo > 0) {
    return Number(excecao.precoFixo.toFixed(2));
  }

  const percentualItem = limitar(excecao?.percentual);
  if (percentualItem > 0) return aplicarPercentual(precoBase, percentualItem);

  const percentualCanal =
    canal === "site" ? politica.sitePercent : (politica.canais?.[canal] ?? 0);

  return aplicarPercentual(precoBase, percentualCanal);
}

/** Preço de venda no site para um produto lido do banco. */
export function precoSiteDe(produto: {
  preco: number;
  precoBase?: number | null;
  precosCanal?: { canal: string; percentual: number | null; precoFixo: number | null }[];
}, politica: PoliticaPreco): number {
  const base = produto.precoBase && produto.precoBase > 0 ? produto.precoBase : produto.preco;
  const excecao = produto.precosCanal?.find((p) => p.canal === "site");
  return precoDoCanal(base, "site", politica, excecao);
}
