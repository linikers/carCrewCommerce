import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { auditar } from "@/lib/auditoria";
import { registrarRetorno, reabrirNota } from "@/modules/fiscal/dados/retorno";

/**
 * Retorno digitado no painel — o caminho de quem emite é uma pessoa
 * (contador manda o número no WhatsApp) e não um sistema.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  try {
    const body = await req.json();
    const pedidoId = String(body.pedidoId ?? "");
    const status = String(body.status ?? "");

    if (!pedidoId) return NextResponse.json({ error: "Pedido não informado" }, { status: 400 });
    if (!["autorizada", "rejeitada", "cancelada"].includes(status)) {
      return NextResponse.json({ error: "Situação inválida" }, { status: 400 });
    }
    if (status === "autorizada" && !body.numero) {
      return NextResponse.json({ error: "Informe o número da nota" }, { status: 400 });
    }
    if (status === "rejeitada" && !body.motivo) {
      return NextResponse.json({ error: "Informe o motivo da rejeição" }, { status: 400 });
    }

    const resultado = await registrarRetorno({
      pedidoId,
      status: status as "autorizada" | "rejeitada" | "cancelada",
      numero: body.numero ? String(body.numero) : null,
      serie: body.serie ? String(body.serie) : null,
      chave: body.chave ? String(body.chave) : null,
      motivo: body.motivo ? String(body.motivo) : null,
    });

    await auditar({
      entidade: "configuracao",
      entidadeId: `nota-${pedidoId}`,
      acao: "alterar",
      antes: { origem: "painel" },
      depois: { status: resultado.status, numero: resultado.numero },
    });

    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Não foi possível registrar";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }
}

/** Reabre uma nota rejeitada para voltar ao lote. */
export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  const body = await req.json().catch(() => ({}));
  const pedidoId = String(body.pedidoId ?? "");
  if (!pedidoId) return NextResponse.json({ error: "Pedido não informado" }, { status: 400 });

  await reabrirNota(pedidoId);
  await auditar({
    entidade: "configuracao",
    entidadeId: `nota-${pedidoId}`,
    acao: "alterar",
    antes: { status: "rejeitada" },
    depois: { status: "pronta" },
  });
  return NextResponse.json({ ok: true });
}
