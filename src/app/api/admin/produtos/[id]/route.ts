import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/admin/produtos/[id] — um produto
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const produto = await prisma.produto.findUnique({
    where: { id: Number(id) },
    include: { categoria: true },
  });

  if (!produto) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao || "",
    preco: produto.preco,
    imgUrl: produto.imgUrl || "/produtos/placeholder.svg",
    category: produto.categorySlug,
    parcelamento: produto.parcelamento,
    estoque: produto.estoque,
    ativo: produto.ativo,
    criadoEm: produto.criadoEm.toISOString(),
  });
}

// PUT /api/admin/produtos/[id] — atualizar
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existente = await prisma.produto.findUnique({
      where: { id: Number(id) },
    });

    if (!existente) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const atualizado = await prisma.produto.update({
      where: { id: Number(id) },
      data: {
        nome: body.nome ?? existente.nome,
        descricao: body.descricao ?? existente.descricao,
        preco: body.preco !== undefined ? Number(body.preco) : existente.preco,
        imgUrl: body.imgUrl ?? existente.imgUrl,
        categorySlug: body.category ?? existente.categorySlug,
        parcelamento: body.parcelamento !== undefined ? Number(body.parcelamento) : existente.parcelamento,
        estoque: body.estoque !== undefined ? Number(body.estoque) : existente.estoque,
        ativo: body.ativo !== undefined ? body.ativo : existente.ativo,
      },
    });

    return NextResponse.json({
      id: atualizado.id,
      nome: atualizado.nome,
      descricao: atualizado.descricao || "",
      preco: atualizado.preco,
      imgUrl: atualizado.imgUrl || "/produtos/placeholder.svg",
      category: atualizado.categorySlug,
      parcelamento: atualizado.parcelamento,
      estoque: atualizado.estoque,
      ativo: atualizado.ativo,
      criadoEm: atualizado.criadoEm.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE /api/admin/produtos/[id] — excluir
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existente = await prisma.produto.findUnique({
      where: { id: Number(id) },
    });

    if (!existente) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    await prisma.produto.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: "Produto excluído" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
