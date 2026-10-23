import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { STATUS_PEDIDO, statusValido } from "@/lib/pedido-status";
import { auditar } from "@/lib/auditoria";

/**
 * Lista de pedidos.
 *
 * Antes, qualquer falha do banco caía num fallback com TRÊS PEDIDOS
 * INVENTADOS ("Cliente Exemplo", "Oficina do João"). O admin mostrava venda
 * que não existia, com valor e status — e isso é pior do que mostrar erro.
 * Agora falha alto.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(pedidos);
  } catch (error) {
    console.error("[admin/pedidos] falha ao listar:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os pedidos. Tente de novo." },
      { status: 503 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "id e status são obrigatórios" },
        { status: 400 },
      );
    }

    if (!statusValido(status)) {
      return NextResponse.json(
        { error: `Status inválido. Valores: ${STATUS_PEDIDO.join(", ")}` },
        { status: 400 },
      );
    }

    // updateMany: se o pedido não existir, count vem 0 — antes o `update`
    // estourava, caía no catch e devolvia { success: true, mock: true }.
    // A tela mostrava "status alterado" sem ter alterado nada.
    const { count } = await prisma.pedido.updateMany({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    if (count === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    await auditar({
      entidade: "pedido",
      entidadeId: id,
      acao: "alterar",
      depois: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/pedidos] falha ao alterar status:", error);
    return NextResponse.json(
      { error: "Não foi possível alterar o status." },
      { status: 500 }
    );
  }
}
