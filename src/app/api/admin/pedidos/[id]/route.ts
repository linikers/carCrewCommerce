import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(pedido);
  } catch {
    // Fallback mock
    const mockPedidos: Record<string, any> = {
      mock_1: {
        id: "mock_1",
        userId: "mock_user",
        total: 349.90,
        status: "pendente",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          { nome: "Amortecedor Dianteiro", preco: 189.90, quantidade: 1, imgUrl: null },
          { nome: "Kit Coxim", preco: 160.00, quantidade: 1, imgUrl: null },
        ],
        user: { id: "mock_user", name: "Cliente Exemplo", email: "cliente@teste.com" },
      },
      mock_2: {
        id: "mock_2",
        userId: "mock_user2",
        total: 89.90,
        status: "pago",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          { nome: "Calço Antirruído Universal", preco: 89.90, quantidade: 1, imgUrl: null },
        ],
        user: { id: "mock_user2", name: "Oficina do João", email: "joao@oficina.com" },
      },
      mock_3: {
        id: "mock_3",
        userId: "mock_user3",
        total: 1250.00,
        status: "enviado",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          { nome: "Bolsa de Ar", preco: 650.00, quantidade: 1, imgUrl: null },
          { nome: "Válvula Solenoide", preco: 350.00, quantidade: 1, imgUrl: null },
          { nome: "Mangueira 1/4", preco: 250.00, quantidade: 1, imgUrl: null },
        ],
        user: { id: "mock_user3", name: "Carros Rebaixados LTDA", email: "contato@rebaixados.com" },
      },
    };

    const pedido = mockPedidos[id];
    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(pedido);
  }
}
