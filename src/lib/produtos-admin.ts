// Admin CRUD — Produtos via Prisma
// Antigo: JSON file read/write

import prisma from "@/lib/prisma";

export interface ProdutoData {
  id: number;
  nome: string;
  sku?: string | null;
  descricao: string;
  preco: number;
  descontoPercent?: number;
  imgUrl: string;
  category: string;
  parcelamento: number;
  estoque: number;
  ativo: boolean;
  criadoEm: string;
  // frete (usados no cálculo) e aplicação veicular
  peso?: number | null;
  altura?: number | null;
  largura?: number | null;
  profundidade?: number | null;
  veiculos?: string[];
  imagens?: string[];
  destaque?: boolean;
  ordem?: number;
  // fiscal (#78)
  ncm?: string | null;
  cest?: string | null;
  cfop?: string | null;
  origem?: number | null;
  cstIcms?: string | null;
  unidade?: string | null;
}

export async function lerProdutos(): Promise<ProdutoData[]> {
  const produtos = await prisma.produto.findMany({
    orderBy: { criadoEm: "desc" },
    include: { categoria: true },
  });

  return produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    sku: p.sku,
    descricao: p.descricao || "",
    preco: p.preco,
    descontoPercent: p.descontoPercent,
    imgUrl: p.imgUrl || "/produtos/placeholder.svg",
    category: p.categorySlug,
    parcelamento: p.parcelamento,
    estoque: p.estoque,
    ativo: p.ativo,
    criadoEm: p.criadoEm.toISOString(),
    peso: p.peso,
    altura: p.altura,
    largura: p.largura,
    profundidade: p.profundidade,
    veiculos: p.veiculos,
    imagens: p.imagens,
    ncm: p.ncm,
    cest: p.cest,
    cfop: p.cfop,
    origem: p.origem,
    cstIcms: p.cstIcms,
    unidade: p.unidade,
  }));
}

/** Aplica desconto em lote nos ids informados (0 remove). */
export async function aplicarDescontoEmLote(ids: number[], percentual: number) {
  const antes = await prisma.produto.findMany({
    where: { id: { in: ids } },
    select: { id: true, descontoPercent: true },
  });

  const { count } = await prisma.produto.updateMany({
    where: { id: { in: ids } },
    data: { descontoPercent: percentual },
  });

  return { atualizados: count, antes };
}

export async function salvarProdutos(produtos: ProdutoData[]) {
  // Upsert em lote — cria ou atualiza cada produto
  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { id: p.id },
      update: {
        nome: p.nome,
      sku: p.sku ?? null,
      ncm: p.ncm ?? null,
      cest: p.cest ?? null,
      cfop: p.cfop ?? null,
      origem: p.origem ?? 0,
      cstIcms: p.cstIcms ?? null,
      unidade: p.unidade ?? "UN",
        descricao: p.descricao || null,
        preco: p.preco,
      descontoPercent: p.descontoPercent ?? 0,
        imgUrl: p.imgUrl || null,
        categorySlug: p.category,
        peso: p.peso ?? null,
        altura: p.altura ?? null,
        largura: p.largura ?? null,
        profundidade: p.profundidade ?? null,
        veiculos: p.veiculos ?? [],
        imagens: p.imagens ?? [],
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
        peso: p.peso ?? null,
        altura: p.altura ?? null,
        largura: p.largura ?? null,
        profundidade: p.profundidade ?? null,
        veiculos: p.veiculos ?? [],
        imagens: p.imagens ?? [],
        parcelamento: p.parcelamento,
        estoque: p.estoque,
        ativo: p.ativo,
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

/** Produtos com preço para a prévia da política (#preco). */
export async function produtosParaExemplo(limite = 3) {
  return prisma.produto.findMany({
    where: { ativo: true, preco: { gt: 0 } },
    orderBy: { id: "asc" },
    take: limite,
    select: { nome: true, preco: true, precoBase: true },
  });
}
