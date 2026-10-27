import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { auditar } from "@/lib/auditoria";
import { normalizarPercentual } from "@/lib/preco";
import { aplicarDescontoEmLote } from "@/lib/produtos-admin";

/**
 * Aplica (ou remove) desconto em lote (#desconto).
 *
 * Recebe os ids que a tela está mostrando — assim "lote" é exatamente o filtro
 * que o dono vê, e não uma regra escondida no servidor.
 *
 * percentual = 0 remove o desconto.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter((n: number) => Number.isFinite(n)) : [];
    const percentual = normalizarPercentual(body.percentual);

    if (ids.length === 0) {
      return NextResponse.json({ error: "Nenhum produto selecionado" }, { status: 400 });
    }
    if (ids.length > 500) {
      return NextResponse.json(
        { error: "Máximo de 500 produtos por vez — aplique por categoria" },
        { status: 400 }
      );
    }

    const { atualizados, antes } = await aplicarDescontoEmLote(ids, percentual);
    const count = atualizados;

    await auditar({
      entidade: "produto",
      entidadeId: ids.join(",").slice(0, 200),
      acao: "alterar",
      antes: { produtos: antes.length, descontos: antes.map((p) => p.descontoPercent) },
      depois: { produtos: count, descontoPercent: percentual },
    });

    return NextResponse.json({
      ok: true,
      atualizados: count,
      percentual,
      mensagem:
        percentual === 0
          ? `Desconto removido de ${count} produto(s).`
          : `${percentual}% aplicado em ${count} produto(s).`,
    });
  } catch (error) {
    console.error("[admin/produtos/desconto] falha:", error);
    return NextResponse.json({ error: "Não foi possível aplicar o desconto" }, { status: 500 });
  }
}
