import prisma from "@/lib/prisma";
import {
  ErroOS,
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

    await tx.osItem.create({
      data: {
        ordemId,
        tipo: item.tipo,
        descricao: item.descricao.trim(),
        produtoId: item.produtoId ?? null,
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
      ...(dados.prazo !== undefined ? { prazo: dados.prazo ? new Date(dados.prazo) : null } : {}),
    },
  });
}
