import { requireAdmin } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { readFreteConfig } from "@/lib/frete-config";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const config = await readFreteConfig();

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
