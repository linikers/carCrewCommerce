import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { ErroOS } from "@/modules/os/dominio/os";
import { criarOS, listarOS } from "@/modules/os/dados/os";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("os");
  if (bloqueio) return bloqueio;

  const status = req.nextUrl.searchParams.get("status") || undefined;
  const busca = req.nextUrl.searchParams.get("busca") || undefined;

  return NextResponse.json(await listarOS({ status, busca }));
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("os");
  if (bloqueio) return bloqueio;

  try {
    const body = await req.json();
    const ordem = await criarOS(body);
    return NextResponse.json({ ok: true, ordem });
  } catch (e) {
    if (e instanceof ErroOS) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[admin/os] falha ao criar:", e);
    return NextResponse.json({ error: "Não foi possível abrir a OS" }, { status: 500 });
  }
}
