import { NextRequest, NextResponse } from "next/server";
import { QrCodePix } from "qrcode-pix";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import {
  ErroMercadoPago,
  criarPixMercadoPago,
  lerConfigMercadoPago,
} from "@/lib/mercado-pago";

/**
 * Cobrança PIX do checkout.
 *
 * Dois modos, nesta ordem:
 * 1. **Mercado Pago** (conta configurada e ligada no painel): a cobrança nasce
 *    lá com `external_reference` = id do pedido e o webhook fecha o pedido.
 * 2. **Chave estática** (padrão antigo): o QR aponta para a chave da loja; o
 *    dinheiro entra, mas a confirmação é manual.
 */

async function getChavePixAtiva(): Promise<string | null> {
  try {
    const row = await prisma.configuracao.findUnique({
      where: { chave: "pagamentos" },
    });
    if (!row?.valor) return null;
    const val = row.valor as { pix?: { chaves?: { ativo?: boolean; chave?: string }[] } };
    const chaves = val.pix?.chaves || [];
    const ativa = chaves.find((k) => k.ativo);
    return ativa?.chave || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let corpo: {
    amount?: number;
    nome?: string;
    cidade?: string;
    email?: string;
    documento?: string;
    pedidoId?: string;
  };

  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const valor = Number(corpo.amount);

  if (!valor || Number.isNaN(valor)) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  if (valor < 0.01) {
    return NextResponse.json(
      { error: "Valor mínimo para PIX é R$ 0,01" },
      { status: 400 }
    );
  }

  // 1) Mercado Pago — só tenta quando a conta está ligada.
  const config = await lerConfigMercadoPago();

  if (config.habilitado && config.accessToken) {
    if (!corpo.pedidoId) {
      return NextResponse.json(
        { error: "Pedido não identificado para gerar a cobrança." },
        { status: 400 }
      );
    }

    try {
      const pix = await criarPixMercadoPago({
        config,
        valor,
        descricao: `Pedido ${corpo.pedidoId.slice(-6).toUpperCase()} — Car Crew Garage`,
        pedidoId: corpo.pedidoId,
        pagador: {
          nome: corpo.nome || "Cliente",
          email: corpo.email || "cliente@carcrew.com.br",
          documento: corpo.documento ?? null,
        },
      });

      return NextResponse.json({
        provedor: "mercadopago",
        paymentId: pix.paymentId,
        qrCode: pix.qrCode,
        payload: pix.payload,
        ticketUrl: pix.ticketUrl,
        chave: "",
        amount: valor,
        expiration: pix.expiraEm ?? "24 horas",
      });
    } catch (erro) {
      // Conta ligada mas recusando: NÃO cai para a chave estática em silêncio.
      const mensagem =
        erro instanceof ErroMercadoPago
          ? erro.status === 401
            ? "Mercado Pago recusou a cobrança: Access Token inválido. Confira a credencial em Pagamentos."
            : `Mercado Pago recusou a cobrança: ${erro.message}`
          : "Falha ao falar com o Mercado Pago.";

      console.error("[pix] mercadopago:", erro);
      return NextResponse.json({ error: mensagem }, { status: 502 });
    }
  }

  // 2) Chave estática.
  try {
    const chavePix = (await getChavePixAtiva()) || "contato@carcrew.com.br";

    const payload = QrCodePix({
      version: "01",
      key: chavePix,
      name: (corpo.nome || "Car Crew Garage").substring(0, 25),
      city: (corpo.cidade || "SaoPaulo").substring(0, 15),
      value: valor,
      message: "Pedido Car Crew Garage",
    });

    const pixPayload = payload.payload();

    const qrCodeBase64 = await QRCode.toDataURL(pixPayload, {
      width: 350,
      margin: 2,
      color: { dark: "#1A1A1A", light: "#ffffff" },
    });

    return NextResponse.json({
      provedor: "chave_estatica",
      qrCode: qrCodeBase64,
      payload: pixPayload,
      chave: chavePix,
      amount: valor,
      expiration: "24 horas",
    });
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    return NextResponse.json({ error: "Erro ao gerar pagamento PIX" }, { status: 500 });
  }
}
