import { requireAdmin } from "@/lib/api-auth";
import { moduloAtivo } from "@/modules/config";
import {
  estornarEstoqueDoPedido,
  retomarEstoqueDoPedido,
} from "@/modules/estoque/dados/movimentos";
import { mudarStatusPedido } from "@/modules/pedidos/dados/pedidos";
import { ErroPedido } from "@/modules/pedidos/dominio/pedido";
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
        // #72: itens relacionais (pedido antigo ainda cai no JSON)
        itens: { orderBy: { criadoEm: "asc" } },
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

    // 6.2: cancelar precisa devolver o estoque, senão o saldo fica baixado
    // para sempre. Com o módulo de estoque ligado a devolução vira movimento
    // (com histórico e possibilidade de reabrir); desligado, vai direto no
    // saldo do produto. A rota é quem liga as duas pontas.
    const estoqueLigado = await moduloAtivo("estoque");

    let statusAnterior: string | null = null;

    try {
      const resultado = await mudarStatusPedido({
        pedidoId: id,
        novoStatus: status,
        devolverEstoque: estoqueLigado ? estornarEstoqueDoPedido : undefined,
        retomarEstoque: estoqueLigado ? retomarEstoqueDoPedido : undefined,
      });
      statusAnterior = resultado.statusAnterior;
    } catch (e) {
      if (e instanceof ErroPedido) {
        return NextResponse.json({ error: e.message }, { status: 404 });
      }
      throw e;
    }

    // 6.6: sem o "antes" o histórico não conta a história — só o estado final.
    await auditar({
      entidade: "pedido",
      entidadeId: id,
      acao: "alterar",
      antes: statusAnterior ? { status: statusAnterior } : undefined,
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
