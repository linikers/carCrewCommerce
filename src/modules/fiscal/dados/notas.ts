import prisma from "@/lib/prisma";

/**
 * Fila de notas fiscais (interface do emissor).
 *
 * O site não emite nem transmite: ele mantém o estado da nota e entrega o
 * pacote de dados para o emissor do cliente. Este arquivo é o que decide **quem
 * entra na fila** e **por que um pedido não pode entrar** — a mensagem é a
 * interface: o dono lê "peça sem CSOSN" e sabe o que corrigir.
 */

export const STATUS_NOTA = [
  "pendente",
  "pronta",
  "exportada",
  "autorizada",
  "rejeitada",
  "cancelada",
] as const;

export type StatusNota = (typeof STATUS_NOTA)[number];

export const STATUS_NOTA_LABEL: Record<StatusNota, string> = {
  pendente: "Faltando dado",
  pronta: "Pronta para o lote",
  exportada: "Exportada",
  autorizada: "Autorizada",
  rejeitada: "Rejeitada",
  cancelada: "Cancelada",
};

/** Status do pedido que já podem virar nota. */
const STATUS_PEDIDO_EMITIVEL = ["pago", "em_separacao", "enviado", "entregue"];

interface PoliticaFiscal {
  emitirSite: boolean;
  emitirMarketplace: boolean;
  emitirPdv: boolean;
}

const POLITICA_PADRAO: PoliticaFiscal = {
  emitirSite: false,
  emitirMarketplace: true,
  emitirPdv: false,
};

async function lerPolitica(): Promise<PoliticaFiscal> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: "fiscal" } });
    const salvo = (row?.valor ?? {}) as Partial<PoliticaFiscal>;
    return {
      emitirSite: Boolean(salvo.emitirSite ?? POLITICA_PADRAO.emitirSite),
      emitirMarketplace: Boolean(salvo.emitirMarketplace ?? POLITICA_PADRAO.emitirMarketplace),
      emitirPdv: Boolean(salvo.emitirPdv ?? POLITICA_PADRAO.emitirPdv),
    };
  } catch {
    return POLITICA_PADRAO;
  }
}

/** Canal → chave da política (o dono decide por canal, não por pedido). */
export function deveEmitirNoCanal(canal: string, politica: PoliticaFiscal): boolean {
  if (canal === "site") return politica.emitirSite;
  if (canal === "mercado_livre" || canal === "shopee") return politica.emitirMarketplace;
  return politica.emitirPdv;
}

interface EnderecoPedido {
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
}

/** O que falta para este pedido virar nota. Vazio = pronto para o lote. */
export function pendenciasDoPedido(pedido: {
  clienteDocumento: string | null;
  enderecoEntrega: unknown;
  itens: { nome: string; ncm: string | null; cfop: string | null; cstCsosn: string | null }[];
}): string[] {
  const faltas: string[] = [];

  if (!pedido.clienteDocumento) faltas.push("cliente sem CPF/CNPJ");

  const endereco = (pedido.enderecoEntrega ?? {}) as EnderecoPedido;
  const camposEndereco: (keyof EnderecoPedido)[] = ["logradouro", "numero", "cidade", "uf", "cep"];
  const faltandoEndereco = camposEndereco.filter((c) => !endereco[c]);
  if (faltandoEndereco.length > 0) faltas.push(`endereço incompleto (${faltandoEndereco.join(", ")})`);

  const semFiscal = pedido.itens.filter((i) => !i.ncm || !i.cfop || !i.cstCsosn);
  if (semFiscal.length > 0) {
    const nomes = semFiscal.slice(0, 2).map((i) => i.nome.slice(0, 28)).join(", ");
    faltas.push(
      `${semFiscal.length} item(ns) sem NCM/CFOP/CSOSN${nomes ? `: ${nomes}${semFiscal.length > 2 ? "…" : ""}` : ""}`
    );
  }

  return faltas;
}

export interface GeracaoPendencias {
  avaliados: number;
  criados: number;
  prontos: number;
  comPendencia: number;
  foraDaPolitica: number;
}

/**
 * Gera a fila para os pedidos do período. Idempotente: pedido que já tem nota
 * não entra de novo (inclusive nota já exportada/autorizada).
 */
export async function gerarPendencias(periodo: {
  de: Date;
  ate: Date;
  canal?: string | null;
}): Promise<GeracaoPendencias> {
  const politica = await lerPolitica();

  const pedidos = await prisma.pedido.findMany({
    where: {
      ...(periodo.canal ? { canal: periodo.canal } : {}),
      status: { in: STATUS_PEDIDO_EMITIVEL },
      nota: null,
      OR: [
        { vendaEm: { gte: periodo.de, lte: periodo.ate } },
        { vendaEm: null, createdAt: { gte: periodo.de, lte: periodo.ate } },
      ],
    },
    include: { itens: true },
    take: 500,
  });

  let foraDaPolitica = 0;
  let prontos = 0;
  let comPendencia = 0;
  let criados = 0;

  for (const pedido of pedidos) {
    if (!deveEmitirNoCanal(pedido.canal, politica)) {
      foraDaPolitica += 1;
      continue;
    }

    const faltas = pendenciasDoPedido({
      clienteDocumento: pedido.clienteDocumento,
      enderecoEntrega: pedido.enderecoEntrega,
      itens: pedido.itens.map((i) => ({
        nome: i.nome,
        ncm: i.ncm,
        cfop: i.cfop,
        cstCsosn: i.cstCsosn,
      })),
    });

    const status: StatusNota = faltas.length === 0 ? "pronta" : "pendente";
    if (faltas.length === 0) prontos += 1;
    else comPendencia += 1;

    await prisma.notaFiscal.create({
      data: {
        pedidoId: pedido.id,
        canal: pedido.canal,
        status,
        motivo: faltas.length > 0 ? faltas.join(" · ") : null,
      },
    });
    criados += 1;
  }

  return { avaliados: pedidos.length, criados, prontos, comPendencia, foraDaPolitica };
}

export interface NotaComPedido {
  id: string;
  pedidoId: string;
  canal: string;
  status: string;
  motivo: string | null;
  numero: string | null;
  serie: string | null;
  chave: string | null;
  exportadaEm: Date | null;
  autorizadaEm: Date | null;
  criadoEm: Date;
  pedido: {
    total: number;
    clienteNome: string | null;
    clienteDocumento: string | null;
    createdAt: Date;
  };
}

export async function listarNotas(filtros: {
  status?: string | null;
  canal?: string | null;
  de?: Date | null;
  ate?: Date | null;
}): Promise<{ notas: NotaComPedido[]; contagem: Record<string, number> }> {
  const where = {
    ...(filtros.status ? { status: filtros.status } : {}),
    ...(filtros.canal ? { canal: filtros.canal } : {}),
    ...(filtros.de || filtros.ate
      ? { criadoEm: { ...(filtros.de ? { gte: filtros.de } : {}), ...(filtros.ate ? { lte: filtros.ate } : {}) } }
      : {}),
  };

  const [notas, agrupado] = await Promise.all([
    prisma.notaFiscal.findMany({
      where,
      include: {
        pedido: {
          select: {
            total: true,
            clienteNome: true,
            clienteDocumento: true,
            createdAt: true,
          },
        },
      },
      orderBy: { criadoEm: "desc" },
      take: 200,
    }),
    prisma.notaFiscal.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const contagem: Record<string, number> = {};
  for (const g of agrupado) contagem[g.status] = g._count._all;

  return { notas, contagem };
}
