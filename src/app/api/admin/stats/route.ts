import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const [
    produtos,
    usuarios,
    banners,
    totalEstoqueAgg,
  ] = await Promise.all([
    prisma.produto.findMany({ where: { ativo: true } }),
    prisma.user.count(),
    prisma.banner.findMany({ where: { ativo: true } }),
    prisma.produto.aggregate({ _sum: { estoque: true } }),
  ]);

  // Últimos 5 produtos
  const ultimosProdutos = produtos
    .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
    .slice(0, 5)
    .map((p) => ({ id: p.id, nome: p.nome, preco: p.preco, estoque: p.estoque }));

  // Simula vendas dos últimos 6 meses (mock)
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const vendasPorMes = meses.map((mes) => ({
    mes,
    valor: Math.floor(Math.random() * 15000) + 3000,
    pedidos: Math.floor(Math.random() * 20) + 5,
  }));

  return NextResponse.json({
    produtos: produtos.length,
    usuarios,
    banners: banners.length,
    estoque: totalEstoqueAgg._sum.estoque || 0,
    ultimosProdutos,
    vendasPorMes,
  });
}
