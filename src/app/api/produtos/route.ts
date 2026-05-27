// API pública — Produtos
// Retorna dados mockados (fallback) + dados do banco (Prisma)
// Enquanto o banco estiver vazio, os produtos mockados aparecem
// Quando o banco for populado, os dados reais aparecem junto

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { produtos as mockProdutos } from "@/lib/produtos";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const veiculo = searchParams.get("veiculo");
    const search = searchParams.get("search");

    // Busca do banco
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

    const dbProdutos = await prisma.produto.findMany({
      where,
      orderBy: { criadoEm: "desc" },
    });

    const dbData = dbProdutos.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao || "",
      preco: p.preco,
      imgUrl: p.imgUrl || "/produtos/placeholder.svg",
      category: p.categorySlug,
      parcelamento: p.parcelamento,
      veiculos: p.veiculos,
    }));

    // Se tem resultados do banco e NÃO tem filtro específico, combina tudo
    // Se tem filtro (id, search, etc.), prioriza o banco + fallback mock
    if (id) {
      // Detalhe — prioriza banco, fallback pra mock
      if (dbData.length > 0) {
        return NextResponse.json(dbData);
      }
      const mock = mockProdutos.filter((p) => p.id === Number(id));
      return NextResponse.json(mock);
    }

    // Filtra mockados pelos mesmos critérios
    let mockFiltered = [...mockProdutos];
    if (category) {
      mockFiltered = mockFiltered.filter((p) => p.category === category);
    }
    if (search) {
      const s = search.toLowerCase();
      mockFiltered = mockFiltered.filter(
        (p) =>
          p.nome.toLowerCase().includes(s) ||
          p.descricao.toLowerCase().includes(s)
      );
    }

    // Combina: dados do banco primeiro, depois mockados
    // Evita duplicar IDs entre mock e banco
    const dbIds = new Set(dbData.map((p) => p.id));
    const combined = [...dbData, ...mockFiltered.filter((p) => !dbIds.has(p.id))];

    return NextResponse.json(combined);
  } catch {
    // Sem banco configurado — retorna só mockados
    const mock = mockProdutos.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      imgUrl: p.imgUrl,
      category: p.category,
      parcelamento: p.parcelamento,
      veiculos: [] as string[],
    }));
    return NextResponse.json(mock);
  }
}
