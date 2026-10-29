import prisma from "@/lib/prisma";
import { arredondar } from "@/modules/pedidos/dominio/resultado";
import { ROTULO_CANAL } from "@/lib/economia";

/**
 * Resultado por período, canal e SKU (#191, PR-5).
 *
 * Duas honestidades embutidas:
 * 1. venda com item sem custo **não entra** no resultado — é contada em
 *    `semCusto` e o total é marcado como incompleto. Somar custo zero daria
 *    margem de 100% numa peça que talvez dê prejuízo.
 * 2. por SKU a conta é **margem bruta** (receita do item − custo do item).
 *    Comissão, imposto, frete e ads são do pedido, não da linha; dividir por
 *    rateio inventado é o tipo de número que ninguém consegue explicar depois.
 */

export interface Periodo {
  de: Date;
  ate: Date;
  canal?: string | null;
}

export interface LinhaCanal {
  canal: string;
  rotulo: string;
  pedidos: number;
  receita: number;
  custos: number;
  resultado: number;
  margemPercent: number;
  semCusto: number;
}

export interface LinhaSku {
  sku: string | null;
  nome: string;
  unidades: number;
  receita: number;
  custo: number;
  margemBruta: number;
  margemPercent: number;
  semCusto: boolean;
}

export interface RelatorioResultado {
  periodo: { de: string; ate: string; canal: string | null };
  total: {
    pedidos: number;
    receita: number;
    custos: number;
    resultado: number;
    margemPercent: number;
    mcPercent: number;
  };
  porCanal: LinhaCanal[];
  topSkus: LinhaSku[];
  pioresSkus: LinhaSku[];
  qualidade: { semCusto: number; semComissao: number; aReceber: number; cancelados: number };
  incompleto: boolean;
}

export async function relatorioResultado(periodo: Periodo): Promise<RelatorioResultado> {
  const filtroCanal = periodo.canal ? { canal: periodo.canal } : {};

  const pedidos = await prisma.pedido.findMany({
    where: {
      ...filtroCanal,
      OR: [
        { vendaEm: { gte: periodo.de, lte: periodo.ate } },
        { vendaEm: null, createdAt: { gte: periodo.de, lte: periodo.ate } },
      ],
    },
    include: { itens: true },
    orderBy: { total: "desc" },
  });

  const validos = pedidos.filter((p) => p.status !== "cancelado");
  const cancelados = pedidos.length - validos.length;
  const aReceber = validos.filter((p) => p.status === "aguardando_pagamento").length;

  const semCusto = validos.filter((p) =>
    p.itens.some((i) => i.custoUnitario === null || i.custoUnitario === undefined)
  ).length;
  const semComissao = validos.filter((p) => (p.comissao ?? 0) === 0 && p.canal !== "site").length;

  const comResultado = validos.filter((p) => p.resultado !== null);

  const somaReceita = comResultado.reduce((s, p) => s + p.total, 0);
  const somaResultado = comResultado.reduce((s, p) => s + (p.resultado ?? 0), 0);
  const somaCustos = arredondar(
    comResultado.reduce(
      (s, p) =>
        s +
        (p.comissao ?? 0) +
        (p.freteVendedor ?? 0) +
        (p.imposto ?? 0) +
        (p.embalagem ?? 0) +
        (p.ads ?? 0) +
        p.itens.reduce((t, i) => t + (i.custoUnitario ?? 0) * i.quantidade, 0),
      0
    )
  );
  const mc = arredondar(somaReceita - (somaCustos - comResultado.reduce((s, p) => s + (p.ads ?? 0), 0)));

  // ── por canal ────────────────────────────────────────────────────────
  const porCanal = new Map<string, LinhaCanal>();
  for (const p of validos) {
    const atual = porCanal.get(p.canal) ?? {
      canal: p.canal,
      rotulo: ROTULO_CANAL[p.canal as keyof typeof ROTULO_CANAL] ?? p.canal,
      pedidos: 0,
      receita: 0,
      custos: 0,
      resultado: 0,
      margemPercent: 0,
      semCusto: 0,
    };
    atual.pedidos += 1;
    if (p.resultado !== null) {
      const custoItens = p.itens.reduce((t, i) => t + (i.custoUnitario ?? 0) * i.quantidade, 0);
      atual.receita = arredondar(atual.receita + p.total);
      atual.resultado = arredondar(atual.resultado + p.resultado);
      atual.custos = arredondar(
        atual.custos +
          (p.comissao ?? 0) +
          (p.freteVendedor ?? 0) +
          (p.imposto ?? 0) +
          (p.embalagem ?? 0) +
          (p.ads ?? 0) +
          custoItens
      );
    } else {
      atual.semCusto += 1;
    }
    porCanal.set(p.canal, atual);
  }
  const canais = [...porCanal.values()]
    .map((c) => ({ ...c, margemPercent: c.receita > 0 ? arredondar((c.resultado / c.receita) * 100) : 0 }))
    .sort((a, b) => b.resultado - a.resultado);

  // ── por SKU (margem bruta) ───────────────────────────────────────────
  const porSku = new Map<string, LinhaSku>();
  for (const p of validos) {
    for (const item of p.itens) {
      const chave = item.sku || item.nome;
      const atual = porSku.get(chave) ?? {
        sku: item.sku,
        nome: item.nome,
        unidades: 0,
        receita: 0,
        custo: 0,
        margemBruta: 0,
        margemPercent: 0,
        semCusto: false,
      };
      atual.unidades += item.quantidade;
      atual.receita = arredondar(atual.receita + item.total);
      if (item.custoUnitario === null || item.custoUnitario === undefined) {
        atual.semCusto = true;
      } else {
        atual.custo = arredondar(atual.custo + item.custoUnitario * item.quantidade);
      }
      porSku.set(chave, atual);
    }
  }
  const skus = [...porSku.values()].map((s) => {
    const margemBruta = arredondar(s.receita - s.custo);
    return {
      ...s,
      margemBruta,
      margemPercent: s.receita > 0 ? arredondar((margemBruta / s.receita) * 100) : 0,
    };
  });

  const comMargem = skus.filter((s) => !s.semCusto);
  const topSkus = [...comMargem].sort((a, b) => b.margemBruta - a.margemBruta).slice(0, 10);
  const pioresSkus = [...comMargem].sort((a, b) => a.margemBruta - b.margemBruta).slice(0, 5);

  return {
    periodo: {
      de: periodo.de.toISOString().slice(0, 10),
      ate: periodo.ate.toISOString().slice(0, 10),
      canal: periodo.canal ?? null,
    },
    total: {
      pedidos: validos.length,
      receita: arredondar(somaReceita),
      custos: somaCustos,
      resultado: arredondar(somaResultado),
      margemPercent: somaReceita > 0 ? arredondar((somaResultado / somaReceita) * 100) : 0,
      mcPercent: somaReceita > 0 ? arredondar((mc / somaReceita) * 100) : 0,
    },
    porCanal: canais,
    topSkus,
    pioresSkus,
    qualidade: { semCusto, semComissao, aReceber, cancelados },
    incompleto: semCusto > 0,
  };
}
