import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/admin/categorias/[id] — uma categoria
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const categoria = await prisma.categoria.findUnique({
    where: { id: Number(id) },
  });

  if (!categoria) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  return NextResponse.json(categoria);
}

// PUT /api/admin/categorias/[id] — atualizar
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();

    const existente = await prisma.categoria.findUnique({
      where: { id: Number(id) },
    });

    if (!existente) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    // O slug é a FK usada por Produto.categorySlug. Trocar o slug de uma
    // categoria com produtos violava a constraint e devolvia 500 genérico,
    // sem explicar nada e sem alterar nada.
    if (body.slug && body.slug !== existente.slug) {
      const emUso = await prisma.produto.count({
        where: { categorySlug: existente.slug },
      });
      if (emUso > 0) {
        return NextResponse.json(
          {
            error: `${emUso} produto(s) usam esta categoria. Para trocar o slug é preciso mover os produtos antes.`,
          },
          { status: 409 }
        );
      }
    }

    const atualizado = await prisma.categoria.update({
      where: { id: Number(id) },
      data: {
        slug: body.slug ?? existente.slug,
        nome: body.nome ?? existente.nome,
        icone: body.icone ?? existente.icone,
        descricao: body.descricao ?? existente.descricao,
        ordem: body.ordem ?? existente.ordem,
      },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE /api/admin/categorias/[id] — excluir
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const existente = await prisma.categoria.findUnique({
      where: { id: Number(id) },
    });

    if (!existente) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    // Verifica se há produtos vinculados
    const produtosCount = await prisma.produto.count({
      where: { categorySlug: existente.slug },
    });

    if (produtosCount > 0) {
      return NextResponse.json(
        { error: `Exclua os ${produtosCount} produto(s) desta categoria antes` },
        { status: 400 }
      );
    }

    await prisma.categoria.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: "Categoria excluída" });
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
