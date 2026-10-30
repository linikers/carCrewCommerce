import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { accessTokenValido, usuario } from "@/modules/marketplace/dados/mercado-livre";

/**
 * "Testar conexão": é o único teste que prova credencial + token + permissão
 * de uma vez — devolve o nome da loja e o id do vendedor.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ canal: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("marketplace");
  if (bloqueio) return bloqueio;

  const { canal } = await params;
  if (canal !== "mercado_livre") {
    return NextResponse.json({ error: "Teste disponível só para Mercado Livre por enquanto" }, { status: 400 });
  }

  try {
    const { token } = await accessTokenValido();
    const conta = await usuario(token);
    return NextResponse.json({
      ok: true,
      conta: { id: conta.id, nickname: conta.nickname, site: conta.site_id },
      mensagem: `Conectado na conta ${conta.nickname} (${conta.id})`,
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao testar";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }
}
