import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { auditar } from "@/lib/auditoria";
import prisma from "@/lib/prisma";
import { accessTokenValido, buscarPedidos, credencialML, type PedidoML } from "@/modules/marketplace/dados/mercado-livre";
import { criarVendaManual } from "@/modules/pedidos/dados/pedidos";
import { recalcularVenda } from "@/lib/custos-venda";
import { impostoDe } from "@/modules/pedidos/dominio/resultado";

/**
 * Importa pedidos do Mercado Livre como vendas.
 *
 * Cada pedido vira uma venda com a comissão **real** (`sale_fee`) e o frete do
 * vendedor quando o ML informa — no Full esse valor não vem por pedido e fica
 * para o rateio da fatura (Custos e mídia).
 *
 * Idempotente por `(canal, canal_pedido_id)`: reimportar não duplica.
 * NÃO baixa estoque do site (sincronização é outra fase, #85).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ canal: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("marketplace");
  if (bloqueio) return bloqueio;

  const { canal } = await params;
  if (canal !== "mercado_livre") {
    return NextResponse.json({ error: "Importação disponível só para Mercado Livre por enquanto" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dias = Math.min(Math.max(Number(body.dias) || 7, 1), 60);
    const ate = new Date();
    const de = new Date(ate.getTime() - dias * 24 * 60 * 60 * 1000);

    const { token, cred } = await accessTokenValido();
    const sellerId = cred.userId ?? (await credencialML())?.userId;
    if (!sellerId) {
      return NextResponse.json(
        { error: "User ID do vendedor não cadastrado — conecte o Mercado Livre de novo" },
        { status: 400 }
      );
    }

    const impostoPercent = await prisma.configuracao
      .findUnique({ where: { chave: "economia" } })
      .then((r) => Number((r?.valor as { impostoPercent?: number } | null)?.impostoPercent ?? 0))
      .catch(() => 0);

    let offset = 0;
    let importados = 0;
    let duplicados = 0;
    let ignorados = 0;
    let total = 0;
    const erros: string[] = [];

    // 50 por página é o limite do ML; 10 páginas por chamada evita estourar o
    // tempo da função. O resto entra na próxima execução.
    for (let pagina = 0; pagina < 10; pagina++) {
      const { total: t, resultados } = await buscarPedidos({ accessToken: token, sellerId, de, ate, offset, limite: 50 });
      total = t;
      if (resultados.length === 0) break;

      for (const pedido of resultados) {
        if (pedido.status === "cancelled") {
          ignorados += 1;
          continue;
        }

        const itens = (pedido.order_items ?? []).map((i) => ({
          sku: i.item?.seller_sku ?? null,
          nome: i.item?.title ?? null,
          quantidade: i.quantity ?? 1,
          preco: i.unit_price ?? 0,
          custoUnitario: null as number | null,
        }));
        if (itens.length === 0) {
          ignorados += 1;
          continue;
        }

        const comissao = (pedido.order_items ?? []).reduce((s, i) => s + (i.sale_fee ?? 0), 0);
        const freteVendedor = pedido.shipping?.base_cost ?? pedido.shipping?.cost ?? 0;

        try {
          const venda = await criarVendaManual({
            canal: "mercado_livre",
            vendaEm: pedido.date_closed ? new Date(pedido.date_closed) : new Date(),
            canalPedidoId: String(pedido.id),
            itens: itens.map((i) => ({
              sku: i.sku,
              quantidade: i.quantidade,
              preco: i.preco,
              custoUnitario: i.custoUnitario,
            })),
            freteVendedor,
            comissao,
            impostoPercent,
            custosOrigem: "importado",
          });

          await recalcularVenda(venda.id, {
            comissao,
            freteVendedor,
            impostoPercent,
            imposto: impostoDe(venda.total, impostoPercent),
            custosOrigem: "importado",
          });
          importados += 1;
        } catch (e) {
          const mensagem = e instanceof Error ? e.message : "erro";
          if (mensagem.includes("Unique") || mensagem.includes("já importado")) duplicados += 1;
          else erros.push(`pedido ${pedido.id}: ${mensagem.slice(0, 80)}`);
        }
      }

      offset += resultados.length;
      if (offset >= total) break;
    }

    await auditar({
      entidade: "configuracao",
      entidadeId: "ml-importacao",
      acao: "criar",
      antes: null,
      depois: { dias, total, importados, duplicados, ignorados, erros: erros.slice(0, 5) },
    });

    return NextResponse.json({
      ok: true,
      total,
      importados,
      duplicados,
      ignorados,
      erros,
      mensagem:
        `Mercado Livre: ${importados} venda(s) importada(s)` +
        (duplicados ? ` · ${duplicados} já existiam` : "") +
        (ignorados ? ` · ${ignorados} ignorada(s) (cancelada/sem item)` : "") +
        (total > offset ? ` · faltam ${total - offset} para a próxima importação` : ""),
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha na importação";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }
}
