import prisma from "@/lib/prisma";

/**
 * Conteúdo das páginas de solução (as "LPs") editável no painel.
 *
 * Hoje as 4 páginas que mais recebem busca — /suspensao-a-ar, /rebaixamento,
 * /suspensao-esportiva e /off-road — têm o texto escrito dentro do `.tsx`.
 * Trocar uma frase, um benefício ou a mensagem do WhatsApp exige PR e deploy.
 * Aqui cada página ganha um cadastro (tabela `configuracoes`, chave
 * `lp_conteudo`) com o texto atual como padrão: campo que o dono não mexeu
 * continua exatamente como está no código.
 *
 * O que NÃO é editável, de propósito: preço, produto, JSON-LD de endereço,
 * lista de produtos da página e slug. Texto é do dono; dado da loja vem do
 * banco.
 */

export interface BeneficioLp {
  titulo: string;
  texto: string;
}

export interface ConteudoLp {
  /** H1 da página. No off-road é a primeira linha do título do hero. */
  titulo: string;
  /** Segunda linha colorida do título (só off-road usa). */
  tituloDestaque?: string;
  /** Etiqueta acima do título (só off-road usa). */
  selo?: string;
  /** Parágrafos do topo. */
  intro: string[];
  beneficios: BeneficioLp[];
  servicos: string[];
  ctaTitulo: string;
  ctaTexto: string;
  whatsMensagem: string;
  /** Título para o Google (aba e resultado de busca). */
  seoTitulo: string;
  seoDescricao: string;
}

export interface PaginaLp {
  slug: string;
  nome: string;
  /** Rota pública. */
  href: string;
  /** Campos extras que só esta página exibe no editor. */
  extras?: ("selo" | "tituloDestaque")[];
}

export const LPS: PaginaLp[] = [
  { slug: "suspensao-a-ar", nome: "Suspensão a ar", href: "/suspensao-a-ar" },
  { slug: "rebaixamento", nome: "Rebaixados", href: "/rebaixamento" },
  {
    slug: "suspensao-esportiva",
    nome: "Suspensão esportiva",
    href: "/suspensao-esportiva",
  },
  {
    slug: "off-road",
    nome: "Off-road 4x4",
    href: "/off-road",
    extras: ["selo", "tituloDestaque"],
  },
];

