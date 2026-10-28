import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { auditar } from "@/lib/auditoria";
import {
  invalidarPaginas,
  lerTodasPaginas,
  salvarPagina,
  type PaginaInstitucional,
  type SlugInstitucional,
} from "@/lib/paginas-conteudo";

/** Páginas institucionais (#182): Sobre, Trocas e Privacidade. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json({ paginas: await lerTodasPaginas() });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await req.json()) as Partial<PaginaInstitucional>;
    const slug = body.slug as SlugInstitucional | undefined;

    if (!slug) {
      return NextResponse.json({ error: "Página não informada." }, { status: 400 });
    }

    const salva = await salvarPagina({
      slug,
      titulo: String(body.titulo ?? ""),
      subtitulo: String(body.subtitulo ?? ""),
      destaque: String(body.destaque ?? ""),
      secoes: Array.isArray(body.secoes) ? body.secoes : [],
    });

    invalidarPaginas();

    await auditar({
      entidade: "configuracao",
      entidadeId: `paginas_institucionais:${slug}`,
      acao: "alterar",
      depois: { titulo: salva.titulo, secoes: salva.secoes.length },
    });

    return NextResponse.json({ ok: true, pagina: salva });
  } catch (erro) {
    const mensagem =
      erro instanceof Error ? erro.message : "Não foi possível salvar a página.";
    console.error("[admin/paginas] falha:", erro);
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }
}
