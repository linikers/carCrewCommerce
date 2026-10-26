import { requireAdmin } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Busca global do painel (6.7 do admin).
 *
 * Antes: para achar uma peça era preciso saber em qual tela ela mora, e o
 * pedido só era encontrável pelo número. Agora um campo responde três coisas
 * de uma vez — produto (nome ou SKU), pedido (número ou nome do cliente) e
 * cliente (nome, e-mail ou telefone).
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ produtos: [], pedidos: [], clientes: [] });
  }

  const like = { contains: q, mode: "insensitive" as const };
  // Pedido tem id cuid (string); o cliente digita o número curto que aparece
  // na tela, então a busca também tenta o final do id.
  const curto = q.replace(/^#/, "").trim();

  try {
    const [produtos, pedidos, clientes] = await Promise.all([
      prisma.produto.findMany({
        where: { OR: [{ nome: like }, { sku: like }] },
        select: { id: true, nome: true, sku: true, preco: true, estoque: true },
        take: 5,
        orderBy: { id: "asc" },
      }),

      prisma.pedido.findMany({
        where: {
          OR: [
            { clienteNome: like },
            { clienteEmail: like },
            { clienteTelefone: like },
            { id: like },
          ],
        },
        select: { id: true, clienteNome: true, total: true, status: true },
        take: 5,
        orderBy: { id: "desc" },
      }),

      prisma.user.findMany({
        where: { OR: [{ name: like }, { email: like }] },
        select: { id: true, name: true, email: true },
        take: 5,
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ produtos, pedidos, clientes });
  } catch (error) {
    console.error("[admin/busca] falha:", error);
    return NextResponse.json({ error: "Falha na busca" }, { status: 500 });
  }
}
