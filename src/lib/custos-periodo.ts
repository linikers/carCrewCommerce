import prisma from "@/lib/prisma";
import { recalcularVenda } from "@/lib/custos-venda";
import { arredondar } from "@/modules/pedidos/dominio/resultado";

/**
 * Custo por período (#191, PR-4) — ads e fatura do Mercado Livre Full.
 *
 * O Full não manda frete por pedido: manda uma fatura mensal de fulfillment
 * (e outra de armazenagem). Então o custo entra por período e é rateado nas
 * vendas do período, proporcional à receita.
 *
 * O que é rateado por venda e o que não é:
 *   ads         → Pedido.ads
 *   fulfillment → Pedido.freteVendedor  (é o "frete pago pelo vendedor" dele)
 *   armazenagem → NÃO rateia: é custo do negócio, distorce a margem da peça
 *   outros      → NÃO rateia (mesmo motivo)
 */

export const TIPOS_CUSTO = ["ads", "fulfillment", "armazenagem", "outros"] as const;
export type TipoCusto = (typeof TIPOS_CUSTO)[number];

export const ROTULO_TIPO: Record<TipoCusto, string> = {
  ads: "Publicidade (Ads)",
  fulfillment: "Frete / fulfillment (fatura Full)",
  armazenagem: "Armazenagem (fatura Full)",
  outros: "Outros custos do período",
};

/** Campo do pedido que recebe o rateio; null = não rateia por venda. */
export const CAMPO_DO_RATEIO: Record<TipoCusto, "ads" | "freteVendedor" | null> = {
  ads: "ads",
  fulfillment: "freteVendedor",
  armazenagem: null,
  outros: null,
};

export function tipoValido(t: string): t is TipoCusto {
  return (TIPOS_CUSTO as readonly string[]).includes(t);
}

export interface CustoPeriodo {
  id: string;
  tipo: string;
  canal: string;
  inicio: Date;
  fim: Date;
  valor: number;
  observacao: string | null;
  rateadoEm: Date | null;
  criadoEm: Date;
}

export async function listarCustosPeriodo(): Promise<CustoPeriodo[]> {
  return prisma.custoPeriodo.findMany({ orderBy: [{ inicio: "desc" }, { criadoEm: "desc" }], take: 100 });
}

export async function criarCustoPeriodo(entrada: {
  tipo: string;
  canal: string;
  inicio: Date;
  fim: Date;
  valor: number;
  observacao?: string | null;
}): Promise<CustoPeriodo> {
  if (!tipoValido(entrada.tipo)) throw new Error("Tipo de custo inválido");
  if (!(entrada.valor > 0)) throw new Error("Valor precisa ser maior que zero");
  if (entrada.fim < entrada.inicio) throw new Error("Data final antes da inicial");

  return prisma.custoPeriodo.create({
    data: {
      tipo: entrada.tipo,
      canal: entrada.canal,
      inicio: entrada.inicio,
      fim: entrada.fim,
      valor: arredondar(entrada.valor),
      observacao: entrada.observacao?.slice(0, 300) ?? null,
    },
  });
}

export async function removerCustoPeriodo(id: string): Promise<void> {
  await prisma.custoPeriodo.delete({ where: { id } });
}

export interface ResultadoRateio {
  lancamentoId: string;
  tipo: TipoCusto;
  canal: string;
  pedidos: number;
  aplicado: number;
  foraDoRateio: number;
  /** conferência: soma aplicada tem que fechar com o valor lançado */
  somaAplicada: number;
  valorLancado: number;
}

/**
 * Rateia um lançamento nas vendas do período.
 *
 * Soma das parcelas fecha **exatamente** com o valor lançado: a última venda
 * recebe o resto do arredondamento. Um centavo sobrando no rateio é o tipo de
 * diferença que o dono encontra depois e não consegue explicar.
 */
export async function ratearCustoPeriodo(id: string): Promise<ResultadoRateio> {
  const lancamento = await prisma.custoPeriodo.findUnique({ where: { id } });
  if (!lancamento) throw new Error("Lançamento não encontrado");
  if (!tipoValido(lancamento.tipo)) throw new Error("Tipo de custo inválido");

  const campo = CAMPO_DO_RATEIO[lancamento.tipo];
  if (!campo) {
    throw new Error(
      `${ROTULO_TIPO[lancamento.tipo]} não é rateado por venda — é custo do período e aparece no relatório, não na margem da peça.`
    );
  }

  // período do lançamento: usa a data da venda quando existe, senão a criação
  const pedidos = await prisma.pedido.findMany({
    where: {
      canal: lancamento.canal,
      status: { not: "cancelado" },
      OR: [
        { vendaEm: { gte: lancamento.inicio, lte: lancamento.fim } },
        { vendaEm: null, createdAt: { gte: lancamento.inicio, lte: lancamento.fim } },
      ],
    },
    select: { id: true, total: true, ads: true, adsOrigem: true, freteVendedor: true },
    orderBy: { total: "desc" },
  });

  if (pedidos.length === 0) {
    throw new Error("Nenhuma venda neste canal dentro do período — nada para ratear.");
  }

  // ads digitado à mão fica fora do rateio e NÃO entra na base de proporção:
  // incluí-lo fazia o resto do arredondamento cair todo na última venda
  const elegiveis = pedidos.filter(
    (p) => !(campo === "ads" && p.adsOrigem === "manual" && p.ads > 0)
  );
  const foraDoRateio = pedidos.length - elegiveis.length;

  if (elegiveis.length === 0) {
    throw new Error("Todas as vendas do período já têm ads informado à mão — nada a ratear.");
  }

  const receitaTotal = elegiveis.reduce((soma, p) => soma + p.total, 0);
  if (receitaTotal <= 0) throw new Error("Receita do período é zero — não dá para ratear por proporção.");

  let restante = arredondar(lancamento.valor);
  let somaAplicada = 0;
  let aplicado = 0;
  const atualizacoes: { id: string; valor: number }[] = [];

  elegiveis.forEach((pedido, indice) => {
    const ultimo = indice === elegiveis.length - 1;
    const parcela = ultimo
      ? restante
      : arredondar((lancamento.valor * pedido.total) / receitaTotal);

    restante = arredondar(restante - parcela);
    if (parcela <= 0) return;

    const atual = campo === "ads" ? pedido.ads : pedido.freteVendedor ?? 0;
    atualizacoes.push({ id: pedido.id, valor: arredondar(atual + parcela) });
    somaAplicada = arredondar(somaAplicada + parcela);
    aplicado += 1;
  });

  for (const item of atualizacoes) {
    await recalcularVenda(
      item.id,
      campo === "ads"
        ? { ads: item.valor, adsOrigem: "rateio" }
        : { freteVendedor: item.valor }
    );
  }

  await prisma.custoPeriodo.update({ where: { id }, data: { rateadoEm: new Date() } });

  return {
    lancamentoId: id,
    tipo: lancamento.tipo,
    canal: lancamento.canal,
    pedidos: pedidos.length,
    aplicado,
    foraDoRateio,
    somaAplicada,
    valorLancado: lancamento.valor,
  };
}
