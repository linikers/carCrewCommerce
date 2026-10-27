import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { historicoPorPlaca } from "@/modules/os/dados/os";

/** Histórico do carro pela placa (#os). */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("os");
  if (bloqueio) return bloqueio;

  const placa = req.nextUrl.searchParams.get("placa") || "";
  const ignorar = req.nextUrl.searchParams.get("ignorar") || undefined;

  return NextResponse.json({ ordens: await historicoPorPlaca(placa, ignorar) });
}