export const CONTEUDO_PADRAO: Record<string, ConteudoLp> = {
  "suspensao-a-ar": {
    titulo: "Suspensão a Ar em Maringá",
    intro: [
      "A suspensão a ar (ou suspensão pneumática) é a escolha de quem quer rebaixar o carro sem abrir mão do conforto — ou nivelar a altura do veículo em segundos, no controle bluetooth. Na Car Crew Garage você encontra bolsas de ar, compressores e controles das melhores marcas, com instalação especializada em Maringá-PR.",
      "Trabalhamos com bolsas de ar para os projetos mais baixos, compressores de alta vazão e controles bluetooth que permitem ajustar cada eixo separadamente. Atendemos clientes de Maringá, Sarandi, Marialva, Cianorte e todo o Brasil com envio seguro para qualquer estado.",
    ],
    beneficios: [
      {
        titulo: "Instalação Especializada",
        texto: "Equipe experiente em sistema pneumático e projetos super baixos",
      },
      {
        titulo: "Peças de Qualidade",
        texto: "Bolsas, compressores e válvulas de marcas confiáveis do mercado",
      },
      {
        titulo: "Entrega para todo Brasil",
        texto:
          "Enviamos peças para todo território nacional. Instalação em Maringá/PR",
      },
      {
        titulo: "Garantia e Suporte",
        texto:
          "90 dias de garantia na mão de obra + garantia do fabricante nas peças",
      },
    ],
    servicos: [
      "Projetos super baixos (bagged)",
      "Nivelamento por eixo",
      "Compressores e reservatórios",
      "Válvulas e mangueiras",
      "Controle bluetooth",
      "Suspensão mista (ar + mola)",
      "Reparos e manutenção",
      "Ajuste de altura em segundos",
    ],
    ctaTitulo: "Quer rebaixar ou nivelar seu carro com suspensão a ar?",
    ctaTexto:
      "Fale com nossos especialistas e receba o orçamento do seu projeto. Atendemos em Maringá-PR e enviamos para todo o Brasil.",
    whatsMensagem: "Olá! Quero um orçamento de suspensão a ar para meu carro.",
    seoTitulo: "Suspensão a Ar em Maringá | Car Crew Garage",
    seoDescricao:
      "Sistema de suspensão pneumática em Maringá-PR: bolsas de ar, compressores e controles bluetooth. Rebaixe ou nivele seu carro com conforto. Venda e instalação especializada.",
  },

  rebaixamento: {
    titulo: "Rebaixados em Maringá",
    intro: [
      "Rebaixar o carro é o primeiro passo pra deixar o visual com a cara do dono — mas precisa ser feito com peças certas e instalação caprichada. Na Car Crew Garage você encontra calços antirruído, kits de rebaixamento, bandejas reforçadas e pontas de eixo para rebaixar com segurança e sem barulho.",
      "Atendemos os principais modelos do mercado brasileiro: Gol, Voyage, Saveiro, Corsa, Celta, Prisma, Civic, Corolla e muito mais. Seja rebaixamento leve ou projeto mais baixo, nossa equipe em Maringá-PR monta o conjunto ideal pro seu carro — e enviamos peças para todo o Brasil.",
    ],
    beneficios: [
      {
        titulo: "Instalação Especializada",
        texto: "Equipe com mais de 10 anos de experiência em rebaixamento",
      },
      {
        titulo: "Peças de Qualidade",
        texto: "Calços, bandejas e pontas de eixo de marcas confiáveis",
      },
      {
        titulo: "Entrega para todo Brasil",
        texto:
          "Enviamos peças para todo território nacional. Instalação em Maringá/PR",
      },
      {
        titulo: "Garantia e Suporte",
        texto:
          "90 dias de garantia na mão de obra + garantia do fabricante nas peças",
      },
    ],
    servicos: [
      "Calços antirruído (coxim)",
      "Kits completos de rebaixamento",
      "Bandejas reforçadas",
      "Pontas de eixo",
      "Rebaixamento a mola",
      "Rebaixamento a calço",
      "Alinhamento e balanceamento",
      "Projetos super baixos",
    ],
    ctaTitulo: "Quer rebaixar seu carro com segurança?",
    ctaTexto:
      "Fale com nossos especialistas e receba o orçamento do seu projeto. Atendemos em Maringá-PR e enviamos para todo o Brasil.",
    whatsMensagem: "Olá! Quero um orçamento de rebaixamento para meu carro.",
    seoTitulo: "Rebaixados em Maringá | Peças e Instalação — Car Crew Garage",
    seoDescricao:
      "Tudo para carro rebaixado em Maringá-PR: calços antirruído, kits de rebaixamento, bandejas e pontas de eixo. Deixe seu carro na altura ideal com segurança. Venda e instalação.",
  },

  "suspensao-esportiva": {
    titulo: "Suspensão Esportiva em Maringá",
    intro: [
      "Suspensão esportiva muda completamente o comportamento do carro: menos rolagem nas curvas, resposta mais direta e uma dirigibilidade que combina com quem gosta de dirigir. Na Car Crew Garage você encontra amortecedores esportivos e kits de suspensão para deixar seu carro mais firme e estável.",
      "Trabalhamos com opções para os principais modelos do mercado — de hatches compactos a sedans — com instalação especializada em Maringá-PR e envio para todo o Brasil. Se o objetivo é performance no asfalto ou simplesmente um visual mais esportivo, temos a solução certa.",
    ],
    beneficios: [
      {
        titulo: "Instalação Especializada",
        texto:
          "Equipe com mais de 10 anos de experiência em suspensão esportiva",
      },
      {
        titulo: "Peças de Qualidade",
        texto: "Amortecedores e kits de marcas confiáveis do mercado",
      },
      {
        titulo: "Entrega para todo Brasil",
        texto:
          "Enviamos peças para todo território nacional. Instalação em Maringá/PR",
      },
      {
        titulo: "Garantia e Suporte",
        texto:
          "90 dias de garantia na mão de obra + garantia do fabricante nas peças",
      },
    ],
    servicos: [
      "Amortecedores esportivos",
      "Kits de suspensão",
      "Molas esportivas",
      "Buchas e coxins",
      "Revisão completa da suspensão",
      "Alinhamento e balanceamento",
      "Ajuste de altura",
      "Setup para track day",
    ],
    ctaTitulo: "Quer deixar seu carro mais estável e esportivo?",
    ctaTexto:
      "Fale com nossos especialistas e receba o orçamento do seu projeto. Atendemos em Maringá-PR e enviamos para todo o Brasil.",
    whatsMensagem: "Olá! Quero um orçamento de suspensão esportiva para meu carro.",
    seoTitulo:
      "Suspensão Esportiva em Maringá | Peças e Instalação — Car Crew Garage",
    seoDescricao:
      "Amortecedores e kits de suspensão esportiva em Maringá-PR: carro mais firme, menos rolagem e visual esportivo. Venda e instalação especializada.",
  },

  "off-road": {
    // H1 segue o padrão das outras LPs ("X em Maringá") e casa com o <title>
    // da página — antes era "POR QUE OFF-ROAD?", sem cidade e sem termo de busca.
    titulo: "Suspensão Off-Road e Lift 4x4",
    tituloDestaque: "em Maringá",
    selo: "MAIS QUE UM CAMINHO, UM ESTILO DE VIDA",
    intro: [
      "Prepare sua picape para qualquer terreno. Lift kits 4x4, suspensão off-road e acessórios para trilha em Maringá/PR.",
    ],
    beneficios: [
      {
        titulo: "Instalação Especializada",
        texto:
          "Equipe com mais de 10 anos de experiência em suspensão 4x4 e lift kits",
      },
      {
        titulo: "Peças de Qualidade",
        texto:
          "Trabalhamos com as melhores marcas: BDS Suspension, Rough Country, Fabtech, Pro Comp",
      },
      {
        titulo: "Entrega para todo Brasil",
        texto:
          "Enviamos peças para todo território nacional. Instalação em Maringá/PR",
      },
      {
        titulo: "Garantia e Suporte",
        texto:
          "90 dias de garantia na mão de obra + garantia do fabricante nas peças",
      },
    ],
    servicos: [
      'Lift kits 2", 4" e 6"',
      "Suspensão independente 4x4",
      "Shocks de longo curso",
      "Molas de elevação reforçadas",
      "Braços de suspensão reforçados",
      "Bloqueios de diferencial",
      "Snorkel e preparação para lama",
      "Acessórios off-road (engates, guinchos)",
    ],
    ctaTitulo: "Pronto pra encarar qualquer terreno?",
    ctaTexto:
      "Solicite um orçamento personalizado. Atendemos Maringá/PR e enviamos para todo o Brasil.",
    whatsMensagem: "Olá! Quero fazer um orçamento para suspensão off-road.",
    seoTitulo: "Suspensão Off-Road e Lift 4x4 em Maringá | Car Crew Garage",
    seoDescricao:
      "Especialistas em suspensão off-road, lift kits e elevação 4x4 em Maringá/PR. Trilha, lama, aventura — prepare sua picape com a Car Crew Garage.",
  },
};

