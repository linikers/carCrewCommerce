import { NextRequest, NextResponse } from "next/server";
import { lerCategorias, salvarCategorias } from "@/lib/categorias-admin";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const categorias = lerCategorias();
    const index = categorias.findIndex((c) => c.id === Number(id));

    if (index === -1) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    categorias[index] = { ...categorias[index], ...body };
    salvarCategorias(categorias);
    return NextResponse.json(categorias[index]);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const categorias = lerCategorias();
  const index = categorias.findIndex((c) => c.id === Number(id));

  if (index === -1) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  categorias.splice(index, 1);
  salvarCategorias(categorias);
  return NextResponse.json({ message: "Categoria excluída" });
}
