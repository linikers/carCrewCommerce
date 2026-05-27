// Admin CRUD — Categorias via Prisma

import prisma from "@/lib/prisma";

export interface CategoriaData {
  id: number;
  slug: string;
  nome: string;
  icone: string;
  descricao: string;
  ordem: number;
}

export async function lerCategorias(): Promise<CategoriaData[]> {
  const categorias = await prisma.categoria.findMany({
    orderBy: { ordem: "asc" },
  });

  return categorias.map((c) => ({
    id: c.id,
    slug: c.slug,
    nome: c.nome,
    icone: c.icone || "🔧",
    descricao: c.descricao || "",
    ordem: c.ordem,
  }));
}

export async function salvarCategorias(categorias: CategoriaData[]) {
  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { slug: c.slug },
      update: {
        nome: c.nome,
        icone: c.icone || "🔧",
        descricao: c.descricao || "",
        ordem: c.ordem,
      },
      create: {
        slug: c.slug,
        nome: c.nome,
        icone: c.icone || "🔧",
        descricao: c.descricao || "",
        ordem: c.ordem,
      },
    });
  }
}

export async function proximoId(): Promise<number> {
  const ultimo = await prisma.categoria.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  return (ultimo?.id || 0) + 1;
}
