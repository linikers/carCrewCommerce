// API pública — Categorias
// Retorna categorias para o front-end
// Quando não há banco configurado, retorna array vazio

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { ordem: "asc" },
    });

    const data = categorias.map((c) => ({
      slug: c.slug,
      nome: c.nome,
      icone: c.icone || "🔧",
    }));

    return NextResponse.json(data);
  } catch {
    // Sem banco configurado — retorna vazio
    return NextResponse.json([]);
  }
}
