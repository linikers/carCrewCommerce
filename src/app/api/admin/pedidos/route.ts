import { getAdminId, requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { STATUS_PEDIDO, statusValido } from "@/lib/pedido-status";
import { auditar } from "@/lib/auditoria";
import { recalcularVenda } from "@/lib/custos-venda";
import { numero } from "@/lib/venda-import";
import {
  estornarEstoqueDoPedido,
  retomarEstoqueDoPedido,
} from "@/modules/estoque/dados/movimentos";

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
    const corpo = await request.json();
    const { id, status, custos } = corpo;

    // Edição dos custos da venda (#191): recalcula e audita antes/depois.
    if (id && !status && custos) {
      const antes = await prisma.pedido.findUnique({
        where: { id },
        select: {
          comissao: true, freteVendedor: true, imposto: true,
          embalagem: true, ads: true, resultado: true,
        },
      });
      if (!antes) {
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
      }

      const extras = {
        comissao: numero(String(custos.comissao ?? "")) ?? 0,
        freteVendedor: numero(String(custos.freteVendedor ?? "")) ?? 0,
        imposto: numero(String(custos.imposto ?? "")) ?? 0,
        impostoPercent: numero(String(custos.impostoPercent ?? "")),
        embalagem: numero(String(custos.embalagem ?? "")) ?? 0,
        ads: numero(String(custos.ads ?? "")) ?? 0,
        custosOrigem: "manual",
      };

      const recalculo = await recalcularVenda(id, extras);

      await auditar({
        entidade: "pedido",
        entidadeId: id,
        acao: "alterar",
        antes: { ...antes },
        depois: {
          comissao: extras.comissao,
          freteVendedor: extras.freteVendedor,
          imposto: extras.imposto,
          embalagem: extras.embalagem,
          ads: extras.ads,
          resultado: recalculo.resultado?.resultado ?? null,
        },
      });

      return NextResponse.json({
        success: true,
        resultado: recalculo.resultado,
        itensSemCusto: recalculo.itensSemCusto,
      });
    }

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

    // O status anterior decide se mexe em estoque: cancelar devolve, reabrir
    // baixa de novo. O histórico é a fonte (ver estornarEstoqueDoPedido).
    const anterior = await prisma.pedido.findUnique({
      where: { id },
      select: { status: true },
    });

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

    let estoque: { devolvidos?: number; baixados?: number } | null = null;

    try {
      const adminId = await getAdminId();
      if (status === "cancelado" && anterior?.status !== "cancelado") {
        estoque = await estornarEstoqueDoPedido(id, adminId);
      } else if (anterior?.status === "cancelado" && status !== "cancelado") {
        estoque = await retomarEstoqueDoPedido(id, adminId);
      }
    } catch (erroEstoque) {
      // O status já mudou: falhar aqui não pode derrubar a resposta e esconder
      // do operador que o pedido foi cancelado.
      console.error("[admin/pedidos] falha ao ajustar estoque:", erroEstoque);
      estoque = null;
    }

    await auditar({
      entidade: "pedido",
      entidadeId: id,
      acao: "alterar",
      antes: anterior ? { status: anterior.status } : undefined,
      depois: { status, estoque },
    });

    return NextResponse.json({ success: true, estoque });
  } catch (error) {
    console.error("[admin/pedidos] falha ao alterar status:", error);
    return NextResponse.json(
      { error: "Não foi possível alterar o status." },
      { status: 500 }
    );
  }
}
