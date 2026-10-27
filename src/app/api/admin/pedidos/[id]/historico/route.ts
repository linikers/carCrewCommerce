import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { historicoDoPedido } from "@/modules/pedidos/dados/pedidos";

/**
 * Histórico de status do pedido (6.6 / #123).
 *
 * Lê a tabela `auditoria`, que já registra quem alterou o quê. Antes o painel
 * só mostrava o status atual: não dava para saber quem mudou, quando, nem de
 * qual status para qual — e numa loja com mais de um operador isso vira
 * discussão sem prova.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  try {
    return NextResponse.json(await historicoDoPedido(id));
  } catch (error) {
    console.error("[pedidos/historico] falha:", error);
    return NextResponse.json({ error: "Não foi possível carregar o histórico" }, { status: 500 });
  }
}
