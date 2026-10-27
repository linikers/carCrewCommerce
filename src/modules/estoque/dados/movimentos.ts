import prisma from "@/lib/prisma";
import type { TransactionClient } from "@/generated/prisma/internal/prismaNamespace";
import {
  ErroEstoque,
  validarMovimento,
  type MovimentoEntrada,
} from "../dominio/movimento";

/**
 * Persistência do estoque (#73).
 *
 * O saldo mora em duas camadas: `estoque_movimentos` (histórico, a verdade) e
 * `produtos.estoque` (saldo materializado, para listar sem somar a tabela).
 * Toda escrita atualiza as duas **na mesma transação**.
 */

type Tx = TransactionClient | typeof prisma;

/**
 * Registra um movimento e atualiza o saldo do produto.
 *
 * Aceita um client de transação para o checkout poder gravar pedido + baixa +
 * movimento tudo junto: se o pedido falhar, o estoque não mexe.
 */
export async function registrarMovimento(
  movimento: MovimentoEntrada,
  tx: Tx = prisma
) {
  const produto = await tx.produto.findUnique({
    where: { id: movimento.produtoId },
    select: { id: true, nome: true, estoque: true },
  });

  if (!produto) {
    throw new ErroEstoque(`Produto ${movimento.produtoId} não existe`, "PRODUTO");
  }

  const saldoDepois = validarMovimento(movimento, produto.estoque);

  const criado = await tx.estoqueMovimento.create({
    data: {
      produtoId: movimento.produtoId,
      tipo: movimento.tipo,
      quantidade: movimento.tipo === "ajuste" ? movimento.quantidade : movimento.quantidade,
      saldoDepois,
      motivo: movimento.motivo.trim(),
      origem: movimento.origem,
      pedidoId: movimento.pedidoId ?? null,
      usuarioId: movimento.usuarioId ?? null,
    },
  });

  await tx.produto.update({
    where: { id: movimento.produtoId },
    data: { estoque: saldoDepois },
  });

  return criado;
}

/**
 * Porta usada pelo checkout: baixa o estoque de cada item do pedido e grava o
 * movimento com o número do pedido, para poder estornar depois (#121).
 */
export async function baixarEstoqueDoPedido(
  tx: Tx,
  pedidoId: string,
  itens: { produtoId: number; quantidade: number; nome: string }[]
) {
  for (const item of itens) {
    await registrarMovimento(
      {
        produtoId: item.produtoId,
        tipo: "saida",
        quantidade: item.quantidade,
        motivo: `Venda — pedido ${pedidoId.slice(-6).toUpperCase()}`,
        origem: "pedido",
        pedidoId,
      },
      tx
    );
  }
}

/**
 * Devolve ao estoque tudo que o pedido baixou (#121).
 *
 * Chamado no cancelamento. O controle de "já devolvi" fica em
 * `pedidos.estoque_devolvido` — contar movimento não serve, porque pedido
 * cancelado e reaberto tem os dois tipos no histórico.
 */
export async function estornarEstoqueDoPedido(
  tx: Tx,
  pedidoId: string,
  itens: { produtoId: number; quantidade: number; nome: string }[]
) {
  const curto = pedidoId.slice(-6).toUpperCase();

  for (const item of itens) {
    if (!item.produtoId) continue;
    await registrarMovimento(
      {
        produtoId: item.produtoId,
        tipo: "estorno",
        quantidade: item.quantidade,
        motivo: `Cancelamento — pedido ${curto}`,
        origem: "estorno",
        pedidoId,
      },
      tx
    );
  }
}

/**
 * Reabre pedido cancelado: baixa o estoque outra vez. Se não houver saldo
 * (vendeu depois do cancelamento), a transação falha com a mensagem de saldo —
 * melhor recusar do que ficar com saldo negativo.
 */
export async function retomarEstoqueDoPedido(
  tx: Tx,
  pedidoId: string,
  itens: { produtoId: number; quantidade: number; nome: string }[]
) {
  const curto = pedidoId.slice(-6).toUpperCase();

  for (const item of itens) {
    if (!item.produtoId) continue;
    await registrarMovimento(
      {
        produtoId: item.produtoId,
        tipo: "saida",
        quantidade: item.quantidade,
        motivo: `Reativação — pedido ${curto}`,
        origem: "pedido",
        pedidoId,
      },
      tx
    );
  }
}

/** Saldo de todas as peças (para a tela de estoque). */
export async function listarSaldos() {
  return prisma.produto.findMany({
    select: { id: true, sku: true, nome: true, estoque: true, ativo: true },
    orderBy: { nome: "asc" },
  });
}

/** Movimentos recentes, com o nome do produto. */
export async function listarMovimentos(limite = 100) {
  return prisma.estoqueMovimento.findMany({
    orderBy: { criadoEm: "desc" },
    take: limite,
    include: {
      produto: { select: { id: true, nome: true, sku: true } },
    },
  });
}

/** Saldo de um produto, conferido contra a soma dos movimentos. */
export async function conferirSaldo(produtoId: number) {
  const [produto, soma] = await Promise.all([
    prisma.produto.findUnique({ where: { id: produtoId }, select: { estoque: true } }),
    prisma.estoqueMovimento.aggregate({
      where: { produtoId },
      _sum: { quantidade: true },
    }),
  ]);

  // ajuste pode ser negativo; a soma dos deltas depende do tipo, então o
  // conforto aqui é comparar com o último saldo registrado
  const ultimo = await prisma.estoqueMovimento.findFirst({
    where: { produtoId },
    orderBy: { criadoEm: "desc" },
    select: { saldoDepois: true },
  });

  return {
    saldoProduto: produto?.estoque ?? null,
    ultimoSaldoRegistrado: ultimo?.saldoDepois ?? null,
    somaBruta: soma._sum.quantidade ?? 0,
  };
}
