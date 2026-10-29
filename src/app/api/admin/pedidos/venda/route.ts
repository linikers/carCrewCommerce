import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { auditar } from "@/lib/auditoria";
import { ErroPedido } from "@/modules/pedidos/dominio/pedido";
import { criarVendaManual } from "@/modules/pedidos/dados/pedidos";
import { normalizarCanal, numero, data as parseData } from "@/lib/venda-import";
import { recalcularVenda } from "@/lib/custos-venda";
import { impostoDe } from "@/modules/pedidos/dominio/resultado";

/**
 * Venda lançada no painel (#191): balcão, marketplace fora do site, ou venda
 * que veio por fora.
 *
 * Não mexe em estoque — venda de marketplace já saiu do estoque físico. O que
 * esta rota faz é gravar receita e custos para o resultado existir.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();

    const canal = normalizarCanal(String(body.canal ?? ""));
    if (!canal) {
      return NextResponse.json(
        { error: "Canal inválido. Use mercado_livre, shopee, site ou manual." },
        { status: 400 }
      );
    }

    const itens = Array.isArray(body.itens) ? body.itens : [];
    if (itens.length === 0) {
      return NextResponse.json({ error: "Venda sem itens" }, { status: 400 });
    }

    const venda = await criarVendaManual({
      canal,
      vendaEm: parseData(String(body.data ?? "")) ?? new Date(),
      canalPedidoId: body.id ? String(body.id) : null,
      clienteNome: body.cliente ? String(body.cliente) : null,
      itens: itens.map((i: Record<string, unknown>) => ({
        sku: i.sku ? String(i.sku) : null,
        produtoId: typeof i.produtoId === "number" ? i.produtoId : null,
        quantidade: Number(i.quantidade ?? 1),
        preco: numero(String(i.valor ?? i.preco ?? "")) ?? 0,
        custoUnitario: i.custo === undefined || i.custo === null || i.custo === "" ? null : numero(String(i.custo)),
      })),
      freteVendedor: numero(String(body.frete ?? "")) ?? 0,
      comissao: body.comissao !== undefined && body.comissao !== "" ? numero(String(body.comissao)) : null,
      impostoPercent: body.impostoPercent !== undefined ? numero(String(body.impostoPercent)) : null,
      embalagem: body.embalagem !== undefined && body.embalagem !== "" ? numero(String(body.embalagem)) : null,
      ads: numero(String(body.ads ?? "")) ?? 0,
      custosOrigem: "manual",
    });

    // comissão informada ou calculada pelo % do canal; imposto pelo % da venda
    const impostoPercent = numero(String(body.impostoPercent ?? ""));
    const imposto =
      numero(String(body.imposto ?? "")) ??
      (impostoPercent !== null ? impostoDe(venda.total, impostoPercent) : null);

    const recalculo = await recalcularVenda(venda.id, {
      ...(impostoPercent !== null ? { impostoPercent } : {}),
      ...(imposto !== null ? { imposto } : {}),
      custosOrigem: "manual",
    });

    await auditar({
      entidade: "pedido",
      entidadeId: venda.id,
      acao: "criar",
      antes: null,
      depois: {
        canal,
        total: venda.total,
        origem: "venda manual (#191)",
        resultado: recalculo.resultado?.resultado ?? null,
        itensSemCusto: recalculo.itensSemCusto,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        pedidoId: venda.id,
        total: venda.total,
        resultado: recalculo.resultado?.resultado ?? null,
        margemPercent: recalculo.resultado?.margemPercent ?? null,
        itensSemCusto: recalculo.itensSemCusto,
        mensagem:
          recalculo.itensSemCusto > 0
            ? `Venda gravada. ${recalculo.itensSemCusto} item(ns) sem custo — resultado fica pendente até informar o custo.`
            : "Venda gravada com resultado calculado.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ErroPedido) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[admin/pedidos/venda] falha:", error);
    return NextResponse.json({ error: "Não foi possível gravar a venda" }, { status: 500 });
  }
}
