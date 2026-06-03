import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "src/data/frete.json");
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";

export async function GET() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = JSON.parse(raw);

    if (!config.clientId) {
      return NextResponse.json(
        { error: "Configure o Client ID do Melhor Envio primeiro" },
        { status: 400 },
      );
    }

    const sandbox = config.sandbox !== false;
    const authUrl = sandbox
      ? "https://sandbox.melhorenvio.com.br/oauth/authorize"
      : "https://melhorenvio.com.br/oauth/authorize";

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: `${BASE_URL}/api/admin/frete/callback`,
      scope: "frete:calcular frete:comprar etiquetas:gerar etiquetas:imprimir loja:ler envio:ler envio:gerar usuarios:ler",
    });

    return NextResponse.redirect(`${authUrl}?${params.toString()}`);
  } catch {
    return NextResponse.json(
      { error: "Erro ao iniciar autenticação" },
      { status: 500 },
    );
  }
}
