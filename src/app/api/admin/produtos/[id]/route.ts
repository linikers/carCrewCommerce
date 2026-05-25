import { NextRequest, NextResponse } from "next/server";
import { lerProdutos, salvarProdutos } from "@/lib/produtos-admin";

// GET /api/admin/produtos/[id] — um produto
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const produtos = lerProdutos();
  const produto = produtos.find((p) => p.id === Number(id));

  if (!produto) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  return NextResponse.json(produto);
}

// PUT /api/admin/produtos/[id] — atualizar
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const produtos = lerProdutos();
    const index = produtos.findIndex((p) => p.id === Number(id));

    if (index === -1) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const atualizado = {
      ...produtos[index],
      nome: body.nome ?? produtos[index].nome,
      descricao: body.descricao ?? produtos[index].descricao,
      preco: body.preco !== undefined ? Number(body.preco) : produtos[index].preco,
      imgUrl: body.imgUrl ?? produtos[index].imgUrl,
      category: body.category ?? produtos[index].category,
      parcelamento: body.parcelamento !== undefined ? Number(body.parcelamento) : produtos[index].parcelamento,
      estoque: body.estoque !== undefined ? Number(body.estoque) : produtos[index].estoque,
      ativo: body.ativo !== undefined ? body.ativo : produtos[index].ativo,
    };

    produtos[index] = atualizado;
    salvarProdutos(produtos);

    return NextResponse.json(atualizado);
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
  const { id } = await params;
  const produtos = lerProdutos();
  const index = produtos.findIndex((p) => p.id === Number(id));

  if (index === -1) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  produtos.splice(index, 1);
  salvarProdutos(produtos);

  return NextResponse.json({ message: "Produto excluído" });
}