const CHAVE = "lp_conteudo";

function texto(valor: unknown, max: number, padrao: string): string {
  if (typeof valor !== "string") return padrao;
  const limpo = valor.trim().slice(0, max);
  return limpo || padrao;
}

function listaTexto(valor: unknown, padrao: string[], max: number): string[] {
  if (!Array.isArray(valor)) return padrao;
  const itens = valor
    .map((v) => (typeof v === "string" ? v.trim().slice(0, max) : ""))
    .filter(Boolean)
    .slice(0, 20);
  return itens.length > 0 ? itens : padrao;
}

/** Junta o que veio do banco com o padrão da página, campo por campo. */
export function normalizarConteudo(slug: string, bruto: unknown): ConteudoLp {
  const padrao = CONTEUDO_PADRAO[slug];
  if (!padrao) throw new Error(`Página desconhecida: ${slug}`);

  const valor =
    bruto && typeof bruto === "object" ? (bruto as Partial<ConteudoLp>) : {};

  const beneficios = Array.isArray(valor.beneficios)
    ? valor.beneficios
        .map((b, i) => ({
          titulo: texto(
            (b as BeneficioLp)?.titulo,
            80,
            padrao.beneficios[i]?.titulo ?? ""
          ),
          texto: texto(
            (b as BeneficioLp)?.texto,
            240,
            padrao.beneficios[i]?.texto ?? ""
          ),
        }))
        .filter((b) => b.titulo && b.texto)
        .slice(0, 6)
    : padrao.beneficios;

  const conteudo: ConteudoLp = {
    titulo: texto(valor.titulo, 120, padrao.titulo),
    intro: listaTexto(valor.intro, padrao.intro, 1200),
    beneficios: beneficios.length > 0 ? beneficios : padrao.beneficios,
    servicos: listaTexto(valor.servicos, padrao.servicos, 120),
    ctaTitulo: texto(valor.ctaTitulo, 160, padrao.ctaTitulo),
    ctaTexto: texto(valor.ctaTexto, 400, padrao.ctaTexto),
    whatsMensagem: texto(valor.whatsMensagem, 400, padrao.whatsMensagem),
    seoTitulo: texto(valor.seoTitulo, 70, padrao.seoTitulo),
    seoDescricao: texto(valor.seoDescricao, 300, padrao.seoDescricao),
  };

  if (padrao.selo !== undefined) {
    conteudo.selo = texto(valor.selo, 80, padrao.selo);
  }
  if (padrao.tituloDestaque !== undefined) {
    conteudo.tituloDestaque = texto(
      valor.tituloDestaque,
      60,
      padrao.tituloDestaque
    );
  }

  return conteudo;
}

