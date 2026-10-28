import { revalidateTag, unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Perguntas do FAQ editáveis no painel (#181).
 *
 * O texto vivia numa constante dentro de `src/app/faq/page.tsx`: mudar uma
 * resposta exigia PR e deploy. Aqui o código é o **padrão** e o painel grava
 * só o que o dono mudou (chave `configuracoes.pagina_faq`). Sem a chave no
 * banco, a página continua exatamente como é hoje.
 */

export interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
  ativo: boolean;
  ordem: number;
}

export const CHAVE_FAQ = "pagina_faq";
export const TAG_FAQ = "pagina-faq";

/** Texto atual do site — vira padrão e volta a valer se o campo for esvaziado. */
export const FAQ_PADRAO: FaqItem[] = [
  {
    id: "faq-1",
    pergunta: "Qual a diferença entre suspensão a ar, fixa e rosca?",
    resposta:
      "A diferença principal é a regulagem de altura. A suspensão a ar e a rosca (coilover) são ajustáveis — no ar você controla a altura em tempo real por um painel (perfeito para qualquer terreno), e na rosca você regula manualmente girando o anel de pré-carga. A suspensão fixa tem altura definida de fábrica; qualquer mudança exige retrabalho mecânico (troca de molas, corte, etc). Resumindo: ar = regulagem dinâmica via controle; rosca = regulagem manual por ajuste mecânico; fixa = sem regulagem, alteração exige retrabalho.",
    ativo: true,
    ordem: 0,
  },
  {
    id: "faq-2",
    pergunta: "Qual suspensão escolher para meu carro?",
    resposta:
      "Depende do uso que você faz do veículo. Para uso urbano e versatilidade, a suspensão a ar é a mais comum — você ajusta a altura conforme o terreno ou situação (subindo em lombadas, rebaixando para estilo). Para quem anda na cidade e também vai para pista/autódromo, a rosca (coilover) ou a fixa são as mais indicadas, pela precisão em curvas e resposta esportiva. O ar entrega o melhor conforto e comodidade para os mais variados tipos de terreno, mas se o foco é performance pura em pista, rosca ou fixa são superiores. Cada projeto é conversado caso a caso — fale com a gente pelo WhatsApp para uma recomendação personalizada.",
    ativo: true,
    ordem: 1,
  },
  {
    id: "faq-3",
    pergunta: "Vocês entregam para todo o Brasil?",
    resposta:
      "Sim. Enviamos para todo o território nacional via Correios e transportadoras parceiras. Já temos mais de 500 vendas concluídas para fora do nosso estado, com clientes satisfeitos em todas as regiões. O frete é calculado pelo CEP no checkout e o prazo varia conforme a região.",
    ativo: true,
    ordem: 2,
  },
  {
    id: "faq-4",
    pergunta: "Quanto custa uma suspensão instalada?",
    resposta:
      "Atualmente, modificar uma suspensão parte de R$ 900. O teto é definido pelo orçamento do cliente, porque trabalhamos com acessórios nacionais e importados das mais variadas faixas de preço. Cada projeto tem suas particularidades — tipo de suspensão, marca dos componentes, modelo do veículo e nível de personalização. Por isso fazemos um orçamento detalhado, sem compromisso, de acordo com o que você quer.",
    ativo: true,
    ordem: 3,
  },
  {
    id: "faq-5",
    pergunta: "A suspensão rebaixada ou lift é legalizada?",
    resposta:
      "Sim, é possível legalizar suspensão rebaixada e lift, respeitando os limites do CONTRAN. Para carros rebaixados, o limite é de 10 cm em relação à altura original do veículo (Resolução CONTRAN nº 292/2008). Para lift (elevação), não há limite de altura fixado, mas o veículo precisa passar por vistoria técnica e homologação junto ao DETRAN/PR, com laudo de inspeção veicular. A Car Crew Garage orienta todos os clientes sobre a documentação e o processo de regularização.",
    ativo: true,
    ordem: 4,
  },
  {
    id: "faq-6",
    pergunta: "Posso parcelar a instalação?",
    resposta:
      "Sim, aceitamos parcelamento da instalação. Entre em contato pelo WhatsApp {{telefone}} para combinar as condições de pagamento direto. Para produtos da loja, o pagamento é via PIX.",
    ativo: true,
    ordem: 5,
  },
  {
    id: "faq-7",
    pergunta: "Vocês fazem orçamento sem compromisso?",
    resposta:
      "Sim, fazemos orçamento sem compromisso. Mande pelo WhatsApp {{telefone}} o modelo e ano do veículo, o tipo de suspensão desejada e (se possível) fotos do projeto. Respondemos com orçamento detalhado em até 24 horas.",
    ativo: true,
    ordem: 6,
  },
  {
    id: "faq-8",
    pergunta: "Quanto tempo leva a instalação?",
    resposta:
      "Em média, 1 semana para instalar. Dependendo do tipo de suspensão e da complexidade do projeto, o prazo pode ser menor ou maior — uma suspensão fixa costuma ser instalada no mesmo dia, enquanto uma suspensão a ar completa (com compressor, manifolds, chicotes elétricos) pode levar 2 a 3 dias úteis. O agendamento é feito conforme sua disponibilidade.",
    ativo: true,
    ordem: 7,
  },
];

function normalizar(itens: unknown): FaqItem[] | null {
  if (!Array.isArray(itens)) return null;

  const limpos = itens
    .filter((i): i is Record<string, unknown> => Boolean(i) && typeof i === "object")
    .map((i, indice) => ({
      id: String(i.id ?? `faq-${indice + 1}`).slice(0, 40),
      pergunta: String(i.pergunta ?? "").trim(),
      resposta: String(i.resposta ?? "").trim(),
      ativo: i.ativo !== false,
      ordem: Number.isFinite(Number(i.ordem)) ? Number(i.ordem) : indice,
    }))
    .filter((i) => i.pergunta && i.resposta);

  return limpos.length > 0 ? limpos.sort((a, b) => a.ordem - b.ordem) : null;
}

async function lerBruto(): Promise<FaqItem[]> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CHAVE_FAQ } });
    const salvo = normalizar((row?.valor as { itens?: unknown })?.itens);
    if (salvo) return salvo;
  } catch (erro) {
    console.error("[faq] falha ao ler:", erro);
  }
  return FAQ_PADRAO;
}

const lerCache = unstable_cache(lerBruto, ["faq-conteudo"], {
  tags: [TAG_FAQ],
  revalidate: 60 * 60 * 24,
});

/** Itens publicados, na ordem, já sem os desligados. */
export async function lerFaqPublico(): Promise<FaqItem[]> {
  const itens = await lerCache();
  return itens.filter((i) => i.ativo);
}

/** Todos os itens (inclusive desligados) — tela do painel. */
export async function lerTodosFaq(): Promise<FaqItem[]> {
  return lerCache();
}

export async function salvarFaq(itens: FaqItem[]): Promise<FaqItem[]> {
  const limpos = normalizar(itens);
  if (!limpos) {
    throw new Error("Informe pelo menos uma pergunta com resposta.");
  }

  // Round-trip garante JSON puro (o tipo Json do Prisma não aceita interface).
  const valor = JSON.parse(JSON.stringify({ itens: limpos }));

  await prisma.configuracao.upsert({
    where: { chave: CHAVE_FAQ },
    create: { chave: CHAVE_FAQ, valor },
    update: { valor },
  });

  return limpos;
}

export function invalidarFaq(): void {
  revalidateTag(TAG_FAQ, { expire: 0 });
}
