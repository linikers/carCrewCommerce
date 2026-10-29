import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { relatorioResultado } from "@/modules/relatorios/dados/resultado";
import { normalizarCanal } from "@/lib/venda-import";

/**
 * Resultado do período (#191, PR-5): receita, custos, resultado e margem —
 * por canal e por SKU, com o bloco de qualidade do dado.
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("relatorios");
  if (bloqueio) return bloqueio;

  const params = req.nextUrl.searchParams;

  const ate = params.get("ate") ? new Date(String(params.get("ate"))) : new Date();
  const de = params.get("de")
    ? new Date(String(params.get("de")))
    : new Date(ate.getFullYear(), ate.getMonth(), 1);
  // fim do dia: sem isso o filtro `<= ate` perde as vendas do próprio dia
  ate.setHours(23, 59, 59, 999);

  if (Number.isNaN(de.getTime()) || Number.isNaN(ate.getTime())) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  const canalBruto = params.get("canal");
  const canal = canalBruto ? normalizarCanal(canalBruto) : null;

  try {
    const relatorio = await relatorioResultado({ de, ate, canal });
    return NextResponse.json(relatorio);
  } catch (error) {
    console.error("[admin/relatorios/resultado] falha:", error);
    return NextResponse.json({ error: "Não foi possível montar o relatório" }, { status: 500 });
  }
}
