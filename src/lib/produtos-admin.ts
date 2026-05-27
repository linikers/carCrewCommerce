// Admin CRUD — Produtos via Prisma
// Antigo: JSON file read/write

import prisma from "@/lib/prisma";

export interface ProdutoData {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imgUrl: string;
  category: string;
  parcelamento: number;
  estoque: number;
  ativo: boolean;
  criadoEm: string;
}

export async function lerProdutos(): Promise<ProdutoData[]> {
  const produtos = await prisma.produto.findMany({
    orderBy: { criadoEm: "desc" },
    include: { categoria: true },
  });

  return produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao || "",
    preco: p.preco,
    imgUrl: p.imgUrl || "/produtos/placeholder.svg",
    category: p.categorySlug,
    parcelamento: p.parcelamento,
    estoque: p.estoque,
    ativo: p.ativo,
    criadoEm: p.criadoEm.toISOString(),
  }));
}

export async function salvarProdutos(produtos: ProdutoData[]) {
  // Upsert em lote — cria ou atualiza cada produto
  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { id: p.id },
      update: {
        nome: p.nome,
        descricao: p.descricao || null,
        preco: p.preco,
        imgUrl: p.imgUrl || null,
        categorySlug: p.category,
        parcelamento: p.parcelamento,
        estoque: p.estoque,
        ativo: p.ativo,
      },
      create: {
        id: p.id,
        nome: p.nome,
        descricao: p.descricao || null,
        preco: p.preco,
        imgUrl: p.imgUrl || null,
        categorySlug: p.category,
        parcelamento: p.parcelamento,
        estoque: p.estoque,
        ativo: p.ativo,
        veiculos: [],
      },
    });
  }
}

export async function proximoId(): Promise<number> {
  const ultimo = await prisma.produto.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  return (ultimo?.id || 0) + 1;
}
