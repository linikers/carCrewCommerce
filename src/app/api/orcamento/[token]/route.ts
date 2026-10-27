import { NextRequest, NextResponse } from "next/server";
import { decidirOrcamento, lerOrcamentoPublico } from "@/modules/os/dados/os";
import { ErroOS } from "@/modules/os/dominio/os";

/**
 * Orçamento da oficina, público (#os).
 *
 * O cliente recebe o link no WhatsApp e responde sem login. Aqui só existe o
 * que ele precisa ver: itens, valores e total. Custo interno não sai daqui.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const orcamento = await lerOrcamentoPublico(token);

  if (!orcamento) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  return NextResponse.json(orcamento);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const body = await req.json();
    const aprovado = body?.decisao === "aprovar";

    const ordem = await decidirOrcamento(token, aprovado);

    return NextResponse.json({
      ok: true,
      status: ordem.status,
      mensagem: aprovado
        ? "Orçamento aprovado. A oficina vai te chamar para agendar."
        : "Orçamento recusado. A oficina foi avisada.",
    });
  } catch (e) {
    if (e instanceof ErroOS) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[orcamento] falha:", e);
    return NextResponse.json({ error: "Não foi possível registrar sua resposta" }, { status: 500 });
  }
}
