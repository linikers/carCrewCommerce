import { NextRequest, NextResponse } from "next/server";
import { lerOrcamentoPublico } from "@/modules/os/dados/os";
import { gerarPdfOS, montarProps, type OrdemParaPDF } from "@/modules/os/pdf/gerar";
import { lerEmpresa } from "@/lib/empresa";

export const runtime = "nodejs";

/**
 * PDF do orçamento para o cliente (#os-pdf).
 *
 * Nunca passa custo: `incluirCusto` é false fixo aqui. O cliente baixa ou
 * imprime o mesmo documento que o admin vê, menos a coluna de custo.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const orcamento = await lerOrcamentoPublico(token);
  if (!orcamento) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });

  const empresa = await lerEmpresa();
  const pdf = await gerarPdfOS(montarProps(orcamento as unknown as OrdemParaPDF, empresa, false));

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Orcamento-${orcamento.id.slice(-6).toUpperCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
