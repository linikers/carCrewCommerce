import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { auditar } from "@/lib/auditoria";
import { montarPacote, pacoteParaCsv, marcarExportadas } from "@/modules/fiscal/dados/pacote";
import { normalizarCanal } from "@/lib/venda-import";

/**
 * Exporta o lote de notas para o emissor do cliente.
 *
 * `?formato=json` (padrão) devolve o contrato completo; `?formato=csv` devolve
 * uma linha por item, para quem importa planilha. As notas exportadas passam a
 * `exportada` — o lote não é entregue duas vezes por acidente.
 *
 * O site não emite: isto é só a saída de dados.
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  const p = req.nextUrl.searchParams;
  const ate = p.get("ate") ? new Date(String(p.get("ate"))) : new Date();
  const de = p.get("de") ? new Date(String(p.get("de"))) : new Date(ate.getFullYear(), ate.getMonth(), 1);
  ate.setHours(23, 59, 59, 999);

  if (Number.isNaN(de.getTime()) || Number.isNaN(ate.getTime())) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  const formato = p.get("formato") === "csv" ? "csv" : "json";
  const incluirPendentes = p.get("incluirPendentes") === "1";
  const canal = p.get("canal") ? normalizarCanal(String(p.get("canal"))) : null;

  const pacote = await montarPacote({ de, ate, canal, incluirPendentes });

  if (pacote.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma nota pronta no período. Gere a fila antes de exportar." },
      { status: 404 }
    );
  }

  const marcadas = incluirPendentes ? 0 : await marcarExportadas(pacote.map((n) => n.pedidoId));

  await auditar({
    entidade: "configuracao",
    entidadeId: "exportacao-notas",
    acao: "alterar",
    antes: null,
    depois: { formato, notas: pacote.length, marcadas, de: de.toISOString(), ate: ate.toISOString() },
  });

  const nomeArquivo = `notas-${de.toISOString().slice(0, 10)}-a-${ate.toISOString().slice(0, 10)}`;

  if (formato === "csv") {
    return new NextResponse(pacoteParaCsv(pacote), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeArquivo}.csv"`,
      },
    });
  }

  return NextResponse.json(
    { geradoEm: new Date().toISOString(), notas: pacote.length, marcadas, pacote },
    { headers: { "Content-Disposition": `attachment; filename="${nomeArquivo}.json"` } }
  );
}
