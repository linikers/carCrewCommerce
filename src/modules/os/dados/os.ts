import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  ErroOS,
  baixaEstoque,
  calcularTotais,
  podeMudarStatus,
  validarItem,
  validarNovaOS,
  type ItemOS,
} from "../dominio/os";

/**
 * Persistência da ordem de serviço (#80).
 *
 * Totais são recalculados a cada mudança de item — nunca digitados à mão.
 */

export async function listarOS(filtro?: { status?: string; busca?: string }) {
  const where: Record<string, unknown> = {};

  if (filtro?.status && filtro.status !== "todos") where.status = filtro.status;

  if (filtro?.busca?.trim()) {
    const t = filtro.busca.trim();
    where.OR = [
      { clienteNome: { contains: t, mode: "insensitive" } },
      { veiculo: { contains: t, mode: "insensitive" } },
      { placa: { contains: t, mode: "insensitive" } },
      { descricaoProblema: { contains: t, mode: "insensitive" } },
    ];
  }

  return prisma.ordemServico.findMany({
    where,
    orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
    take: 200,
    include: { itens: { select: { id: true } } },
  });
}

export async function lerOS(id: string) {
  return prisma.ordemServico.findUnique({
    where: { id },
    include: { itens: { orderBy: { descricao: "asc" } } },
  });
}

export async function criarOS(dados: {
  clienteNome: string;
  clienteTelefone?: string | null;
  clienteEmail?: string | null;
  clienteDocumento?: string | null;
  veiculo: string;
  placa?: string | null;
  km?: number | null;
  descricaoProblema: string;
  observacoes?: string | null;
  prazo?: string | null;
  /** data de abertura (YYYY-MM-DD). Ausente = agora */
  dataAbertura?: string | null;
}) {
  validarNovaOS(dados);

  return prisma.ordemServico.create({
    data: {
      clienteNome: dados.clienteNome.trim(),
      clienteTelefone: dados.clienteTelefone || null,
      clienteEmail: dados.clienteEmail || null,
      clienteDocumento: dados.clienteDocumento
        ? String(dados.clienteDocumento).replace(/\D/g, "")
        : null,
      veiculo: dados.veiculo.trim(),
      placa: dados.placa ? dados.placa.toUpperCase().trim() : null,
      km: dados.km ? Number(dados.km) : null,
      descricaoProblema: dados.descricaoProblema.trim(),
      observacoes: dados.observacoes || null,
      prazo: dados.prazo ? new Date(dados.prazo) : null,
      ...(dados.dataAbertura
        ? { criadoEm: new Date(`${dados.dataAbertura}T12:00:00`) }
        : {}),
      // link público do orçamento (#os)
      tokenPublico: randomUUID().replace(/-/g, ""),
    },
  });
}

/**
 * Baixa (ou devolve) estoque de um item do catálogo dentro da transação.
 * A OS usa o mesmo livro de movimentos da venda — assim o histórico de uma peça
 * mostra tudo que aconteceu com ela, venha de pedido ou de oficina.
 */
async function moverEstoque(
  tx: Prisma.TransactionClient,
  produtoId: number,
  quantidade: number,
  motivo: string
) {
  const produto = await tx.produto.findUnique({ where: { id: produtoId } });
  if (!produto) throw new ErroOS("Peça do catálogo não encontrada", "ITEM");

  const delta = -quantidade;
  const saldo = produto.estoque + delta;
  if (saldo < 0) {
    throw new ErroOS(
      `Estoque insuficiente para "${produto.nome}" (disponível: ${produto.estoque})`,
      "ITEM"
    );
  }

  await tx.produto.update({ where: { id: produtoId }, data: { estoque: saldo } });
  await tx.estoqueMovimento.create({
    data: {
      produtoId,
      tipo: delta < 0 ? "saida" : "entrada",
      quantidade: delta,
      saldoDepois: saldo,
      motivo,
      origem: "os",
    },
  });
}

