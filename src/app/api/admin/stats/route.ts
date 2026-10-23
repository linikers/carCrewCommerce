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
    ] = await Promise.all([
      prisma.produto.findMany({ where: { ativo: true } }),
      prisma.user.count(),
      prisma.banner.findMany({ where: { ativo: true } }),
      prisma.produto.aggregate({ _sum: { estoque: true } }),
      prisma.pedido.findMany({
        where: { createdAt: { gte: inicioPeriodo } },
        select: { total: true, createdAt: true, status: true },
      }),
    ]);

    const ultimosProdutos = produtos
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, 5)
      .map((p) => ({ id: p.id, nome: p.nome, preco: p.preco, estoque: p.estoque }));

    // agrupa por mês, ignorando cancelado
    const balde = new Map<string, { mes: string; valor: number; pedidos: number }>();
    for (let i = 0; i < 6; i++) {
      const d = new Date(inicioPeriodo);
      d.setMonth(d.getMonth() + i);
      const chave = `${d.getFullYear()}-${d.getMonth()}`;
      balde.set(chave, { mes: MESES[d.getMonth()], valor: 0, pedidos: 0 });
    }

    for (const p of pedidosPeriodo) {
      if (p.status === "cancelado") continue;
      const chave = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`;
      const item = balde.get(chave);
      if (!item) continue;
      item.valor += p.total;
      item.pedidos += 1;
    }

    const vendasPorMes = [...balde.values()];

    const pedidosValidos = pedidosPeriodo.filter((p) => p.status !== "cancelado");
    const totalVendas = pedidosValidos.reduce((s, p) => s + p.total, 0);

    return NextResponse.json({
      produtos: produtos.length,
      usuarios,
      banners: banners.length,
      estoque: totalEstoqueAgg._sum.estoque || 0,
      ultimosProdutos,
      vendasPorMes,
      pedidos: pedidosValidos.length,
      totalVendas,
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
