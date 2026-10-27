import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { ErroOS } from "@/modules/os/dominio/os";
import {
  adicionarItem,
  atualizarOS,
  lerOS,
  mudarStatus,
  removerItem,
} from "@/modules/os/dados/os";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("os");
  if (bloqueio) return bloqueio;

  const { id } = await params;
  const ordem = await lerOS(id);
  if (!ordem) return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });

  return NextResponse.json(ordem);
}

/** Ações: { acao: "status", status }, { acao: "item", item }, { acao: "removerItem", itemId }, { acao: "editar", dados } */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("os");
  if (bloqueio) return bloqueio;

  const { id } = await params;

  try {
    const body = await req.json();

    switch (body.acao) {
      case "status": {
        const ordem = await mudarStatus(id, String(body.status));
        return NextResponse.json({ ok: true, ordem });
      }
      case "item": {
        const ordem = await adicionarItem(id, body.item);
        return NextResponse.json({ ok: true, ordem });
      }
      case "removerItem": {
        const ordem = await removerItem(id, String(body.itemId));
        return NextResponse.json({ ok: true, ordem });
      }
      case "editar": {
        const ordem = await atualizarOS(id, body.dados ?? {});
        return NextResponse.json({ ok: true, ordem });
      }
      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof ErroOS) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[admin/os/:id] falha:", e);
    return NextResponse.json({ error: "Não foi possível salvar" }, { status: 500 });
  }
}
