import { NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import type { ItemFrete } from "@/modules/frete/dominio/cotacao";
import { cotarFrete } from "@/modules/frete/dados/servico";

/**
 * Casca fina: valida o corpo e chama o domínio do módulo de frete.
 * Regra de negócio mora em `src/modules/frete/dominio/cotacao.ts`.
 */
export async function POST(request: Request) {
  const bloqueio = await exigirModulo("frete");
  if (bloqueio) return bloqueio;

  try {
    const body = (await request.json()) as { cepDestino?: string; itens?: ItemFrete[] };
    const itens = Array.isArray(body.itens) ? body.itens : [];

    if (!body.cepDestino) {
      return NextResponse.json({ erro: "Informe o CEP" }, { status: 400 });
    }
    if (itens.length === 0) {
      return NextResponse.json({ erro: "Sem itens para cotar" }, { status: 400 });
    }

    const valorDeclarado = Number((body as { valorDeclarado?: number }).valorDeclarado) || 0;
    const cotacao = await cotarFrete(body.cepDestino, itens, valorDeclarado);
    if (!cotacao) {
      return NextResponse.json({ erro: "CEP inválido" }, { status: 400 });
    }

    return NextResponse.json(cotacao);
  } catch (error) {
    console.error("[frete] falha na cotação:", error);
    return NextResponse.json({ erro: "Erro ao calcular frete" }, { status: 500 });
  }
}
