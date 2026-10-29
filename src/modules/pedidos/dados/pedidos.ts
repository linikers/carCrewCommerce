import prisma from "@/lib/prisma";
import { calcularPreco } from "@/lib/preco";
import { custosPadraoDoCanal, recalcularVenda } from "@/lib/custos-venda";
import { lerPoliticaPreco, precoSiteDe } from "@/lib/politica-preco";
import type { JsonArray, TransactionClient } from "@/generated/prisma/internal/prismaNamespace";
import {
  ErroPedido,
  normalizarDocumento,
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

/**
 * Porta de baixa de estoque.
 *
 * O módulo de pedidos não importa o de estoque (regra de fronteira). Quem
 * liga os dois é a rota — o único lugar que pode conhecer ambos.
 */
export type BaixaEstoque = (
  tx: TransactionClient,
  pedidoId: string,
  itens: { produtoId: number; quantidade: number; nome: string }[]
) => Promise<void>;

interface CriarPedidoArgs {
  itens: ItemEntrada[];
  userId: string | null;
  frete: number;
  paymentMethod: string;
  form: Record<string, unknown> | null;
  baixarEstoque?: BaixaEstoque;
}

export async function criarPedido({
  itens,
  userId,
  frete,
  paymentMethod,
  form,
  baixarEstoque,
}: CriarPedidoArgs): Promise<{ id: string; status: string; total: number }> {
  if (itens.length === 0) {
    throw new ErroPedido("Pedido sem itens", "SEM_ITENS");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Lê os produtos e trava a decisão de estoque dentro da transação
    const [produtos, politicaPreco] = await Promise.all([
      tx.produto.findMany({
        where: { id: { in: itens.map((i) => i.produtoId) } },
        include: { precosCanal: true },
      }),
      lerPoliticaPreco(),
    ]);
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
      // reescreve o que o cliente pagou. O desconto entra aqui — o preço que o
      // cliente viu na vitrine é o que o servidor cobra.
      // preço do site (política do canal) + promoção do item
      const precoSite = precoSiteDe(produto, politicaPreco);
      const precoFinal = calcularPreco(precoSite, produto.descontoPercent).por;

      itensPedido.push({
        produtoId: produto.id,
        nome: produto.nome,
        sku: produto.sku,
        preco: precoFinal,
        quantidade: item.quantidade,
        total: Number((precoFinal * item.quantidade).toFixed(2)),
        // custo no momento da venda (#191): mudar o custo do catálogo depois
        // não reescreve o resultado de uma venda antiga
        custoUnitario: produto.custo ?? null,
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
        // origem da venda: sem isso não existe margem por canal (#preco)
        canal: "site",
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
      select: { id: true, status: true, total: true, canal: true },
    });

    // 2. Baixa de estoque na mesma transação do pedido.
    // Com o módulo de estoque ligado, a baixa vira movimento com histórico
    // (e o estorno do cancelamento fica possível). Sem ele, decremento puro.
    if (baixarEstoque) {
      await baixarEstoque(tx, pedido.id, itensPedido);
    } else {
      for (const item of itensPedido) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { decrement: item.quantidade } },
        });
      }
    }

    return pedido;
  }).then(async (pedido) => {
    // custo da venda (#191): comissão do canal, imposto e embalagem saem da
    // configuração; o resultado só é gravado quando todo item tem custo.
    const custos = await custosPadraoDoCanal("site", pedido.total);
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        comissao: custos.comissao,
        comissaoPercent: custos.comissaoPercent,
        imposto: custos.imposto,
        impostoPercent: custos.impostoPercent,
        embalagem: custos.embalagem,
        freteVendedor: 0,
        custosOrigem: "calculado",
        vendaEm: new Date(),
      },
    });
    await recalcularVenda(pedido.id);
    return pedido;
  });
}

export interface ItemVendaManual {
  produtoId?: number | null;
  sku?: string | null;
  nome?: string | null;
  quantidade: number;
  preco: number;
  /** custo da peça nesta venda; ausente = usa o custo do cadastro */
  custoUnitario?: number | null;
}

export interface VendaManualArgs {
  canal: string;
  vendaEm?: Date | null;
  itens: ItemVendaManual[];
  freteVendedor?: number;
  comissao?: number | null;
  impostoPercent?: number | null;
  embalagem?: number | null;
  ads?: number | null;
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  clienteEmail?: string | null;
  canalPedidoId?: string | null;
  status?: string;
  /** de onde vieram os custos: manual | importado */
  custosOrigem?: string;
}

/**
 * Venda lançada no painel (balcão, marketplace, histórico em planilha).
 *
 * Não baixa estoque: venda de marketplace já saiu do estoque físico e o
 * histórico importado é passado — mexer no saldo aqui inventaria movimento.
 */
export async function criarVendaManual(args: VendaManualArgs): Promise<{ id: string; total: number }> {
  if (!args.itens || args.itens.length === 0) {
    throw new ErroPedido("Venda sem itens", "SEM_ITENS");
  }

  const produtos = await prisma.produto.findMany({
    where: {
      OR: [
        { id: { in: args.itens.map((i) => i.produtoId).filter((n): n is number => typeof n === "number") } },
        { sku: { in: args.itens.map((i) => String(i.sku ?? "").trim().toUpperCase()).filter(Boolean) } },
      ],
    },
    select: { id: true, nome: true, sku: true, custo: true },
  });
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const porSku = new Map(produtos.map((p) => [String(p.sku ?? "").toUpperCase(), p]));

  const itens = args.itens.map((item) => {
    const produto =
      (typeof item.produtoId === "number" ? porId.get(item.produtoId) : undefined) ??
      porSku.get(String(item.sku ?? "").trim().toUpperCase());

    const quantidade = Math.max(1, Math.trunc(Number(item.quantidade) || 1));
    const preco = Number(item.preco);
    if (!Number.isFinite(preco) || preco < 0) {
      throw new ErroPedido("Preço inválido em item da venda");
    }

    return {
      produtoId: produto?.id ?? null,
      nome: item.nome || produto?.nome || item.sku || "Item",
      sku: produto?.sku ?? (item.sku ? String(item.sku).trim().toUpperCase() : null),
      preco,
      quantidade,
      total: Number((preco * quantidade).toFixed(2)),
      // custo informado na planilha manda; senão usa o do cadastro
      custoUnitario:
        item.custoUnitario !== undefined && item.custoUnitario !== null
          ? Number(item.custoUnitario)
          : produto?.custo ?? null,
    };
  });

  const total = Number(itens.reduce((soma, i) => soma + i.total, 0).toFixed(2));

  const pedido = await prisma.pedido.create({
    data: {
      total,
      status: args.status || "pago",
      canal: args.canal,
      canalPedidoId: args.canalPedidoId ?? null,
      vendaEm: args.vendaEm ?? new Date(),
      freteVendedor: Number(args.freteVendedor ?? 0),
      comissao: args.comissao ?? null,
      imposto: null,
      impostoPercent: args.impostoPercent ?? null,
      embalagem: args.embalagem ?? null,
      ads: Number(args.ads ?? 0),
      adsOrigem: args.ads ? "manual" : "manual",
      custosOrigem: args.custosOrigem || "manual",
      clienteNome: args.clienteNome ?? null,
      clienteTelefone: args.clienteTelefone ?? null,
      clienteEmail: args.clienteEmail ?? null,
      itens: { create: itens },
    },
    select: { id: true, total: true, canal: true },
  });

  await recalcularVenda(pedido.id);
  return { id: pedido.id, total: pedido.total };
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
