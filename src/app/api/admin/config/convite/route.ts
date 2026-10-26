import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { lerConfigConvite, salvarConfigConvite } from "@/lib/site-config";

/** Configuração do convite de lead (popup da home). Só admin. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json(await lerConfigConvite());
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const config = await salvarConfigConvite({
      ativo: typeof body.ativo === "boolean" ? body.ativo : undefined,
      atrasoSegundos:
        body.atrasoSegundos !== undefined ? Number(body.atrasoSegundos) : undefined,
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error("[admin/config/convite] falha ao salvar:", error);
    return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  }
}
