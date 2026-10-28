import { revalidateTag, unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { CONTEUDO_CATEGORIA, type ConteudoCategoria } from "@/lib/categorias-conteudo";

/**
 * Texto das páginas de categoria editável no painel.
 *
 * Título, introdução e o bloco "Antes de comprar" das 10 categorias viviam só
 * em `categorias-conteudo.ts` — trocar uma frase exigia PR e deploy, mesmo com
 * as LPs já editáveis. Aqui o texto do código vira **padrão** e o painel grava
 * só o que o dono mudou (tabela `configuracoes`, chave `categorias_conteudo`).
 *
 * Campo vazio no painel = volta ao texto do código; botão da landing com link
 * vazio = botão some.
 */

const CHAVE = "categorias_conteudo";
export const TAG_CONTEUDO_CATEGORIA = "categorias-conteudo";

export interface ConteudoCategoriaSalvo {
  titulo: string;
  intro: string;
  atencao: string;
  landingLabel: string;
  landingHref: string;
}

type MapaSalvo = Record<string, Partial<ConteudoCategoriaSalvo>>;

const PADRAO_DE_EMERGENCIA = (nome: string): ConteudoCategoria => ({
  titulo: nome,
  intro: `Peças de ${nome.toLowerCase()} para suspensão automotiva, com entrega para todo o Brasil.`,
  atencao:
    "Em dúvida sobre a aplicação no seu carro? Fale com a gente no WhatsApp antes de comprar.",
});

async function lerBruto(): Promise<MapaSalvo> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CHAVE } });
    if (row?.valor && typeof row.valor === "object") {
      return row.valor as MapaSalvo;
    }
  } catch (erro) {
    console.error("[categorias-conteudo] falha ao ler:", erro);
  }
  return {};
}

/** Cache: a página de categoria é force-dynamic e não deve consultar por visita. */
const lerBrutoCache = unstable_cache(lerBruto, ["categorias-conteudo"], {
  tags: [TAG_CONTEUDO_CATEGORIA],
  revalidate: 60 * 60 * 24,
});

function texto(valor: unknown, padrao: string, max: number): string {
  if (typeof valor !== "string") return padrao;
  const limpo = valor.trim().slice(0, max);
  return limpo || padrao;
}

/** Junta o texto do código com o que o painel salvou. */
export function montarConteudo(
  slug: string,
  nome: string,
  salvo?: Partial<ConteudoCategoriaSalvo>
): ConteudoCategoria {
  const padrao = CONTEUDO_CATEGORIA[slug] ?? PADRAO_DE_EMERGENCIA(nome);

  const titulo = texto(salvo?.titulo, padrao.titulo, 120);
  const intro = texto(salvo?.intro, padrao.intro, 1200);
  const atencao = texto(salvo?.atencao, padrao.atencao, 600);

  // Botão da landing: link vazio no painel remove o botão.
  const hrefPainel =
    salvo?.landingHref === undefined ? padrao.landing?.href : salvo.landingHref.trim();
  const href = hrefPainel && hrefPainel.startsWith("/") ? hrefPainel : null;
  const label = texto(
    salvo?.landingLabel,
    padrao.landing?.label ?? "Ver a página completa",
    80
  );

  return {
    titulo,
    intro,
    atencao,
    ...(href ? { landing: { href, label } } : {}),
  };
}

export async function lerConteudoCategoriaPublico(
  slug: string,
  nome: string
): Promise<ConteudoCategoria> {
  const overrides = await lerBrutoCache();
  return montarConteudo(slug, nome, overrides[slug]);
}

export interface ConteudoCategoriaAdmin {
  slug: string;
  nome: string;
  /** true quando o painel tem texto próprio salvo. */
  personalizado: boolean;
  /** O que está gravado (vazio = campo usando o texto do código). */
  salvo: Partial<ConteudoCategoriaSalvo>;
  efetivo: ConteudoCategoria;
  padrao: ConteudoCategoria;
}

export async function listarConteudosCategorias(): Promise<ConteudoCategoriaAdmin[]> {
  const [categorias, overrides] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { ordem: "asc" } }),
    lerBrutoCache(),
  ]);

  return categorias.map((cat) => {
    const salvo = overrides[cat.slug];
    return {
      slug: cat.slug,
      nome: cat.nome,
      personalizado: Boolean(salvo && Object.keys(salvo).length > 0),
      salvo: salvo ?? {},
      efetivo: montarConteudo(cat.slug, cat.nome, salvo),
      padrao: montarConteudo(cat.slug, cat.nome),
    };
  });
}

export async function salvarConteudoCategoria(
  slug: string,
  entrada: Partial<ConteudoCategoriaSalvo>
): Promise<ConteudoCategoriaSalvo> {
  const categorias = await prisma.categoria.findMany({ select: { slug: true } });
  if (!categorias.some((c) => c.slug === slug)) {
    throw new Error("Categoria não encontrada");
  }

  // Leitura crua (sem cache) para não sobrescrever texto salvo por outra aba.
  const overrides = await lerBruto();

  const salvo: ConteudoCategoriaSalvo = {
    titulo: typeof entrada.titulo === "string" ? entrada.titulo.trim().slice(0, 120) : "",
    intro: typeof entrada.intro === "string" ? entrada.intro.trim().slice(0, 1200) : "",
    atencao: typeof entrada.atencao === "string" ? entrada.atencao.trim().slice(0, 600) : "",
    landingLabel:
      typeof entrada.landingLabel === "string"
        ? entrada.landingLabel.trim().slice(0, 80)
        : "",
    landingHref:
      typeof entrada.landingHref === "string"
        ? entrada.landingHref.trim().slice(0, 200)
        : "",
  };

  overrides[slug] = salvo;

  await prisma.configuracao.upsert({
    where: { chave: CHAVE },
    create: { chave: CHAVE, valor: overrides },
    update: { valor: overrides },
  });

  return salvo;
}

/** Limpa o cache depois de salvar (Route Handler → expire imediato). */
export function invalidarConteudoCategoria(): void {
  revalidateTag(TAG_CONTEUDO_CATEGORIA, { expire: 0 });
}
