import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

function lerJson(relativePath: string): any[] {
  try {
    const p = path.join(process.cwd(), "src/data", relativePath);
    if (!existsSync(p)) return [];
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return [];
  }
}

export async function GET() {
  const produtos = lerJson("produtos.json");
  const usuarios = lerJson("usuarios.json");
  const banners = lerJson("banners.json");

  const totalProdutos = produtos.length;
  const totalUsuarios = usuarios.length;
  const totalBanners = banners.filter((b: any) => b.ativo).length;
  const totalEstoque = produtos.reduce((sum: number, p: any) => sum + (p.estoque || 0), 0);

  // Últimos 5 produtos
  const ultimosProdutos = [...produtos]
    .sort((a: any, b: any) => new Date(b.criadoEm || 0).getTime() - new Date(a.criadoEm || 0).getTime())
    .slice(0, 5)
    .map((p: any) => ({ id: p.id, nome: p.nome, preco: p.preco, estoque: p.estoque }));

  // Simula vendas dos últimos 6 meses (mock)
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const vendasPorMes = meses.map((mes, i) => ({
    mes,
    valor: Math.floor(Math.random() * 15000) + 3000,
    pedidos: Math.floor(Math.random() * 20) + 5,
  }));

  return NextResponse.json({
    produtos: totalProdutos,
    usuarios: totalUsuarios,
    banners: totalBanners,
    estoque: totalEstoque,
    ultimosProdutos,
    vendasPorMes,
  });
}
