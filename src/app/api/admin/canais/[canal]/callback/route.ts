import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { credencialML, salvarTokens, trocarCodigo, usuario } from "@/modules/marketplace/dados/mercado-livre";
import { auditar } from "@/lib/auditoria";

/**
 * Callback do OAuth: troca o code pelos tokens e grava cifrado.
 *
 * Se a troca falhar, o dono volta para a tela com o motivo na query — não com
 * uma tela em branco.
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const destino = (msg: string, ok = false) =>
    NextResponse.redirect(
      new URL(`/admin/marketplace?${ok ? "ok" : "erro"}=${encodeURIComponent(msg)}`, req.nextUrl.origin)
    );

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stateSalvo = req.cookies.get("ml_oauth_state")?.value;

  if (!code) return destino("Autorização cancelada no Mercado Livre");
  if (!state || state !== stateSalvo) return destino("Sessão de autorização inválida — tente conectar de novo");

  const cred = await credencialML();
  if (!cred) return destino("Client ID/Secret não configurados");

  try {
    const redirectUri = new URL("/api/admin/canais/mercado_livre/callback", req.nextUrl.origin).toString();
    const tokens = await trocarCodigo({
      clientId: cred.clientId,
      clientSecret: cred.clientSecret,
      code,
      redirectUri,
    });

    const conta = await usuario(tokens.access_token);
    await salvarTokens(tokens, { userId: String(conta.id) });

    await auditar({
      entidade: "configuracao",
      entidadeId: "ml-oauth",
      acao: "alterar",
      antes: null,
      depois: { conta: conta.nickname, userId: conta.id },
    });

    const resposta = destino(`Conectado como ${conta.nickname}`, true);
    resposta.cookies.delete("ml_oauth_state");
    return resposta;
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao conectar";
    return destino(mensagem);
  }
}