export async function adicionarItem(ordemId: string, item: ItemOS) {
  validarItem(item);

  return prisma.$transaction(async (tx) => {
    const ordem = await tx.ordemServico.findUnique({ where: { id: ordemId } });
    if (!ordem) throw new ErroOS("Ordem não encontrada");
    if (ordem.status === "entregue" || ordem.status === "cancelada") {
      throw new ErroOS("Ordem fechada não recebe item novo", "STATUS");
    }

    const total = Number((item.quantidade * item.valorUnit).toFixed(2));

    // peça do catálogo baixa estoque; peça comprada fora e terceiro não
    if (baixaEstoque(item)) {
      await moverEstoque(tx, item.produtoId as number, item.quantidade, `OS ${ordemId}`);
    }

    await tx.osItem.create({
      data: {
        ordemId,
        tipo: item.tipo,
        descricao: item.descricao.trim(),
        produtoId: item.produtoId ?? null,
        origem: item.tipo === "peca" ? (item.origem ?? "externa") : null,
        custo: item.custo ?? null,
        terceiro: item.terceiro ?? null,
        quantidade: item.quantidade,
        valorUnit: item.valorUnit,
        total,
      },
    });

    const itens = await tx.osItem.findMany({ where: { ordemId } });
    const totais = calcularTotais(
      itens.map((i) => ({
        tipo: i.tipo as "peca" | "servico",
        descricao: i.descricao,
        quantidade: i.quantidade,
        valorUnit: i.valorUnit,
      }))
    );

    return tx.ordemServico.update({
      where: { id: ordemId },
      data: { totalPecas: totais.totalPecas, totalServicos: totais.totalServicos, total: totais.total },
      include: { itens: true },
    });
  });
}

export async function removerItem(ordemId: string, itemId: string) {
  return prisma.$transaction(async (tx) => {
    const removido = await tx.osItem.findUnique({ where: { id: itemId } });
    if (!removido) throw new ErroOS("Item não encontrado", "ITEM");

    // devolve ao estoque o que saiu por causa deste item
    if (
      baixaEstoque({
        tipo: removido.tipo as ItemOS["tipo"],
        origem: removido.origem as ItemOS["origem"],
        produtoId: removido.produtoId,
      })
    ) {
      await moverEstoque(
        tx,
        removido.produtoId as number,
        -removido.quantidade,
        `OS ${ordemId} — item removido`
      );
    }

    await tx.osItem.delete({ where: { id: itemId } });

    const itens = await tx.osItem.findMany({ where: { ordemId } });
    const totais = calcularTotais(
      itens.map((i) => ({
        tipo: i.tipo as "peca" | "servico",
        descricao: i.descricao,
        quantidade: i.quantidade,
        valorUnit: i.valorUnit,
      }))
    );

    return tx.ordemServico.update({
      where: { id: ordemId },
      data: { totalPecas: totais.totalPecas, totalServicos: totais.totalServicos, total: totais.total },
      include: { itens: true },
    });
  });
}

export async function mudarStatus(ordemId: string, novo: string) {
  const ordem = await prisma.ordemServico.findUnique({ where: { id: ordemId } });
  if (!ordem) throw new ErroOS("Ordem não encontrada");

  if (!podeMudarStatus(ordem.status, novo)) {
    throw new ErroOS(
      `Não dá para ir de "${ordem.status}" para "${novo}"`,
      "STATUS"
    );
  }

  return prisma.ordemServico.update({ where: { id: ordemId }, data: { status: novo } });
}

