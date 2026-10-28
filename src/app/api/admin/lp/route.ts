import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  CONTEUDO_PADRAO,
  LPS,
  lerTodosConteudos,
  lerLpsPersonalizados,
  salvarConteudoLp,
} from "@/lib/lp-conteudo";
import { auditar } from "@/lib/auditoria";

/**
 * Conteúdo das páginas de solução (LPs) para o painel.
 *
 * GET devolve todas as páginas já resolvidas (banco + padrão do código) e
 * quais têm texto próprio salvo — a lista mostra "editada" sem precisar
 * comparar texto.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [conteudos, personalizados] = await Promise.all([
    lerTodosConteudos(),
    lerLpsPersonalizados(),
  ]);

  return NextResponse.json({
    paginas: LPS.map((p) => ({
      ...p,
      personalizado: personalizados.includes(p.slug),
      conteudo: conteudos[p.slug],
      original: CONTEUDO_PADRAO[p.slug],
    })),
  });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await req.json()) as { slug?: string; conteudo?: unknown };
    const slug = typeof body.slug === "string" ? body.slug : "";

    if (!LPS.some((p) => p.slug === slug)) {
      return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });
    }

    const conteudo = await salvarConteudoLp(slug, body.conteudo);

    await auditar({
      entidade: "lp_conteudo",
      entidadeId: slug,
      acao: "alterar",
      depois: { seoTitulo: conteudo.seoTitulo, titulo: conteudo.titulo },
    });

    return NextResponse.json({ slug, conteudo });
  } catch (erro) {
    console.error("[admin/lp] falha ao salvar:", erro);
    return NextResponse.json(
      { error: "Não foi possível salvar o conteúdo." },
      { status: 500 }
    );
  }
}
