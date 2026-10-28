import { revalidateTag, unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Páginas institucionais editáveis no painel (#182).
 *
 * Sobre, Trocas e Privacidade eram JSX com o texto preso no código. Aqui o
 * código vira **padrão** e o painel grava só o que o dono mudou
 * (`configuracoes.paginas_institucionais`). Layout de cada página continua no
 * código: o que se edita é título, subtítulo e as seções de texto.
 */

export const SLUGS_INSTITUCIONAIS = ["sobre", "trocas", "privacidade"] as const;
export type SlugInstitucional = (typeof SLUGS_INSTITUCIONAIS)[number];

export interface SecaoInstitucional {
  id: string;
  titulo: string;
  /** Parágrafos separados por linha em branco. Linha começando com "- " vira item de lista. */
  texto: string;
}

export interface PaginaInstitucional {
  slug: SlugInstitucional;
  titulo: string;
  subtitulo: string;
  /** Faixa de aviso no topo (usada em Trocas: prazo de 7 dias). */
  destaque: string;
  secoes: SecaoInstitucional[];
}

export const CHAVE_PAGINAS = "paginas_institucionais";
export const TAG_PAGINAS = "paginas-institucionais";

export const PADRAO: Record<SlugInstitucional, PaginaInstitucional> = {
  sobre: {
    slug: "sobre",
    destaque: "",
    titulo: "Sobre a Car Crew Garage",
    subtitulo: "Mais de 10 anos transformando veículos em paixão",
    secoes: [
      {
        id: "sobre-1",
        titulo: "Nossa História",
        texto:
          "A **Car Crew Garage** nasceu da paixão por veículos customizados e da\nvontade de transformar cada projeto em algo único. Com sede em\n**Maringá/PR** e **mais de 10 anos de experiência** no\nmercado de customização automotiva, construímos uma trajetória baseada em\nqualidade, inovação e dedicação aos apaixonados por carros.\n\nSomos especialistas em **suspensão a ar**,\n**suspensão fixa**, **suspensão rosca (coilover)**,\n**kits lift** e projetos de personalização automotiva para quem\nbusca exclusividade, desempenho e um acabamento impecável. Nossa oficina atende\nclientes de Maringá e região que buscam o melhor em **rebaixados**\ne customização — mais do que\ninstalar componentes, desenvolvemos soluções sob medida para que cada veículo\nreflita a personalidade do seu proprietário.\n\nAo longo dos anos, conquistamos a confiança de clientes de diversas regiões do\nBrasil e hoje somos reconhecidos como **um dos destaques da cena\nautomotiva**, resultado do compromisso com a excelência, da qualidade\ndos produtos que oferecemos e da atenção aos mínimos detalhes em cada projeto.",
      },
      {
        id: "sobre-2",
        titulo: "O que Fazemos",
        texto:
          "Seja para um carro rebaixado de alto nível, um kit lift preparado para qualquer\ndesafio ou uma customização completa, nossa missão é entregar um resultado\nque supere expectativas e faça seu veículo se destacar por onde passar.\n\nNa **Car Crew Garage**, cada projeto é tratado como único, porque\nsabemos que um veículo personalizado não é apenas um meio de transporte — é\numa paixão, um estilo de vida e uma extensão de quem está ao volante.",
      },
    ],
  },
  trocas: {
    slug: "trocas",
    destaque: "Você tem até 7 dias após o recebimento para solicitar troca ou devolução.",
    titulo: "Trocas e Devoluções",
    subtitulo: "",
    secoes: [
      {
        id: "trocas-1",
        titulo: "Condições para Troca",
        texto:
          "Para que a troca seja aceita, o produto deve estar:\n- Na embalagem original\n- Sem sinais de uso ou instalação\n- Com todos os acessórios inclusos\n- Com nota fiscal",
      },
      {
        id: "trocas-2",
        titulo: "Como Solicitar",
        texto:
          "- Entre em contato pelo WhatsApp {{telefone}}\n- Informe o número do pedido e o motivo da troca\n- Aguarde instruções para envio do produto\n- Após receber o produto, processaremos a troca em até 5 dias úteis",
      },
      {
        id: "trocas-3",
        titulo: "Frete de Devolução",
        texto:
          "O frete de devolução é de responsabilidade do cliente, exceto\nquando o produto apresentar defeito de fabricação.",
      },
      {
        id: "trocas-4",
        titulo: "Itens com Restrição de Troca",
        texto:
          "Não aceitamos troca para:\n- Produtos personalizados ou sob medida\n- Produtos instalados ou com sinais de uso\n- Acessórios sem embalagem original",
      },
      {
        id: "trocas-5",
        titulo: "Reembolso",
        texto:
          "O reembolso será processado em até 10 dias úteis após a\nconfirmação da devolução, na mesma forma de pagamento utilizada\nna compra.",
      },
    ],
  },
  privacidade: {
    slug: "privacidade",
    destaque: "",
    titulo: "Política de Privacidade",
    subtitulo: "Última atualização: Julho 2026",
    secoes: [
      {
        id: "privacidade-1",
        titulo: "1. Dados Coletados",
        texto:
          "Coletamos os seguintes dados quando você realiza uma compra:\n- Nome completo\n- Telefone / WhatsApp\n- Endereço (CEP, rua, número, bairro, cidade)\n- E-mail\n- Dados de pagamento (processados pelo gateway)",
      },
      {
        id: "privacidade-2",
        titulo: "2. Uso dos Dados",
        texto:
          "Seus dados são utilizados para:\n- Processar e entregar seu pedido\n- Enviar atualizações sobre o status do pedido\n- Entrar em contato para esclarecer dúvidas\n- Cumprir obrigações legais (nota fiscal)",
      },
      {
        id: "privacidade-3",
        titulo: "3. Compartilhamento com Terceiros",
        texto:
          "Seus dados podem ser compartilhados com:\n- Transportadoras (para entrega do pedido)\n- Gateway de pagamento (para processar o pagamento)\n- Órgãos fiscais (quando obrigatório por lei)",
      },
      {
        id: "privacidade-4",
        titulo: "4. Cookies",
        texto:
          "Utilizamos cookies para manter seu carrinho de compras e melhorar\nsua experiência de navegação.",
      },
      {
        id: "privacidade-5",
        titulo: "5. Seus Direitos (LGPD)",
        texto:
          "Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:\n- Solicitar acesso aos seus dados\n- Solicitar correção de dados incorretos\n- Solicitar a exclusão dos seus dados\n- Revogar o consentimento a qualquer momento",
      },
      {
        id: "privacidade-6",
        titulo: "6. Contato",
        texto:
          "Para exercer seus direitos ou esclarecer dúvidas sobre esta\npolítica, entre em contato:\n\nWhatsApp: {{telefone}}\nE-mail: {{email}}",
      },
    ],
  },
};

function normalizarPagina(slug: SlugInstitucional, bruto: unknown): PaginaInstitucional | null {
  if (!bruto || typeof bruto !== "object") return null;
  const p = bruto as Partial<PaginaInstitucional>;
  const secoes = Array.isArray(p.secoes)
    ? p.secoes
        .filter((s): s is SecaoInstitucional => Boolean(s) && typeof s === "object")
        .map((s, i) => ({
          id: String(s.id ?? `${slug}-${i + 1}`).slice(0, 40),
          titulo: String(s.titulo ?? "").trim(),
          texto: String(s.texto ?? "").trim(),
        }))
        .filter((s) => s.titulo || s.texto)
    : [];

  if (secoes.length === 0) return null;

  return {
    slug,
    titulo: String(p.titulo ?? "").trim() || PADRAO[slug].titulo,
    subtitulo: String(p.subtitulo ?? "").trim(),
    destaque: String(p.destaque ?? "").trim(),
    secoes,
  };
}

async function lerBruto(): Promise<Record<string, unknown>> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CHAVE_PAGINAS } });
    return (row?.valor as Record<string, unknown>) ?? {};
  } catch (erro) {
    console.error("[paginas] falha ao ler:", erro);
    return {};
  }
}

