import { NextRequest, NextResponse } from "next/server";
import { lerProdutos, salvarProdutos, proximoId, ProdutoData } from "@/lib/produtos-admin";

// GET /api/admin/produtos — listar todos
export async function GET() {
  const produtos = lerProdutos();
  return NextResponse.json(produtos);
}

// POST /api/admin/produtos — criar novo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, descricao, preco, imgUrl, category, parcelamento, estoque } = body;

    if (!nome || !preco) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios" },
        { status: 400 }
      );
    }

    const produtos = lerProdutos();
    const novoProduto: ProdutoData = {
      id: proximoId(produtos),
      nome,
      descricao: descricao || "",
      preco: Number(preco),
      imgUrl: imgUrl || "/produtos/placeholder.svg",
      category: category || "acessorio-instalacao",
      parcelamento: Number(parcelamento) || 12,
      estoque: Number(estoque) || 0,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };

    salvarProdutos([...produtos, novoProduto]);

    return NextResponse.json(novoProduto, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    );
  }
}
