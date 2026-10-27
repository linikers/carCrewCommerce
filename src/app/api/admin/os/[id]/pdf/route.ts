import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { lerOSParaPDF } from "@/modules/os/dados/os";
import { gerarPdfOS, montarProps } from "@/modules/os/pdf/gerar";
import { lerEmpresa } from "@/lib/empresa";

/** Consultas e render não rodam no edge. */
export const runtime = "nodejs";

/** PDF da OS para imprimir e enviar ao cliente (#os-pdf). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("os");
  if (bloqueio) return bloqueio;

  const { id } = await params;
  const ordem = await lerOSParaPDF(id);
  if (!ordem) return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });

  const empresa = await lerEmpresa();

  // versão interna: mostra custo e margem
  const pdf = await gerarPdfOS(montarProps(ordem, empresa, true));

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="OS-${id.slice(-6).toUpperCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
