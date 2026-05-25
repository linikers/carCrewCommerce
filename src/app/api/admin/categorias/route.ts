import { NextRequest, NextResponse } from "next/server";
import { lerCategorias, salvarCategorias, proximoId, CategoriaData } from "@/lib/categorias-admin";

export async function GET() {
  return NextResponse.json(lerCategorias());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, nome, icone, descricao } = body;

    if (!slug || !nome) {
      return NextResponse.json({ error: "Slug e nome são obrigatórios" }, { status: 400 });
    }

    const categorias = lerCategorias();

    if (categorias.find((c) => c.slug === slug)) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }

    const nova: CategoriaData = {
      id: proximoId(categorias),
      slug,
      nome,
      icone: icone || "📦",
      descricao: descricao || "",
      ordem: categorias.length + 1,
    };

    salvarCategorias([...categorias, nova]);
    return NextResponse.json(nova, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