export async function atualizarOS(
  ordemId: string,
  dados: Partial<{
    clienteNome: string;
    clienteTelefone: string | null;
    veiculo: string;
    placa: string | null;
    km: number | null;
    descricaoProblema: string;
    observacoes: string | null;
    prazo: string | null;
    dataAbertura: string | null;
  }>
) {
  return prisma.ordemServico.update({
    where: { id: ordemId },
    data: {
      ...(dados.clienteNome !== undefined ? { clienteNome: dados.clienteNome.trim() } : {}),
      ...(dados.clienteTelefone !== undefined ? { clienteTelefone: dados.clienteTelefone } : {}),
      ...(dados.veiculo !== undefined ? { veiculo: dados.veiculo.trim() } : {}),
      ...(dados.placa !== undefined ? { placa: dados.placa?.toUpperCase() ?? null } : {}),
      ...(dados.km !== undefined ? { km: dados.km } : {}),
      ...(dados.descricaoProblema !== undefined
        ? { descricaoProblema: dados.descricaoProblema.trim() }
        : {}),
      ...(dados.observacoes !== undefined ? { observacoes: dados.observacoes } : {}),
      ...(dados.dataAbertura
        ? { criadoEm: new Date(`${dados.dataAbertura}T12:00:00`) }
        : {}),
      ...(dados.prazo !== undefined ? { prazo: dados.prazo ? new Date(dados.prazo) : null } : {}),
    },
  });
}

/**
 * Orçamento público (#os): o cliente abre o link sem login e aprova ou recusa.
 *
 * Só devolve o que o cliente precisa ver — sem custo interno e sem margem.
 */
export async function lerOrcamentoPublico(token: string) {
  const ordem = await prisma.ordemServico.findUnique({
    where: { tokenPublico: token },
    include: { itens: { orderBy: { id: "asc" } } },
  });

  if (!ordem) return null;

  return {
    id: ordem.id,
    clienteNome: ordem.clienteNome,
    veiculo: ordem.veiculo,
    placa: ordem.placa,
    status: ordem.status,
    descricaoProblema: ordem.descricaoProblema,
    observacoes: ordem.observacoes,
    criadoEm: ordem.criadoEm,
    aprovadoEm: ordem.aprovadoEm,
    total: ordem.total,
    totalPecas: ordem.totalPecas,
    totalServicos: ordem.totalServicos,
    itens: ordem.itens.map((i) => ({
      id: i.id,
      tipo: i.tipo,
      descricao: i.descricao,
      quantidade: i.quantidade,
      valorUnit: i.valorUnit,
      total: i.total,
    })),
  };
}

/** Cliente aprova ou recusa o orçamento pelo link. */
export async function decidirOrcamento(token: string, aprovado: boolean) {
  const ordem = await prisma.ordemServico.findUnique({ where: { tokenPublico: token } });
  if (!ordem) throw new ErroOS("Orçamento não encontrado");

  if (ordem.status === "entregue" || ordem.status === "cancelada") {
    throw new ErroOS("Esta OS já foi encerrada", "STATUS");
  }
  if (ordem.status === "execucao" || ordem.status === "concluida") {
    throw new ErroOS("Este serviço já está em andamento", "STATUS");
  }
  if (ordem.aprovadoEm) {
    throw new ErroOS("Este orçamento já foi respondido", "STATUS");
  }

  return prisma.ordemServico.update({
    where: { id: ordem.id },
    data: aprovado
      ? { status: "aprovada", aprovadoEm: new Date() }
      : { status: "orcamento", observacoes: `${ordem.observacoes ?? ""}\n[cliente recusou o orçamento]`.trim() },
  });
}

/** OS anteriores do mesmo carro (histórico por placa). */
export async function historicoPorPlaca(placa: string, ignorarId?: string) {
  const limpa = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (limpa.length < 5) return [];

  return prisma.ordemServico.findMany({
    where: {
      placa: limpa,
      ...(ignorarId ? { id: { not: ignorarId } } : {}),
    },
    orderBy: { criadoEm: "desc" },
    take: 10,
    select: {
      id: true,
      veiculo: true,
      status: true,
      criadoEm: true,
      total: true,
      descricaoProblema: true,
    },
  });
}
