import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auditar } from "@/lib/auditoria";

/**
 * Dado fiscal em lote (interface do emissor).
 *
 * A planilha vem por SKU: `SKU;CSOSN;CFOP interno;CFOP externo`
 * (ex.: `AMO-007;102;5102;6102`). Campos vazios limpam o valor.
 *
 * Casa por SKU, nunca por nome. Devolve o que não casou e o que foi recusado —
 * importação de dado fiscal que termina com "ok" sem dizer o que ignorou é o
 * que faz o emissor rejeitar nota três dias depois.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const texto = typeof body.texto === "string" ? body.texto : "";

    if (texto.trim() === "") {
      return NextResponse.json({ error: "Cole a lista SKU;CSOSN;CFOP interno;CFOP externo" }, { status: 400 });
    }

    const linhas: { sku: string; cstCsosn: string | null; cfopInterno: string | null; cfopExterno: string | null }[] = [];
    const erros: { linha: number; texto: string; motivo: string }[] = [];

    texto.split(/\r?\n/).forEach((crua: string, indice: number) => {
      const numero = indice + 1;
      const linha = crua.trim();
      if (linha === "" || linha.startsWith("#")) return;

      const campos = linha.split(/[;\t]/).map((c: string) => c.trim());
      const sku = String(campos[0] ?? "").trim().toUpperCase();
      if (sku === "" || sku.toLowerCase() === "sku") return;

      if (campos.length < 2) {
        erros.push({ linha: numero, texto: linha, motivo: "sem CSOSN na linha" });
        return;
      }

      const so = (v: string | undefined) => (v ? String(v).replace(/\D/g, "") || null : null);
      const cstCsosn = so(campos[1]);
      const cfopInterno = so(campos[2]);
      const cfopExterno = so(campos[3]);

      if (cstCsosn && cstCsosn.length !== 3) {
        erros.push({ linha: numero, texto: linha, motivo: `CSOSN "${campos[1]}" não tem 3 dígitos` });
        return;
      }
      if (cfopInterno && cfopInterno.length !== 4) {
        erros.push({ linha: numero, texto: linha, motivo: `CFOP interno "${campos[2]}" não tem 4 dígitos` });
        return;
      }
      if (cfopExterno && cfopExterno.length !== 4) {
        erros.push({ linha: numero, texto: linha, motivo: `CFOP externo "${campos[3]}" não tem 4 dígitos` });
        return;
      }
      if (!cstCsosn && !cfopInterno && !cfopExterno) {
        erros.push({ linha: numero, texto: linha, motivo: "linha sem nenhum dado fiscal" });
        return;
      }

      linhas.push({ sku, cstCsosn, cfopInterno, cfopExterno });
    });

    if (linhas.length === 0) {
      return NextResponse.json({ error: "Nenhuma linha válida.", erros }, { status: 400 });
    }
    if (linhas.length > 500) {
      return NextResponse.json({ error: "Máximo de 500 SKUs por vez — divida a planilha." }, { status: 400 });
    }

    const produtos = await prisma.produto.findMany({
      where: { sku: { in: linhas.map((l) => l.sku) } },
      select: { id: true, sku: true },
    });
    const porSku = new Map(produtos.map((p) => [String(p.sku).toUpperCase(), p.id]));

    const naoEncontrados: string[] = [];
    let atualizados = 0;

    for (const linha of linhas) {
      const id = porSku.get(linha.sku);
      if (!id) {
        naoEncontrados.push(linha.sku);
        continue;
      }
      await prisma.produto.update({
        where: { id },
        data: {
          ...(linha.cstCsosn ? { cstCsosn: linha.cstCsosn } : {}),
          ...(linha.cfopInterno ? { cfopInterno: linha.cfopInterno } : {}),
          ...(linha.cfopExterno ? { cfopExterno: linha.cfopExterno } : {}),
        },
      });
      atualizados += 1;
    }

    await auditar({
      entidade: "produto",
      entidadeId: "fiscal-lote",
      acao: "alterar",
      antes: { linhas: linhas.length },
      depois: { atualizados, naoEncontrados: naoEncontrados.slice(0, 50) },
    });

    return NextResponse.json({
      ok: true,
      atualizados,
      naoEncontrados,
      erros,
      mensagem:
        naoEncontrados.length === 0
          ? `Dado fiscal gravado em ${atualizados} produto(s).`
          : `Dado fiscal gravado em ${atualizados} produto(s). ${naoEncontrados.length} SKU(s) fora do catálogo.`,
    });
  } catch (error) {
    console.error("[admin/produtos/fiscal] falha:", error);
    return NextResponse.json({ error: "Não foi possível gravar o dado fiscal" }, { status: 500 });
  }
}
