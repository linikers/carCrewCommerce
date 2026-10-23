import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

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
  } catch (error) {
    console.error("[admin/pedidos/id] falha ao buscar:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o pedido." },
      { status: 503 }
    );
  }
}
