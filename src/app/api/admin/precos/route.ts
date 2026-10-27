import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { auditar } from "@/lib/auditoria";
import { lerPoliticaPreco, salvarPoliticaPreco, type PoliticaPreco } from "@/lib/politica-preco";
import { produtosParaExemplo } from "@/lib/produtos-admin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const politica = await lerPoliticaPreco();
  let exemplo: { nome: string; base: number; site: number }[] = [];

  try {
    const produtos = await produtosParaExemplo(3);
    exemplo = produtos.map((p) => {
      const base = p.precoBase && p.precoBase > 0 ? p.precoBase : p.preco;
      return {
        nome: p.nome,
        base,
        site: Number((base * (1 - politica.sitePercent / 100)).toFixed(2)),
      };
    });
  } catch {
    exemplo = [];
  }

  return NextResponse.json({ politica, exemplo });
}

function numero(valor: unknown): number {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(90, Math.round(n * 2) / 2);
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const antes = await lerPoliticaPreco();

    const politica: PoliticaPreco = {
      sitePercent: numero(body.sitePercent),
      canais: {
        mercado_livre: numero(body.canais?.mercado_livre),
        shopee: numero(body.canais?.shopee),
      },
      // comparativo só entra quando existir venda no site (issue #153)
      exibicao: "seco",
    };

    const antesSalvo = await salvarPoliticaPreco(politica);

    await auditar({
      entidade: "configuracao",
      entidadeId: "preco",
      acao: "alterar",
      antes: antesSalvo as unknown as object,
      depois: politica as unknown as object,
    });

    return NextResponse.json({ ok: true, politica });
  } catch (erro) {
    console.error("[admin/precos] falha ao salvar:", erro);
    return NextResponse.json({ error: "Não foi possível salvar a política" }, { status: 500 });
  }
}
