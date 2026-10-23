import { requireAdmin } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Clientes = quem já comprou.
 *
 * 6.10: existia o item "Clientes" no menu, desabilitado com "Em breve", e
 * nenhuma tela. A operação não conseguia ver quem compra, quanto já gastou
 * nem quando foi a última compra.
 *
 * Agrega por `userId` em JS porque o volume desta loja é pequeno (centenas de
 * pedidos) e não vale uma view materializada.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        userId: true,
        total: true,
        status: true,
        createdAt: true,
        id: true,
        clienteNome: true,
        clienteTelefone: true,
        clienteEmail: true,
        clienteDocumento: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const mapa = new Map<
      string,
      {
        id: string;
        nome: string;
        email: string | null;
        telefone: string | null;
        pedidos: number;
        total: number;
        ultimoPedido: string;
      }
    >();

    for (const p of pedidos) {
      // Pedido de visitante não tem userId: agrupa pelo e-mail (ou nome) para
      // o cliente aparecer na lista do mesmo jeito.
      const chave = p.userId ?? `visitante:${(p.clienteEmail || p.clienteNome || p.id).toLowerCase()}`;
      const atual = mapa.get(chave);
      const nome = p.clienteNome || p.user?.name || p.user?.email || "Cliente sem nome";

      if (!atual) {
        mapa.set(chave, {
          id: chave,
          nome,
          email: p.user?.email ?? null,
          telefone: p.clienteTelefone ?? null,
          pedidos: 1,
          total: p.status === "cancelado" ? 0 : p.total,
          ultimoPedido: p.createdAt.toISOString(),
        });
        continue;
      }

      atual.pedidos += 1;
      if (p.status !== "cancelado") atual.total += p.total;
      if (!atual.telefone && p.clienteTelefone) atual.telefone = p.clienteTelefone;
      // pedidos vêm em ordem desc, então o primeiro já é o mais recente
    }

    const clientes = [...mapa.values()].sort((a, b) => b.total - a.total);

    return NextResponse.json({
      clientes,
      resumo: {
        total: clientes.length,
        receita: clientes.reduce((s, c) => s + c.total, 0),
        recorrentes: clientes.filter((c) => c.pedidos > 1).length,
      },
    });
  } catch (error) {
    console.error("[admin/clientes] falha ao listar:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os clientes. Tente de novo." },
      { status: 503 }
    );
  }
}
