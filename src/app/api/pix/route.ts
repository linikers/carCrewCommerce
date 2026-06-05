import { NextRequest, NextResponse } from "next/server";
import { QrCodePix } from "qrcode-pix";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const { amount, nome, cidade } = await req.json();

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    if (amount < 0.01) {
      return NextResponse.json(
        { error: "Valor mínimo para PIX é R$ 0,01" },
        { status: 400 }
      );
    }

    // Chave PIX — usar uma chave real no futuro
    // Pode ser: CPF, CNPJ, email, telefone ou chave aleatória
    const chavePix = "contato@carcrew.com.br";

    // Gera payload PIX (copia-e-cola)
    const payload = QrCodePix({
      version: "01",
      key: chavePix,
      name: (nome || "Car Crew Garage").substring(0, 25), // máx 25 caracteres
      city: (cidade || "SaoPaulo").substring(0, 15), // máx 15 caracteres
      value: Number(amount),
      message: "Pedido Car Crew Garage",
    });

    const pixPayload = payload.payload();

    // Gera QR Code como base64
    const qrCodeBase64 = await QRCode.toDataURL(pixPayload, {
      width: 350,
      margin: 2,
      color: {
        dark: "#1A1A1A",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      qrCode: qrCodeBase64,
      payload: pixPayload,
      chave: chavePix,
      amount: Number(amount),
      expiration: "24 horas",
    });
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    return NextResponse.json(
      { error: "Erro ao gerar pagamento PIX" },
      { status: 500 }
    );
  }
}
