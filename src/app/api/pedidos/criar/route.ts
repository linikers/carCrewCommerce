import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { items, form, paymentMethod, total, freight } = await req.json();

    if (!items?.length || !paymentMethod) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // 1. Validar estoque de cada item
    for (const item of items) {
      const produto = await prisma.produto.findUnique({
        where: { id: item.produto.id },
      });
      if (!produto || !produto.ativo) {
        return NextResponse.json(
          { error: `Produto "${item.produto.nome}" não está mais disponível` },
          { status: 400 }
        );
      }
      if (produto.estoque < item.quantidade) {
        return NextResponse.json(
          { error: `Estoque insuficiente para "${produto.nome}" (disponível: ${produto.estoque})` },
          { status: 400 }
        );
      }
    }

    // 2. Criar pedido
    const pedido = await prisma.pedido.create({
      data: {
        userId: "guest",
        items: items.map((i: any) => ({
          produtoId: i.produto.id,
          nome: i.produto.nome,
          preco: i.produto.preco,
          quantidade: i.quantidade,
        })),
        total: total + (freight || 0),
        status: paymentMethod === "pix" ? "aguardando_pagamento" : "confirmado",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 3. Baixar estoque
    for (const item of items) {
      await prisma.produto.update({
        where: { id: item.produto.id },
        data: { estoque: { decrement: item.quantidade } },
      });
    }

    return NextResponse.json({
      success: true,
      pedidoId: pedido.id,
      status: pedido.status,
      message:
        paymentMethod === "pix"
          ? "Pedido criado! Pague o PIX para confirmar."
          : "Pedido confirmado!",
    });
  } catch (error: any) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json({ error: "Erro ao processar pedido" }, { status: 500 });
  }
}
