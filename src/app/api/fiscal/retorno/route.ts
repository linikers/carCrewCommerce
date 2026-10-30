import { NextRequest, NextResponse } from "next/server";
import { auditar } from "@/lib/auditoria";
import { validarChave, registrarRetorno } from "@/modules/fiscal/dados/retorno";

/**
 * Retorno do emissor por API (Bearer cc_…).
 *
 * O emissor do cliente devolve número/série/chave ou o motivo da rejeição.
 * Idempotente: reenvio do mesmo evento não regrava nem audita de novo.
 */
export async function POST(req: NextRequest) {
  const autorizado = await validarChave(req.headers.get("authorization"));
  if (!autorizado) {
    return NextResponse.json({ error: "Chave de API inválida ou ausente" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const pedidoId = String(body.pedidoId ?? "");
    const status = String(body.status ?? "");

    if (!pedidoId) return NextResponse.json({ error: "pedidoId é obrigatório" }, { status: 400 });
    if (!["autorizada", "rejeitada", "cancelada"].includes(status)) {
      return NextResponse.json(
        { error: "status deve ser autorizada, rejeitada ou cancelada" },
        { status: 400 }
      );
    }
    if (status === "rejeitada" && !body.motivo) {
      return NextResponse.json({ error: "rejeição exige o motivo" }, { status: 400 });
    }

    const resultado = await registrarRetorno({
      pedidoId,
      status: status as "autorizada" | "rejeitada" | "cancelada",
      numero: body.numero ? String(body.numero) : null,
      serie: body.serie ? String(body.serie) : null,
      chave: body.chave ? String(body.chave) : null,
      motivo: body.motivo ? String(body.motivo) : null,
    });

    if (resultado.aplicado) {
      await auditar({
        entidade: "configuracao",
        entidadeId: `nota-${pedidoId}`,
        acao: "alterar",
        antes: { origem: "api" },
        depois: { status: resultado.status, numero: resultado.numero },
      });
    }

    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Não foi possível registrar o retorno";
    const naoEncontrado = mensagem.includes("não está na fila");
    return NextResponse.json({ error: mensagem }, { status: naoEncontrado ? 404 : 500 });
  }
}
