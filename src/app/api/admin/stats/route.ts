import { requireAdmin } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/**
 * Números do dashboard.
 *
 * Antes `vendasPorMes` era `Math.random()` — o gráfico de vendas era
 * inventado a cada request, com valores diferentes a cada F5. Agora soma os
 * pedidos reais dos últimos 6 meses.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const inicioPeriodo = new Date();
    inicioPeriodo.setDate(1);
    inicioPeriodo.setHours(0, 0, 0, 0);
    inicioPeriodo.setMonth(inicioPeriodo.getMonth() - 5);

    const [
      produtos,
      usuarios,
      banners,
      totalEstoqueAgg,
      pedidosPeriodo,
      pedidosRecentes,
      pedidosAbertos,
    ] = await Promise.all([
      prisma.produto.findMany({ where: { ativo: true } }),
      prisma.user.count(),
      prisma.banner.findMany({ where: { ativo: true } }),
      prisma.produto.aggregate({ _sum: { estoque: true } }),
      prisma.pedido.findMany({
        where: { createdAt: { gte: inicioPeriodo } },
        select: { total: true, createdAt: true, status: true, resultado: true, ads: true },
      }),
      // 4.2: "Pedidos Recentes" era um texto fixo dizendo "nenhum pedido".
      // Agora são os 5 últimos de verdade, com o cliente.
      prisma.pedido.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.pedido.count({
        where: { status: { in: ["aguardando_pagamento", "pago", "em_separacao"] } },
      }),
    ]);

    const ultimosProdutos = produtos
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, 5)
      .map((p) => ({ id: p.id, nome: p.nome, preco: p.preco, estoque: p.estoque }));

    // agrupa por mês, ignorando cancelado
    const balde = new Map<string, { mes: string; valor: number; pedidos: number; resultado: number }>();
    for (let i = 0; i < 6; i++) {
      const d = new Date(inicioPeriodo);
      d.setMonth(d.getMonth() + i);
      const chave = `${d.getFullYear()}-${d.getMonth()}`;
      balde.set(chave, { mes: MESES[d.getMonth()], valor: 0, pedidos: 0, resultado: 0 });
    }

    for (const p of pedidosPeriodo) {
      if (p.status === "cancelado") continue;
      const chave = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`;
      const item = balde.get(chave);
      if (!item) continue;
      item.valor += p.total;
      item.pedidos += 1;
      item.resultado += p.resultado ?? 0;
    }

    const vendasPorMes = [...balde.values()];

    const pedidosValidos = pedidosPeriodo.filter((p) => p.status !== "cancelado");
    const totalVendas = pedidosValidos.reduce((s, p) => s + p.total, 0);

    // resultado do período (#191 PR-5): só venda com custo completo entra.
    // Venda sem custo de peça é contada à parte — é o que trava o número.
    const comResultado = pedidosValidos.filter((p) => p.resultado !== null);
    const resultadoPeriodo = Number(
      comResultado.reduce((s, p) => s + (p.resultado ?? 0), 0).toFixed(2)
    );
    const receitaComResultado = comResultado.reduce((s, p) => s + p.total, 0);
    const margemPercent =
      receitaComResultado > 0
        ? Number(((resultadoPeriodo / receitaComResultado) * 100).toFixed(2))
        : 0;
    const vendasSemCusto = pedidosValidos.length - comResultado.length;

    // 4.6: nenhum alerta de saúde da operação. Isto é o que trava venda:
    // produto sem preço não fecha pedido, produto esgotado aparece na vitrine.
    const semPreco = produtos.filter((p) => p.preco <= 0).length;
    const esgotados = produtos.filter((p) => p.estoque <= 0).length;
    const estoqueBaixo = produtos.filter((p) => p.estoque > 0 && p.estoque <= 2).length;

    return NextResponse.json({
      produtos: produtos.length,
      usuarios,
      banners: banners.length,
      estoque: totalEstoqueAgg._sum.estoque || 0,
      ultimosProdutos,
      vendasPorMes,
      pedidos: pedidosValidos.length,
      totalVendas,
      resultado: resultadoPeriodo,
      margemPercent,
      vendasSemCusto,
      pedidosAbertos,
      ultimosPedidos: pedidosRecentes.map((p) => ({
        id: p.id,
        total: p.total,
        status: p.status,
        criadoEm: p.createdAt,
        cliente: p.user?.name || p.user?.email || "Cliente sem nome",
      })),
      alertas: { semPreco, esgotados, estoqueBaixo },
      // deixa explícito na tela que o gráfico é receita real
      vendasFonte: "pedidos",
    });
  } catch (error) {
    console.error("[admin/stats] falha ao carregar:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os números." },
      { status: 503 }
    );
  }
}
