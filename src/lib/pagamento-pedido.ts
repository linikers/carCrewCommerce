import prisma from "@/lib/prisma";
import { auditar } from "@/lib/auditoria";

/**
 * Fecha o pedido quando o Mercado Pago confirma o PIX.
 *
 * Idempotente de propósito: o MP reenvia o mesmo evento várias vezes. Se o
 * pedido já está pago, a função não faz nada e devolve `jaEstavaPago` — o
 * webhook responde 200 do mesmo jeito, senão o MP fica tentando para sempre.
 */

export interface ResultadoConfirmacao {
  encontrado: boolean;
  jaEstavaPago: boolean;
  statusAnterior?: string;
  status?: string;
}

export async function confirmarPagamentoPedido(opts: {
  pedidoId: string;
  paymentId: string;
  valorPago: number;
  statusMercadoPago: string;
}): Promise<ResultadoConfirmacao> {
  const { pedidoId, paymentId, valorPago, statusMercadoPago } = opts;

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { id: true, status: true, total: true, clienteEmail: true },
  });

  if (!pedido) return { encontrado: false, jaEstavaPago: false };

  if (pedido.status !== "aguardando_pagamento") {
    return {
      encontrado: true,
      jaEstavaPago: true,
      statusAnterior: pedido.status,
      status: pedido.status,
    };
  }

  const atualizado = await prisma.pedido.update({
    where: { id: pedidoId },
    data: { status: "pago" },
    select: { status: true },
  });

  await auditar({
    entidade: "pedido",
    entidadeId: pedidoId,
    acao: "alterar",
    antes: { status: pedido.status },
    depois: {
      status: atualizado.status,
      pagamento: {
        provedor: "mercadopago",
        paymentId,
        status: statusMercadoPago,
        valorPago,
      },
    },
  });

  return {
    encontrado: true,
    jaEstavaPago: false,
    statusAnterior: pedido.status,
    status: atualizado.status,
  };
}
