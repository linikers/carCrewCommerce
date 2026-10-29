import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auditar } from "@/lib/auditoria";
import { lerLinhasDeVenda } from "@/lib/venda-import";
import { criarVendaManual } from "@/modules/pedidos/dados/pedidos";
import { recalcularVenda, custosPadraoDoCanal } from "@/lib/custos-venda";
import { impostoDe } from "@/modules/pedidos/dominio/resultado";

/**
 * Importação de vendas por planilha (#191) — histórico do sistema atual.
 *
 * Deduplica por `(canal, id do pedido)` quando a planilha traz o id; sem id, a
 * venda entra como nova e a resposta avisa quantas ficaram sem chave.
 *
 * Não baixa estoque: é passado, não venda acontecendo agora.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    if (typeof body.texto !== "string" || body.texto.trim() === "") {
      return NextResponse.json({ error: "Cole a planilha (CSV com cabeçalho)." }, { status: 400 });
    }

    const { linhas, erros } = lerLinhasDeVenda(body.texto);
    if (linhas.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma linha válida encontrada.", erros },
        { status: 400 }
      );
    }
    if (linhas.length > 1000) {
      return NextResponse.json(
        { error: "Máximo de 1000 linhas por vez — divida a planilha." },
        { status: 400 }
      );
    }

    // id do marketplace já importado não entra de novo
    const comId = linhas.filter((l) => l.canalPedidoId);
    const jaExistem = comId.length
      ? await prisma.pedido.findMany({
          where: {
            OR: comId.map((l) => ({ canal: l.canal, canalPedidoId: l.canalPedidoId as string })),
          },
          select: { canal: true, canalPedidoId: true },
        })
      : [];
    const existentes = new Set(jaExistem.map((p) => `${p.canal}:${p.canalPedidoId}`));

    const criadas: string[] = [];
    // id repetido DENTRO da própria planilha também é duplicata — antes caía no
    // erro cru do Prisma e a resposta vazava stack no lugar do motivo
    const noLote = new Set<string>();
    const recusadas: { linha: number; motivo: string }[] = [];
    let semId = 0;

    for (const linha of linhas) {
      const chave = linha.canalPedidoId ? `${linha.canal}:${linha.canalPedidoId}` : null;
      if (chave && (existentes.has(chave) || noLote.has(chave))) {
        recusadas.push({ linha: linha.linha, motivo: "pedido já importado (id repetido)" });
        continue;
      }
      if (chave) noLote.add(chave);
      if (!linha.canalPedidoId) semId += 1;

      try {
        const padrao = await custosPadraoDoCanal(linha.canal, linha.valor * linha.quantidade);
        const comissao = linha.comissao ?? padrao.comissao;
        const impostoPercent = padrao.impostoPercent;
        const imposto = linha.imposto ?? impostoDe(linha.valor * linha.quantidade, impostoPercent);

        const venda = await criarVendaManual({
          canal: linha.canal,
          vendaEm: linha.data ?? new Date(),
          canalPedidoId: linha.canalPedidoId,
          clienteNome: linha.cliente,
          itens: [
            {
              sku: linha.sku,
              quantidade: linha.quantidade,
              preco: linha.valor,
              custoUnitario: linha.custo,
            },
          ],
          freteVendedor: linha.frete,
          comissao,
          embalagem: linha.embalagem ?? padrao.embalagem,
          ads: linha.ads,
          custosOrigem: "importado",
        });

        await recalcularVenda(venda.id, {
          comissao,
          comissaoPercent: padrao.comissaoPercent,
          imposto,
          impostoPercent,
          embalagem: linha.embalagem ?? padrao.embalagem,
          ads: linha.ads,
          freteVendedor: linha.frete,
          custosOrigem: "importado",
        });

        criadas.push(venda.id);
      } catch (e) {
        const codigo = (e as { code?: string })?.code;
        recusadas.push({
          linha: linha.linha,
          motivo:
            codigo === "P2002"
              ? "pedido já importado (id repetido)"
              : e instanceof Error
                ? e.message
                : "erro ao gravar",
        });
      }
    }

    await auditar({
      entidade: "pedido",
      entidadeId: "importacao-planilha",
      acao: "criar",
      antes: { linhas: linhas.length },
      depois: { criadas: criadas.length, recusadas: recusadas.length, semId },
    });

    return NextResponse.json({
      ok: true,
      criadas: criadas.length,
      recusadas,
      erros,
      semId,
      mensagem:
        `Importadas ${criadas.length} venda(s).` +
        (recusadas.length ? ` ${recusadas.length} recusada(s).` : "") +
        (semId ? ` ${semId} sem id do marketplace (podem duplicar se importar de novo).` : ""),
    });
  } catch (error) {
    console.error("[admin/pedidos/importar] falha:", error);
    return NextResponse.json({ error: "Não foi possível importar as vendas" }, { status: 500 });
  }
}
