import { NextRequest, NextResponse } from "next/server";
import {
  assinaturaValida,
  consultarPagamento,
  lerConfigMercadoPago,
} from "@/lib/mercado-pago";
import { confirmarPagamentoPedido } from "@/lib/pagamento-pedido";

/**
 * Webhook do Mercado Pago — confirma o PIX e fecha o pedido.
 *
 * Segurança: com o segredo cadastrado no painel, a assinatura `x-signature`
 * é conferida antes de consultar o pagamento. Sem segredo cadastrado, a rota
 * recusa — aceitar POST anônimo aqui é deixar qualquer um marcar pedido como
 * pago.
 *
 * Idempotência: o MP reenvia o evento; responder 200 mesmo quando o pedido já
 * está pago evita fila de retentativa.
 */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let corpo: { type?: string; action?: string; data?: { id?: string | number } } = {};

  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ ok: true, ignorado: "corpo inválido" });
  }

  const tipo = corpo.type ?? corpo.action ?? "";
  const dataId = String(corpo.data?.id ?? req.nextUrl.searchParams.get("data.id") ?? "");

  // Só pagamento interessa; merchant_order e afins são ruído.
  if (!tipo.includes("payment") || !dataId) {
    return NextResponse.json({ ok: true, ignorado: "evento sem pagamento" });
  }

  const config = await lerConfigMercadoPago();

  if (!config.webhookSecret) {
    // Sem segredo não há como provar que o POST veio do MP.
    console.warn("[webhook/mercadopago] segredo não configurado — evento recusado");
    return NextResponse.json(
      { ok: false, error: "Webhook sem segredo configurado" },
      { status: 401 }
    );
  }

  const valido = assinaturaValida({
    segredo: config.webhookSecret,
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId,
  });

  if (!valido) {
    console.warn("[webhook/mercadopago] assinatura inválida", { dataId });
    return NextResponse.json({ ok: false, error: "Assinatura inválida" }, { status: 401 });
  }

  try {
    const pagamento = await consultarPagamento(config, dataId);

    if (!pagamento.externalReference) {
      return NextResponse.json({ ok: true, ignorado: "pagamento sem pedido" });
    }

    if (pagamento.status !== "approved") {
      return NextResponse.json({
        ok: true,
        ignorado: `status ${pagamento.status}`,
        pedido: pagamento.externalReference,
      });
    }

    const resultado = await confirmarPagamentoPedido({
      pedidoId: pagamento.externalReference,
      paymentId: String(pagamento.id),
      valorPago: pagamento.valor,
      statusMercadoPago: pagamento.status,
    });

    if (!resultado.encontrado) {
      console.warn("[webhook/mercadopago] pedido não encontrado", {
        pedido: pagamento.externalReference,
        paymentId: pagamento.id,
      });
      return NextResponse.json({ ok: true, ignorado: "pedido não encontrado" });
    }

    return NextResponse.json({ ok: true, ...resultado });
  } catch (erro) {
    // 500 faz o MP reenviar — é o que queremos quando a falha é nossa.
    console.error("[webhook/mercadopago] falha:", erro);
    return NextResponse.json({ ok: false, error: "Falha ao processar" }, { status: 500 });
  }
}
