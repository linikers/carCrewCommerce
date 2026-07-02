// API pública de produtos — lê do PostgreSQL
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      where: { ativo: true },
      orderBy: { id: "asc" },
    });

    // Formatar pro frontend (JSON-compatible)
    const data = produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao || "",
      preco: p.preco,
      imgUrl: p.imgUrl || "/produtos/placeholder.svg",
      category: p.categorySlug,
      parcelamento: p.parcelamento || 12,
      estoque: p.estoque || 0,
      veiculos: p.veiculos || [],
      ativo: p.ativo,
      // Medidas pra frete
      peso: p.peso || null,
      altura: p.altura || null,
      largura: p.largura || null,
      profundidade: p.profundidade || null,
    }));

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}
