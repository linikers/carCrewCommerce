import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  invalidarConteudoCategoria,
  listarConteudosCategorias,
  salvarConteudoCategoria,
} from "@/lib/categorias-conteudo-admin";
import { auditar } from "@/lib/auditoria";

/**
 * Texto das páginas de categoria (título, introdução, "Antes de comprar" e o
 * botão da landing). Fica em `configuracoes.categorias_conteudo`; salvar limpa
 * o cache para a página pública refletir na hora.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json({ categorias: await listarConteudosCategorias() });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";

    if (!slug) {
      return NextResponse.json({ error: "Categoria não informada." }, { status: 400 });
    }

    const salvo = await salvarConteudoCategoria(slug, {
      titulo: typeof body.titulo === "string" ? body.titulo : "",
      intro: typeof body.intro === "string" ? body.intro : "",
      atencao: typeof body.atencao === "string" ? body.atencao : "",
      landingLabel:
        typeof body.landingLabel === "string" ? body.landingLabel : "",
      landingHref: typeof body.landingHref === "string" ? body.landingHref : "",
    });

    invalidarConteudoCategoria();

    await auditar({
      entidade: "configuracao",
      entidadeId: `categorias_conteudo:${slug}`,
      acao: "alterar",
      depois: { titulo: salvo.titulo, atencao: salvo.atencao },
    });

    return NextResponse.json({ ok: true, slug, salvo });
  } catch (erro) {
    const mensagem =
      erro instanceof Error && erro.message === "Categoria não encontrada"
        ? "Categoria não encontrada."
        : "Não foi possível salvar o conteúdo.";

    console.error("[admin/categorias-conteudo] falha:", erro);
    return NextResponse.json(
      { error: mensagem },
      { status: erro instanceof Error && erro.message === "Categoria não encontrada" ? 404 : 500 }
    );
  }
}
