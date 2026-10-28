import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { lerMenuLoja, salvarMenuLoja } from "@/lib/menu-loja";
import { auditar } from "@/lib/auditoria";

/**
 * Menu da loja: leitura e gravação pelo painel.
 *
 * Devolve a configuração crua (inclusive itens desligados), porque a tela
 * precisa listar o que está desabilitado para o dono poder religar.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json(await lerMenuLoja());
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const antes = await lerMenuLoja();
    const config = await salvarMenuLoja(body);

    await auditar({
      entidade: "menu_loja",
      entidadeId: "menu_loja",
      acao: "alterar",
      antes: { barra: antes.barra.length, solucoes: antes.solucoes.length },
      depois: {
        barra: config.barra.length,
        solucoes: config.solucoes.length,
        ocultas: config.categoriasOcultas.length,
      },
    });

    return NextResponse.json(config);
  } catch (erro) {
    console.error("[admin/menu] falha ao salvar:", erro);
    return NextResponse.json(
      { error: "Não foi possível salvar o menu." },
      { status: 500 }
    );
  }
}
