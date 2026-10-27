import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ErroPedido, normalizarItens } from "@/modules/pedidos/dominio/pedido";
import { criarPedido } from "@/modules/pedidos/dados/pedidos";
import { baixarEstoqueDoPedido } from "@/modules/estoque/dados/movimentos";
import { moduloAtivo } from "@/modules/config";

/**
 * Casca fina do checkout: lê o corpo, normaliza e chama o módulo de pedidos.
 * A regra (estoque, foto do produto, transação) vive em `src/modules/pedidos`.
 */
export async function POST(req: NextRequest) {
  let corpo: {
    items?: unknown;
    form?: Record<string, unknown> | null;
    paymentMethod?: string;
    freight?: number;
  };

  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { items, form, paymentMethod, freight } = corpo;

  if (!paymentMethod) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  try {
    const itens = normalizarItens(items);

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

    // Composition root: a rota é o único lugar que conhece os dois módulos.
    const estoqueLigado = await moduloAtivo("estoque");

    const pedido = await criarPedido({
      itens,
      userId,
      frete: Number(freight) || 0,
      paymentMethod,
      form: form ?? null,
      baixarEstoque: estoqueLigado ? baixarEstoqueDoPedido : undefined,
    });

    return NextResponse.json({
      success: true,
      pedidoId: pedido.id,
      status: pedido.status,
      total: pedido.total,
      message:
        paymentMethod === "pix"
          ? "Pedido criado! Pague o PIX para confirmar."
          : "Pedido confirmado!",
    });
  } catch (error) {
    if (error instanceof ErroPedido) {
      // estoque/produto: 409 diz "seu carrinho mudou", não "seu pedido é inválido"
      const status = error.codigo === "ESTOQUE" || error.codigo === "PRODUTO" ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[pedidos/criar] falha:", error);
    return NextResponse.json({ error: "Erro ao processar pedido" }, { status: 500 });
  }
}
