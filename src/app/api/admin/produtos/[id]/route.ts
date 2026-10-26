import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auditar } from "@/lib/auditoria";

// GET /api/admin/produtos/[id] — um produto
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

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
    destaque: produto.destaque,
    ordem: produto.ordem,
    criadoEm: produto.criadoEm.toISOString(),
  });
}

// PUT /api/admin/produtos/[id] — atualizar
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

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
        peso: body.peso !== undefined ? (body.peso === "" || body.peso === null ? null : Number(body.peso)) : existente.peso,
        altura: body.altura !== undefined ? (body.altura === "" || body.altura === null ? null : Number(body.altura)) : existente.altura,
        largura: body.largura !== undefined ? (body.largura === "" || body.largura === null ? null : Number(body.largura)) : existente.largura,
        profundidade: body.profundidade !== undefined ? (body.profundidade === "" || body.profundidade === null ? null : Number(body.profundidade)) : existente.profundidade,
        imagens: body.galeria !== undefined
          ? (Array.isArray(body.galeria) ? body.galeria.filter(Boolean) : [])
          : existente.imagens,
        veiculos: body.veiculos !== undefined
          ? (Array.isArray(body.veiculos)
              ? body.veiculos
              : String(body.veiculos).split(",").map((v: string) => v.trim()).filter(Boolean))
          : existente.veiculos,
        ativo: body.ativo !== undefined ? body.ativo : existente.ativo,
        destaque: body.destaque !== undefined ? Boolean(body.destaque) : existente.destaque,
        ordem: body.ordem !== undefined ? Number(body.ordem) || 0 : existente.ordem,
      },
    });

    await auditar({
      entidade: "produto",
      entidadeId: atualizado.id,
      acao: "alterar",
      antes: { preco: existente.preco, estoque: existente.estoque, ativo: existente.ativo, nome: existente.nome },
      depois: { preco: atualizado.preco, estoque: atualizado.estoque, ativo: atualizado.ativo, nome: atualizado.nome },
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
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const existente = await prisma.produto.findUnique({
      where: { id: Number(id) },
    });

    if (!existente) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Soft delete: o produto sai da loja mas continua no histórico.
    // Antes era hard delete — sumia o registro e não havia como reativar.
    await prisma.produto.update({
      where: { id: Number(id) },
      data: { ativo: false },
    });

    await auditar({
      entidade: "produto",
      entidadeId: id,
      acao: "excluir",
      antes: { nome: existente.nome, preco: existente.preco, ativo: existente.ativo },
      depois: { ativo: false },
    });

    return NextResponse.json({ message: "Produto desativado" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
