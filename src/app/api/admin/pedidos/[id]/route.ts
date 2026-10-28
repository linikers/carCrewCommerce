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
        itens: { orderBy: { criadoEm: "asc" } },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    // Linha do tempo (#123): quem mudou, quando e de quê para quê. Sai da
    // auditoria (#120) — tabela própria duplicaria o mesmo dado. Pedido antigo
    // pode ter só a criação, porque a auditoria de pedido é posterior.
    const registros = await prisma.auditoria.findMany({
      where: { entidade: "pedido", entidadeId: id },
      orderBy: { criadoEm: "asc" },
    });

    const idsUsuarios = [
      ...new Set(registros.map((r) => r.userId).filter((v): v is string => Boolean(v))),
    ];
    const usuarios = idsUsuarios.length
      ? await prisma.user.findMany({
          where: { id: { in: idsUsuarios } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const nomeDe = (userId: string | null) => {
      if (!userId) return "sistema";
      const u = usuarios.find((x) => x.id === userId);
      return u?.name || u?.email || "admin";
    };

    // `de` vem do registro anterior quando a auditoria não gravou o "antes"
    // (o PATCH antigo só salvava o status novo). Sem isso a linha do tempo
    // mostraria "Pedido atualizado" em vez de "pendente → pago".
    let ultimoStatus: string | null = null;
    const historico = registros.map((r) => {
      const antes = (r.antes ?? {}) as { status?: string };
      const depois = (r.depois ?? {}) as { status?: string };
      const de = antes.status ?? ultimoStatus;
      const para = depois.status ?? null;
      ultimoStatus = para ?? ultimoStatus;
      return {
        em: r.criadoEm,
        acao: r.acao,
        de,
        para,
        usuario: nomeDe(r.userId),
      };
    });

    return NextResponse.json({ ...pedido, historico });
  } catch (error) {
    console.error("[admin/pedidos/id] falha ao buscar:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o pedido." },
      { status: 503 }
    );
  }
}