const lerCache = unstable_cache(lerBruto, ["paginas-institucionais"], {
  tags: [TAG_PAGINAS],
  revalidate: 60 * 60 * 24,
});

export async function lerPagina(slug: SlugInstitucional): Promise<PaginaInstitucional> {
  const salvo = await lerCache();
  return normalizarPagina(slug, salvo?.[slug]) ?? PADRAO[slug];
}

export async function lerTodasPaginas(): Promise<PaginaInstitucional[]> {
  const salvo = await lerCache();
  return SLUGS_INSTITUCIONAIS.map(
    (slug) => normalizarPagina(slug, salvo?.[slug]) ?? PADRAO[slug]
  );
}

export async function salvarPagina(pagina: PaginaInstitucional): Promise<PaginaInstitucional> {
  if (!SLUGS_INSTITUCIONAIS.includes(pagina.slug)) {
    throw new Error("Página inválida.");
  }
  const normalizada = normalizarPagina(pagina.slug, pagina);
  if (!normalizada) {
    throw new Error("A página precisa de pelo menos uma seção com texto.");
  }

  const atual = await lerBruto();
  const valor = JSON.parse(JSON.stringify({ ...atual, [pagina.slug]: normalizada }));

  await prisma.configuracao.upsert({
    where: { chave: CHAVE_PAGINAS },
    create: { chave: CHAVE_PAGINAS, valor },
    update: { valor },
  });

  return normalizada;
}

export function invalidarPaginas(): void {
  revalidateTag(TAG_PAGINAS, { expire: 0 });
}
