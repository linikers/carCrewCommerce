import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { auditar } from "@/lib/auditoria";
import { gerarPendencias, listarNotas } from "@/modules/fiscal/dados/notas";
import { normalizarCanal } from "@/lib/venda-import";

/**
 * Fila de notas fiscais (interface do emissor).
 *
 * GET lista com contagem por status; POST gera as pendências do período.
 * Nada aqui emite, transmite ou toca no certificado.
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  const p = req.nextUrl.searchParams;
  const de = p.get("de") ? new Date(String(p.get("de"))) : null;
  const ate = p.get("ate") ? new Date(String(p.get("ate"))) : null;
  if (ate) ate.setHours(23, 59, 59, 999);

  const { notas, contagem } = await listarNotas({
    status: p.get("status"),
    canal: p.get("canal") ? normalizarCanal(String(p.get("canal"))) : null,
    de,
    ate,
  });

  return NextResponse.json({ notas, contagem });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  try {
    const body = await req.json();
    const ate = body.ate ? new Date(String(body.ate)) : new Date();
    const de = body.de ? new Date(String(body.de)) : new Date(ate.getFullYear(), ate.getMonth(), 1);
    ate.setHours(23, 59, 59, 999);

    if (Number.isNaN(de.getTime()) || Number.isNaN(ate.getTime())) {
      return NextResponse.json({ error: "Período inválido" }, { status: 400 });
    }

    const resultado = await gerarPendencias({
      de,
      ate,
      canal: body.canal ? normalizarCanal(String(body.canal)) : null,
    });

    await auditar({
      entidade: "configuracao",
      entidadeId: "fila-notas",
      acao: "criar",
      antes: null,
      depois: resultado,
    });

    return NextResponse.json({
      ok: true,
      ...resultado,
      mensagem:
        resultado.criados === 0
          ? `Nenhum pedido novo entrou na fila (${resultado.foraDaPolitica} fora da política do canal).`
          : `${resultado.criados} pedido(s) na fila: ${resultado.prontos} pronta(s) para o lote, ${resultado.comPendencia} com dado faltando.`,
    });
  } catch (error) {
    console.error("[admin/fiscal/notas] falha:", error);
    return NextResponse.json({ error: "Não foi possível gerar a fila" }, { status: 500 });
  }
}
