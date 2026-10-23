import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    // 5.5: se o cliente está logado, o pedido fica ligado à conta dele.
    // Visitante entra como pedido sem usuário (`userId: null`) — antes o
    // código gravava o literal "guest", que não existe em `users`, e a FK
    // derrubava 100% dos pedidos com P2003.
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

    // 2. Criar pedido
    // 6.1: o formulário do checkout já vem com endereço e telefone; antes tudo
    // isso era descartado e o pedido nascia sem destino de entrega.
    const pedido = await prisma.pedido.create({
      data: {
        userId,
        items: items.map((i: any) => ({
          produtoId: i.produto.id,
          nome: i.produto.nome,
          preco: i.produto.preco,
          quantidade: i.quantidade,
        })),
        total: total + (freight || 0),
        frete: freight || 0,
        status: paymentMethod === "pix" ? "aguardando_pagamento" : "pago",
        clienteNome: form?.nome || null,
        clienteTelefone: form?.telefone || null,
        // 5.5: e-mail e CPF/CNPJ são o mínimo para nota e contato.
        clienteEmail: form?.email || null,
        clienteDocumento: form?.documento ? String(form.documento).replace(/\D/g, "") : null,
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
