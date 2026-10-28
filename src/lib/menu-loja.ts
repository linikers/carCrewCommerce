import prisma from "@/lib/prisma";

/**
 * Menu da loja controlado pelo painel.
 *
 * O menu do site era uma lista fixa dentro do `Header`: para tirar "Off-road
 * 4x4" da barra ou renomear "Rebaixados" era preciso abrir PR e esperar
 * deploy. Aqui a lista vira configuração (tabela `configuracoes`, chave
 * `menu_loja`), com os itens atuais como padrão — loja nova já nasce com o
 * menu de hoje, e banco sem a chave continua funcionando.
 *
 * Dois grupos, porque são duas peças diferentes da barra:
 * - `barra`: links diretos na faixa escura (hoje só o Blog);
 * - `solucoes`: itens do menu suspenso "Soluções" (as páginas de solução).
 *
 * Cada item tem `descricao` porque o menu suspenso e o drawer do celular
 * mostram duas linhas — rótulo e uma frase explicando para onde leva. Item
 * desligado (`ativo: false`) some do site sem perder o cadastro, então o dono
 * desliga a página que saiu de linha e religa quando voltar a trabalhar com
 * ela, sem digitar tudo de novo.
 */

export interface ItemMenu {
  /** Chave estável do item (não muda ao renomear). */
  id: string;
  rotulo: string;
  href: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
}

export interface ConfigMenuLoja {
  barra: ItemMenu[];
  solucoes: ItemMenu[];
  /** Slugs de categoria escondidos do menu (a página continua no ar). */
  categoriasOcultas: string[];
}

const CHAVE = "menu_loja";

const LINK_PADRAO = { descricao: "", ativo: true };

export const MENU_PADRAO: ConfigMenuLoja = {
  barra: [
    { id: "blog", rotulo: "Blog", href: "/blog", ...LINK_PADRAO, ordem: 0 },
  ],
  solucoes: [
    {
      id: "suspensao-a-ar",
      rotulo: "Suspensão a ar",
      href: "/suspensao-a-ar",
      descricao: "Bolsas, compressores e controle bluetooth",
      ativo: true,
      ordem: 0,
    },
    {
      id: "rebaixamento",
      rotulo: "Rebaixados",
      href: "/rebaixamento",
      descricao: "Altura baixa sem perder conforto",
      ativo: true,
      ordem: 1,
    },
    {
      id: "suspensao-esportiva",
      rotulo: "Suspensão esportiva",
      href: "/suspensao-esportiva",
      descricao: "Acerto de rua para dirigir firme",
      ativo: true,
      ordem: 2,
    },
    {
      id: "off-road",
      rotulo: "Off-road 4x4",
      href: "/off-road",
      descricao: "Lift kits e preparação para trilha",
      ativo: true,
      ordem: 3,
    },
  ],
  categoriasOcultas: [],
};

function limparTexto(valor: unknown, max: number): string {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

/** Só link interno ou http(s): item de menu apontando para `javascript:` é risco. */
export function hrefValido(href: string): boolean {
  return href.startsWith("/") || /^https?:\/\//i.test(href);
}

function normalizarItens(valor: unknown, padrao: ItemMenu[]): ItemMenu[] {
  if (!Array.isArray(valor)) return padrao;

  const usados = new Set<string>();
  const itens: ItemMenu[] = [];

  valor.forEach((bruto, indice) => {
    if (!bruto || typeof bruto !== "object") return;
    const item = bruto as Partial<ItemMenu>;

    const href = limparTexto(item.href, 300);
    if (!hrefValido(href)) return;

    let id = limparTexto(item.id, 60) || `item-${indice}`;
    while (usados.has(id)) id = `${id}-${indice}`;
    usados.add(id);

    itens.push({
      id,
      rotulo: limparTexto(item.rotulo, 60) || href,
      href,
      descricao: limparTexto(item.descricao, 120),
      ativo: item.ativo !== false,
      ordem:
        typeof item.ordem === "number" && Number.isFinite(item.ordem)
          ? item.ordem
          : indice,
    });
  });

  // Lista vazia é escolha válida (menu sem nenhum item), mas lista inválida
  // (nada aproveitável) volta ao padrão para o site não ficar sem nav.
  if (itens.length === 0 && Array.isArray(valor) && valor.length > 0) {
    return padrao;
  }

  return itens.sort((a, b) => a.ordem - b.ordem);
}

/** Ordena e aplica os limites; serve para leitura do banco e para o PATCH. */
export function normalizarMenu(bruto: unknown): ConfigMenuLoja {
  const valor =
    bruto && typeof bruto === "object" ? (bruto as Partial<ConfigMenuLoja>) : {};

  const ocultas = Array.isArray(valor.categoriasOcultas)
    ? Array.from(
        new Set(
          valor.categoriasOcultas
            .map((s) => limparTexto(s, 80))
            .filter(Boolean)
        )
      ).slice(0, 200)
    : MENU_PADRAO.categoriasOcultas;

  return {
    barra: normalizarItens(valor.barra, MENU_PADRAO.barra),
    solucoes: normalizarItens(valor.solucoes, MENU_PADRAO.solucoes),
    categoriasOcultas: ocultas,
  };
}

export async function lerMenuLoja(): Promise<ConfigMenuLoja> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CHAVE } });
    if (row?.valor) return normalizarMenu(row.valor);
  } catch (erro) {
    console.error("[menu-loja] falha ao ler:", erro);
  }
  return MENU_PADRAO;
}

export async function salvarMenuLoja(bruto: unknown): Promise<ConfigMenuLoja> {
  const novo = normalizarMenu(bruto);

  // Prisma exige objeto puro no campo Json: os arrays vão item a item.
  const valor = {
    barra: novo.barra.map((i) => ({
      id: i.id,
      rotulo: i.rotulo,
      href: i.href,
      descricao: i.descricao,
      ativo: i.ativo,
      ordem: i.ordem,
    })),
    solucoes: novo.solucoes.map((i) => ({
      id: i.id,
      rotulo: i.rotulo,
      href: i.href,
      descricao: i.descricao,
      ativo: i.ativo,
      ordem: i.ordem,
    })),
    categoriasOcultas: novo.categoriasOcultas,
  };

  await prisma.configuracao.upsert({
    where: { chave: CHAVE },
    create: { chave: CHAVE, valor },
    update: { valor },
  });

  return novo;
}

/** Itens visíveis, na ordem — é o que o site renderiza. */
export function itensVisiveis(itens: ItemMenu[]): ItemMenu[] {
  return itens
    .filter((i) => i.ativo)
    .slice()
    .sort((a, b) => a.ordem - b.ordem);
}
