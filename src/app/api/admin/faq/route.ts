import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { auditar } from "@/lib/auditoria";
import { invalidarFaq, lerTodosFaq, salvarFaq, type FaqItem } from "@/lib/faq-conteudo";

/**
 * Perguntas do FAQ (#181). Salvar limpa o cache para /faq refletir na hora.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json({ itens: await lerTodosFaq() });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await req.json()) as { itens?: unknown };
    const itens = Array.isArray(body.itens) ? (body.itens as FaqItem[]) : [];

    const salvos = await salvarFaq(itens);
    invalidarFaq();

    await auditar({
      entidade: "configuracao",
      entidadeId: "pagina_faq",
      acao: "alterar",
      depois: { total: salvos.length, ativos: salvos.filter((i) => i.ativo).length },
    });

    return NextResponse.json({ ok: true, itens: salvos });
  } catch (erro) {
    const mensagem =
      erro instanceof Error ? erro.message : "Não foi possível salvar o FAQ.";
    console.error("[admin/faq] falha:", erro);
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }
}
