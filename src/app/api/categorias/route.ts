// API pública — Categorias
// Retorna categorias mockadas (fallback) + categorias do banco (Prisma)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { categorias as mockCategorias } from "@/lib/categorias";

export async function GET() {
  try {
    const dbCategorias = await prisma.categoria.findMany({
      orderBy: { ordem: "asc" },
    });

    const dbData = dbCategorias.map((c) => ({
      slug: c.slug,
      nome: c.nome,
      icone: c.icone || "🔧",
    }));

    // Combina: banco primeiro, mock depois (evita slugs duplicados)
    const dbSlugs = new Set(dbData.map((c) => c.slug));
    const combined = [
      ...dbData,
      ...mockCategorias.filter((c) => !dbSlugs.has(c.slug)),
    ];

    return NextResponse.json(combined);
  } catch {
    // Sem banco configurado — retorna só mockadas
    return NextResponse.json(mockCategorias);
  }
}
