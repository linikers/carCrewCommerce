import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { credencialML, urlAutorizacao } from "@/modules/marketplace/dados/mercado-livre";

/**
 * Inicia o OAuth do Mercado Livre.
 *
 * O `state` é um nonce gravado em cookie httpOnly: o callback só aceita se
 * voltar igual — evita que alguém cole um code de outra conta na sessão do dono.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ canal: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("marketplace");
  if (bloqueio) return bloqueio;

  const { canal } = await params;
  if (canal !== "mercado_livre") {
    return NextResponse.json({ error: "OAuth disponível só para Mercado Livre por enquanto" }, { status: 400 });
  }

  const cred = await credencialML();
  if (!cred) {
    return NextResponse.json(
      { error: "Salve o Client ID e o Client Secret do aplicativo antes de conectar" },
      { status: 400 }
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/admin/canais/mercado_livre/callback", req.nextUrl.origin).toString();

  const resposta = NextResponse.redirect(urlAutorizacao(cred.clientId, redirectUri, state));
  resposta.cookies.set("ml_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 600,
  });
  return resposta;
}
