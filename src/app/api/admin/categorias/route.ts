import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { lerCategorias, salvarCategorias, proximoId, CategoriaData } from "@/lib/categorias-admin";

// GET /api/admin/categorias — listar todas
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const categorias = await lerCategorias();
  return NextResponse.json(categorias);
}

// POST /api/admin/categorias — criar nova
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const { slug, nome, icone, descricao, ordem } = body;

    if (!slug || !nome) {
      return NextResponse.json(
        { error: "Slug e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const id = await proximoId();
    const nova: CategoriaData = {
      id,
      slug,
      nome,
      icone: icone || "🔧",
      descricao: descricao || "",
      ordem: ordem ?? 0,
    };

    await salvarCategorias([nova]);

    return NextResponse.json(nova, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
