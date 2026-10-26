import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { lerPolitica, salvarPolitica } from "@/modules/fiscal/dados/cadastro";

/**
 * Política de emissão por canal — o liga/desliga que o dono pede.
 * Site desligado por padrão; marketplace ligado (sem nota o repasse trava).
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  return NextResponse.json(await lerPolitica());
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  try {
    const body = await req.json();
    const politica = await salvarPolitica({
      emitirSite: typeof body.emitirSite === "boolean" ? body.emitirSite : undefined,
      emitirMarketplace:
        typeof body.emitirMarketplace === "boolean" ? body.emitirMarketplace : undefined,
      emitirPdv: typeof body.emitirPdv === "boolean" ? body.emitirPdv : undefined,
      ambiente:
        body.ambiente === "producao" || body.ambiente === "homologacao"
          ? body.ambiente
          : undefined,
      momento:
        body.momento === "criacao" || body.momento === "pagamento_confirmado"
          ? body.momento
          : undefined,
    });
    return NextResponse.json(politica);
  } catch (error) {
    console.error("[admin/fiscal/politica] falha:", error);
    return NextResponse.json({ error: "Não foi possível salvar a política." }, { status: 500 });
  }
}
