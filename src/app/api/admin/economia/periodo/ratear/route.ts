import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { auditar } from "@/lib/auditoria";
import { ratearCustoPeriodo } from "@/lib/custos-periodo";

/**
 * Aplica um lançamento de período nas vendas (#191, PR-4).
 *
 * Rateio proporcional à receita dentro do canal e do período. Idempotência:
 * ratear duas vezes soma de novo — a tela avisa que já foi rateado antes.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("relatorios");
  if (bloqueio) return bloqueio;

  try {
    const body = await req.json();
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Informe o lançamento" }, { status: 400 });

    const resultado = await ratearCustoPeriodo(id);

    await auditar({
      entidade: "economia",
      entidadeId: id,
      acao: "alterar",
      antes: { rateado: false },
      depois: {
        rateado: true,
        tipo: resultado.tipo,
        canal: resultado.canal,
        pedidos: resultado.pedidos,
        aplicado: resultado.aplicado,
        somaAplicada: resultado.somaAplicada,
        valorLancado: resultado.valorLancado,
      },
    });

    return NextResponse.json({
      ok: true,
      ...resultado,
      mensagem:
        `${resultado.aplicado} venda(s) receberam o rateio` +
        (resultado.foraDoRateio ? ` · ${resultado.foraDoRateio} ficaram fora (ads digitado à mão)` : "") +
        ` · total ${resultado.somaAplicada.toFixed(2)} de ${resultado.valorLancado.toFixed(2)}`,
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Não foi possível ratear";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }
}
