import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { auditar } from "@/lib/auditoria";
import { aplicarCustosPorSku } from "@/lib/produtos-admin";
import { lerLinhasDeCusto, converterCusto, type LinhaCusto } from "@/lib/custo-import";

/**
 * Custo da peça em lote (#191).
 *
 * Aceita `{ texto: "SKU;custo\n..." }` (colado da planilha) ou
 * `{ linhas: [{ sku, custo }] }`. Casa por **SKU** — nome comercial varia entre
 * fornecedor e site, e casar por nome duplica produto.
 *
 * Devolve sempre o que foi atualizado, o que não casou e o que foi recusado:
 * importação de dinheiro não pode terminar com "ok" sem dizer o que ignorou.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();

    let linhas: LinhaCusto[] = [];
    let erros: { linha: number; texto: string; motivo: string }[] = [];
    let repetidos: string[] = [];

    if (typeof body.texto === "string") {
      const leitura = lerLinhasDeCusto(body.texto);
      linhas = leitura.linhas;
      erros = leitura.erros;
      repetidos = leitura.repetidos;
    } else if (Array.isArray(body.linhas)) {
      linhas = body.linhas
        .map((l: { sku?: unknown; custo?: unknown }) => {
          const custo = converterCusto(String(l?.custo ?? ""));
          return { sku: String(l?.sku ?? "").trim().toUpperCase(), custo };
        })
        .filter((l: { sku: string; custo: number | null | "invalido" }) => l.sku !== "" && l.custo !== "invalido") as LinhaCusto[];
    } else {
      return NextResponse.json(
        { error: "Envie `texto` (colado da planilha) ou `linhas`." },
        { status: 400 }
      );
    }

    if (linhas.length === 0) {
      return NextResponse.json(
        {
          error:
            erros.length > 0
              ? "Nenhuma linha válida. Confira o formato SKU;custo."
              : "Nenhuma linha encontrada.",
          erros,
        },
        { status: 400 }
      );
    }
    if (linhas.length > 500) {
      return NextResponse.json(
        { error: "Máximo de 500 SKUs por vez — divida a planilha." },
        { status: 400 }
      );
    }

    const { atualizados, naoEncontrados, antes } = await aplicarCustosPorSku(linhas);

    await auditar({
      entidade: "produto",
      entidadeId: "custos-lote",
      acao: "alterar",
      antes: { skus: antes.length, custos: antes.slice(0, 50) },
      depois: {
        atualizados,
        naoEncontrados: naoEncontrados.slice(0, 50),
        linhas: linhas.length,
      },
    });

    return NextResponse.json({
      ok: true,
      atualizados,
      naoEncontrados,
      erros,
      repetidos,
      mensagem:
        naoEncontrados.length === 0
          ? `Custo gravado em ${atualizados} produto(s).`
          : `Custo gravado em ${atualizados} produto(s). ${naoEncontrados.length} SKU(s) não estão no catálogo.`,
    });
  } catch (error) {
    console.error("[admin/produtos/custos] falha:", error);
    return NextResponse.json({ error: "Não foi possível gravar os custos" }, { status: 500 });
  }
}
