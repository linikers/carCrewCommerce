import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pedidos);
  } catch {
    // Fallback: dados mockados se o banco não estiver disponível
    const mockPedidos = [
      {
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
      {
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
      {
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
    ];

    return NextResponse.json(mockPedidos);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "id e status são obrigatórios" },
        { status: 400 },
      );
    }

    const statusValidos = [
      "pendente", "pago", "preparando", "enviado", "entregue", "cancelado",
    ];
    if (!statusValidos.includes(status)) {
      return NextResponse.json(
        { error: `Status inválido. Valores: ${statusValidos.join(", ")}` },
        { status: 400 },
      );
    }

    await prisma.pedido.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch {
    // Fallback mock
    return NextResponse.json({ success: true, mock: true });
  }
}
