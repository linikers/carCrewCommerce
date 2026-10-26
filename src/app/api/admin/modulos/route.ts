import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { ErroModulo, lerModulos, salvarModulos } from "@/modules/config";
import { MODULOS, dependenciasFaltando } from "@/modules/registro";

/**
 * Estado dos módulos para o painel.
 *
 * Devolve o estado e, para cada módulo, o que falta para poder ligar — a tela
 * usa isso para explicar antes de o dono clicar e tomar erro.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const estado = await lerModulos();

  return NextResponse.json({
    estado,
    modulos: MODULOS.map((m) => ({
      ...m,
      ativo: estado[m.id] === true,
      faltando: m.essencial ? [] : dependenciasFaltando(m.id, estado),
    })),
  });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const estado = await salvarModulos(body as Record<string, boolean>);
    return NextResponse.json({ estado });
  } catch (e) {
    if (e instanceof ErroModulo) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[admin/modulos] falha ao salvar:", e);
    return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  }
}
