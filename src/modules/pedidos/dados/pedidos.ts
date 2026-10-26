import prisma from "@/lib/prisma";
import type { JsonArray } from "@/generated/prisma/internal/prismaNamespace";
import {
  ErroPedido,
  normalizarDocumento,
  type DadosPedido,
  type ItemEntrada,
  type ItemPedido,
} from "../dominio/pedido";

/**
 * Persistência do pedido (#72).
 *
 * Tudo numa transação só: validar estoque, criar pedido, gravar itens e baixar
 * estoque. Antes eram três operações soltas — se a segunda falhasse, o pedido
 * existia e o estoque não baixava (ou o contrário).
 */

interface CriarPedidoArgs {
  itens: ItemEntrada[];
  userId: string | null;
  frete: number;
  paymentMethod: string;
  form: Record<string, unknown> | null;
}

export async function criarPedido({
  itens,
  userId,
  frete,
  paymentMethod,
  form,
}: CriarPedidoArgs): Promise<{ id: string; status: string; total: number }> {
  if (itens.length === 0) {
    throw new ErroPedido("Pedido sem itens", "SEM_ITENS");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Lê os produtos e trava a decisão de estoque dentro da transação
    const produtos = await tx.produto.findMany({
      where: { id: { in: itens.map((i) => i.produtoId) } },
    });
    const porId = new Map(produtos.map((p) => [p.id, p]));

    const itensPedido: ItemPedido[] = [];

    for (const item of itens) {
      const produto = porId.get(item.produtoId);
      if (!produto || !produto.ativo) {
        throw new ErroPedido(
          `Produto "${produto?.nome ?? item.produtoId}" não está mais disponível`,
          "PRODUTO"
        );
      }
      if (produto.estoque < item.quantidade) {
        throw new ErroPedido(
          `Estoque insuficiente para "${produto.nome}" (disponível: ${produto.estoque})`,
          "ESTOQUE"
        );
      }

      // foto do produto no momento da compra: mudar o catálogo depois não
      // reescreve o que o cliente pagou
      itensPedido.push({
        produtoId: produto.id,
        nome: produto.nome,
        sku: produto.sku,
        preco: produto.preco,
        quantidade: item.quantidade,
        total: Number((produto.preco * item.quantidade).toFixed(2)),
      });
    }

    const subtotal = Number(
      itensPedido.reduce((soma, i) => soma + i.total, 0).toFixed(2)
    );
    const total = Number((subtotal + (frete || 0)).toFixed(2));

    const pedido = await tx.pedido.create({
      data: {
        userId,
        total,
        frete: frete || 0,
        status: paymentMethod === "pix" ? "aguardando_pagamento" : "pago",
        clienteNome: (form?.nome as string) || null,
        clienteTelefone: (form?.telefone as string) || null,
        clienteEmail: (form?.email as string) || null,
        clienteDocumento: normalizarDocumento(form?.documento),
        enderecoEntrega: form
          ? {
              cep: form.cep || null,
              logradouro: form.endereco || null,
              numero: form.numero || null,
              bairro: form.bairro || null,
              cidade: form.cidade || null,
              uf: form.uf || null,
            }
          : undefined,
        itens: { create: itensPedido },
      },
      select: { id: true, status: true, total: true },
    });

    // 2. Baixa de estoque na mesma transação do pedido
    for (const item of itensPedido) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { estoque: { decrement: item.quantidade } },
      });
    }

    return pedido;
  });
}

/** Itens de um pedido, com fallback para o JSON dos pedidos antigos. */
export async function itensDoPedido(pedidoId: string): Promise<ItemPedido[]> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      items: true,
      itens: { orderBy: { criadoEm: "asc" } },
    },
  });
  if (!pedido) return [];

  if (pedido.itens.length > 0) {
    return pedido.itens.map((i) => ({
      produtoId: i.produtoId ?? 0,
      nome: i.nome,
      sku: i.sku,
      preco: i.preco,
      quantidade: i.quantidade,
      total: i.total,
    }));
  }

  // pedido antigo: carrinho estava no JSON
  const legado = Array.isArray(pedido.items)
    ? (pedido.items as JsonArray)
    : [];
  return legado.map((bruto: unknown) => {
    const i = bruto as { produtoId?: number; nome?: string; preco?: number; quantidade?: number };
    const preco = Number(i.preco ?? 0);
    const quantidade = Number(i.quantidade ?? 1);
    return {
      produtoId: Number(i.produtoId ?? 0),
      nome: i.nome ?? "Item",
      sku: null,
      preco,
      quantidade,
      total: Number((preco * quantidade).toFixed(2)),
    };
  });
}
