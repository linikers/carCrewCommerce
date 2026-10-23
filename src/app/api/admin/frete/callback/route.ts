import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFreteConfig, writeFreteConfig } from "@/lib/frete-config";
import { auditar } from "@/lib/auditoria";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";

export async function GET(request: NextRequest) {
  // 7.11: o callback gravava o token de qualquer origem. Agora exige sessão
  // de admin — o redirect do provedor é top-level, então o cookie vem junto.
  const session = await getServerSession(authOptions);
  if (!(session?.user as { admin?: boolean } | undefined)?.admin) {
    return NextResponse.redirect(`${BASE_URL}/admin/login`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${BASE_URL}/admin/frete?error=${error || "authorization_denied"}`,
    );
  }

  try {
    const config = await readFreteConfig();

    const sandbox = config.sandbox !== false;
    const tokenUrl = sandbox
      ? "https://sandbox.melhorenvio.com.br/oauth/token"
      : "https://melhorenvio.com.br/oauth/token";

    // Troca o code pelo access_token
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: `${BASE_URL}/api/admin/frete/callback`,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.text();
      console.error("Erro ao obter token Melhor Envio:", errData);
      return NextResponse.redirect(
        `${BASE_URL}/admin/frete?error=token_exchange_failed`,
      );
    }

    const tokenData = await tokenRes.json();

    // Salva os tokens
    config.accessToken = tokenData.access_token;
    config.refreshToken = tokenData.refresh_token || "";
    config.tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    await writeFreteConfig(config);
    await auditar({
      entidade: "frete",
      entidadeId: "melhor-envio",
      acao: "alterar",
      depois: { evento: "oauth_autorizado" },
    });

    return NextResponse.redirect(`${BASE_URL}/admin/frete?success=authorized`);
  } catch (err) {
    console.error("Erro no callback OAuth Melhor Envio:", err);
    return NextResponse.redirect(
      `${BASE_URL}/admin/frete?error=server_error`,
    );
  }
}
