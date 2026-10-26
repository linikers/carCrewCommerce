import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { lerProdutos, salvarProdutos, proximoId, ProdutoData } from "@/lib/produtos-admin";

// GET /api/admin/produtos — listar todos
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const produtos = await lerProdutos();
  return NextResponse.json(produtos);
}

// POST /api/admin/produtos — criar novo
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const { nome, sku, ncm, cest, cfop, origem, cstIcms, unidade, descricao, preco, imgUrl, category, parcelamento, estoque, peso, altura, largura, profundidade, veiculos, galeria, destaque, ordem } = body;

    if (!nome || !preco) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios" },
        { status: 400 }
      );
    }

    const id = await proximoId();
    const novoProduto: ProdutoData = {
      id,
      nome,
      sku: sku ? String(sku).trim().toUpperCase() : null,
      descricao: descricao || "",
      preco: Number(preco),
      imgUrl: imgUrl || "/produtos/placeholder.svg",
      category: category || "amortecedores",
      parcelamento: Number(parcelamento) || 12,
      estoque: Number(estoque) || 0,
      // fiscal (#78) — sem NCM/CFOP a peça não entra em nota
      ncm: ncm ? String(ncm).replace(/\D/g, "") : null,
      cest: cest ? String(cest).replace(/\D/g, "") : null,
      cfop: cfop ? String(cfop).replace(/\D/g, "") : null,
      origem: origem !== undefined ? Number(origem) : 0,
      cstIcms: cstIcms || null,
      unidade: unidade || "UN",
      destaque: Boolean(destaque),
      ordem: Number(ordem) || 0,
      ativo: true,
      criadoEm: new Date().toISOString(),
      peso: peso !== undefined && peso !== "" ? Number(peso) : null,
      altura: altura !== undefined && altura !== "" ? Number(altura) : null,
      largura: largura !== undefined && largura !== "" ? Number(largura) : null,
      profundidade: profundidade !== undefined && profundidade !== "" ? Number(profundidade) : null,
      veiculos: Array.isArray(veiculos)
        ? veiculos
        : String(veiculos || "").split(",").map((v) => v.trim()).filter(Boolean),
      // A galeria era coletada na tela e descartada aqui: o schema só tinha
      // imgUrl. Agora persiste.
      imagens: Array.isArray(galeria) ? galeria.filter(Boolean) : [],
    };

    await salvarProdutos([novoProduto]);

    return NextResponse.json(novoProduto, { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Já existe um produto com este SKU" }, { status: 409 });
    }
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    );
  }
}