async function lerTodosBrutos(): Promise<Record<string, unknown>> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CHAVE } });
    if (row?.valor && typeof row.valor === "object") {
      return row.valor as Record<string, unknown>;
    }
  } catch (erro) {
    console.error("[lp-conteudo] falha ao ler:", erro);
  }
  return {};
}

export async function lerConteudoLp(slug: string): Promise<ConteudoLp> {
  const todos = await lerTodosBrutos();
  return normalizarConteudo(slug, todos[slug]);
}

export async function lerTodosConteudos(): Promise<Record<string, ConteudoLp>> {
  const todos = await lerTodosBrutos();
  const saida: Record<string, ConteudoLp> = {};
  for (const pagina of LPS) {
    saida[pagina.slug] = normalizarConteudo(pagina.slug, todos[pagina.slug]);
  }
  return saida;
}

function paraJson(c: ConteudoLp) {
  return {
    titulo: c.titulo,
    ...(c.tituloDestaque !== undefined ? { tituloDestaque: c.tituloDestaque } : {}),
    ...(c.selo !== undefined ? { selo: c.selo } : {}),
    intro: c.intro,
    beneficios: c.beneficios.map((b) => ({ titulo: b.titulo, texto: b.texto })),
    servicos: c.servicos,
    ctaTitulo: c.ctaTitulo,
    ctaTexto: c.ctaTexto,
    whatsMensagem: c.whatsMensagem,
    seoTitulo: c.seoTitulo,
    seoDescricao: c.seoDescricao,
  };
}

export async function salvarConteudoLp(
  slug: string,
  bruto: unknown
): Promise<ConteudoLp> {
  if (!CONTEUDO_PADRAO[slug]) throw new Error(`Página desconhecida: ${slug}`);

  const novo = normalizarConteudo(slug, bruto);
  const todos = await lerTodosBrutos();

  // Grava o conjunto inteiro reconstruído a partir de cada página conhecida:
  // o campo Json não aceita `Record<string, unknown>` e assim nenhuma chave
  // estranha sobra no banco.
  const valor: Record<string, ReturnType<typeof paraJson>> = {};
  for (const pagina of LPS) {
    const conteudo =
      pagina.slug === slug
        ? novo
        : normalizarConteudo(pagina.slug, todos[pagina.slug]);
    valor[pagina.slug] = paraJson(conteudo);
  }

  await prisma.configuracao.upsert({
    where: { chave: CHAVE },
    create: { chave: CHAVE, valor },
    update: { valor },
  });

  return novo;
}

/** Slugs que já têm texto salvo no painel (para a lista marcar "editada"). */
export async function lerLpsPersonalizados(): Promise<string[]> {
  const todos = await lerTodosBrutos();
  return Object.keys(todos).filter((slug) => slug in CONTEUDO_PADRAO);
}
