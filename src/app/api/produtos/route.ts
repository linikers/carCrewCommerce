// API pública — Produtos
// Retorna dados para o front-end (home, detalhe)
// Quando não há banco configurado, retorna array vazio

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const veiculo = searchParams.get("veiculo");
    const search = searchParams.get("search");

    const where: any = { ativo: true };

    if (id) {
      where.id = Number(id);
    }
    if (category) {
      where.categorySlug = category;
    }
    if (veiculo) {
      where.veiculos = { has: veiculo };
    }
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { descricao: { contains: search, mode: "insensitive" } },
      ];
    }

    const produtos = await prisma.produto.findMany({
      where,
      orderBy: { criadoEm: "desc" },
    });

    const data = produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      imgUrl: p.imgUrl || "/produtos/placeholder.svg",
      category: p.categorySlug,
      parcelamento: p.parcelamento,
      veiculos: p.veiculos,
    }));

    return NextResponse.json(data);
  } catch {
    // Sem banco configurado — retorna vazio
    return NextResponse.json([]);
  }
}
