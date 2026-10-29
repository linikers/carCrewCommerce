import prisma from "@/lib/prisma";
import { lerComissoes, lerEconomia } from "@/lib/economia";
import {
  calcularResultado,
  comissaoDe,
  impostoDe,
  arredondar,
  type ComissaoCanal,
  type ResultadoVenda,
} from "@/modules/pedidos/dominio/resultado";

/**
 * Custos da venda e resultado (#191).
 *
 * `recalcularVenda` é o **único** lugar que grava `resultado`/`margemPercent`.
 * Tela, importação e edição de custo passam por aqui para não existir duas
 * contas para a mesma venda.
 *
 * Regra de honestidade: se algum item está sem custo, o resultado fica **null**
 * (e a tela explica o porquê). Gravar número com custo zero inventaria margem
 * de 100% — foi assim que o sistema antigo do cliente mentiu por meses.
 */

export interface CustosEntrada {
  comissao?: number | null;
  comissaoPercent?: number | null;
  freteVendedor?: number | null;
  imposto?: number | null;
  impostoPercent?: number | null;
  embalagem?: number | null;
  ads?: number | null;
  adsOrigem?: string;
  custosOrigem?: string;
}

export interface CustosPadrao {
  comissao: number;
  comissaoPercent: number;
  imposto: number;
  impostoPercent: number;
  embalagem: number;
}

/** Custos que o sistema sabe calcular sozinho para um canal. */
export async function custosPadraoDoCanal(canal: string, receita: number): Promise<CustosPadrao> {
  const [comissoes, economia] = await Promise.all([lerComissoes(), lerEconomia()]);
  const regra: ComissaoCanal | undefined = (comissoes as Record<string, ComissaoCanal>)[canal];
  const percentual = regra?.percentual ?? 0;

  return {
    comissao: comissaoDe(canal, receita, comissoes),
    comissaoPercent: percentual,
    imposto: impostoDe(receita, economia.impostoPercent),
    impostoPercent: economia.impostoPercent,
    embalagem: economia.embalagemPadrao,
  };
}

export interface RecalculoVenda {
  resultado: ResultadoVenda | null;
  custoItens: number;
  itensSemCusto: number;
}

/**
 * Recalcula e grava o resultado de um pedido.
 *
 * Aceita `extras` para gravar as entradas novas (comissão editada, ads do
 * rateio) na mesma escrita — evitando estado intermediário em que a entrada é
 * nova e o resultado é velho.
 */
export async function recalcularVenda(
  pedidoId: string,
  extras: CustosEntrada = {}
): Promise<RecalculoVenda> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { itens: true },
  });
  if (!pedido) throw new Error(`Pedido não encontrado: ${pedidoId}`);

  const itensSemCusto = pedido.itens.filter((i) => i.custoUnitario === null || i.custoUnitario === undefined).length;
  const custoItens = arredondar(
    pedido.itens.reduce((soma, i) => soma + (i.custoUnitario ?? 0) * i.quantidade, 0)
  );

  const comissao = extras.comissao !== undefined ? extras.comissao : pedido.comissao;
  const freteVendedor = extras.freteVendedor !== undefined ? extras.freteVendedor : pedido.freteVendedor;
  const imposto = extras.imposto !== undefined ? extras.imposto : pedido.imposto;
  const embalagem = extras.embalagem !== undefined ? extras.embalagem : pedido.embalagem;
  const ads = extras.ads !== undefined ? extras.ads : pedido.ads;

  const receita = arredondar(pedido.total);
  const calculo = calcularResultado({
    receita,
    custoItens,
    comissao: comissao ?? 0,
    freteVendedor: freteVendedor ?? 0,
    imposto: imposto ?? 0,
    embalagem: embalagem ?? 0,
    ads: ads ?? 0,
  });

  const incompleto = itensSemCusto > 0;

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: {
      // campo a campo: `extras` aceita null nas entradas, e `ads` é NOT NULL
      ...(extras.comissao !== undefined ? { comissao: extras.comissao } : {}),
      ...(extras.comissaoPercent !== undefined ? { comissaoPercent: extras.comissaoPercent } : {}),
      ...(extras.freteVendedor !== undefined ? { freteVendedor: extras.freteVendedor } : {}),
      ...(extras.imposto !== undefined ? { imposto: extras.imposto } : {}),
      ...(extras.impostoPercent !== undefined ? { impostoPercent: extras.impostoPercent } : {}),
      ...(extras.embalagem !== undefined ? { embalagem: extras.embalagem } : {}),
      ads: ads ?? 0,
      ...(extras.adsOrigem !== undefined ? { adsOrigem: extras.adsOrigem } : {}),
      ...(extras.custosOrigem !== undefined ? { custosOrigem: extras.custosOrigem } : {}),
      // sem custo de peça não existe margem: null, nunca número inventado
      resultado: incompleto ? null : calculo.resultado,
      margemPercent: incompleto ? null : calculo.margemPercent,
    },
  });

  return { resultado: incompleto ? null : calculo, custoItens, itensSemCusto };
}
