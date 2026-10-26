import { requireAdmin, getAdminId } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { listarMovimentos, listarSaldos, registrarMovimento } from "@/modules/estoque/dados/movimentos";
import { ErroEstoque } from "@/modules/estoque/dominio/movimento";

/** Saldo por peça + últimos movimentos. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("estoque");
  if (bloqueio) return bloqueio;

  const [produtos, movimentos] = await Promise.all([listarSaldos(), listarMovimentos(60)]);

  return NextResponse.json({ produtos, movimentos });
}

/** Ajuste manual (entrada, saída ou conferência). */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("estoque");
  if (bloqueio) return bloqueio;

  try {
    const body = await req.json();
    const produtoId = Number(body.produtoId);
    const quantidade = Number(body.quantidade);

    if (!Number.isFinite(produtoId) || produtoId <= 0) {
      return NextResponse.json({ error: "Escolha a peça" }, { status: 400 });
    }

    const movimento = await registrarMovimento({
      produtoId,
      tipo: body.tipo === "saida" ? "saida" : body.tipo === "ajuste" ? "ajuste" : "entrada",
      quantidade,
      motivo: String(body.motivo || "").trim(),
      origem: body.tipo === "ajuste" ? "conferencia" : "manual",
      usuarioId: await getAdminId(),
    });

    return NextResponse.json({ ok: true, movimento });
  } catch (error) {
    if (error instanceof ErroEstoque) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[admin/estoque] falha:", error);
    return NextResponse.json({ error: "Não foi possível registrar" }, { status: 500 });
  }
}
