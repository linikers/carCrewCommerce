import { NextRequest, NextResponse } from "next/server";
import { auditar } from "@/lib/auditoria";
import { validarChave } from "@/modules/fiscal/dados/retorno";
import { montarPacote, marcarExportadas } from "@/modules/fiscal/dados/pacote";

/**
 * Pull do lote para o emissor (Bearer cc_…) — F1/F2 da emissão própria.
 *
 * Devolve as notas `pronta` com o payload completo do leiaute (incluindo IBGE e
 * tipo de documento) e marca como `exportada`. Quem consome é o worker do
 * servidor, que assina e transmite; o site não emite.
 */
export async function GET(req: NextRequest) {
  const autorizado = await validarChave(req.headers.get("authorization"));
  if (!autorizado) {
    return NextResponse.json({ error: "Chave de API inválida ou ausente" }, { status: 401 });
  }

  const p = req.nextUrl.searchParams;
  const ate = p.get("ate") ? new Date(String(p.get("ate"))) : new Date();
  const de = p.get("de") ? new Date(String(p.get("de"))) : new Date(ate.getTime() - 30 * 24 * 60 * 60 * 1000);
  ate.setHours(23, 59, 59, 999);

  if (Number.isNaN(de.getTime()) || Number.isNaN(ate.getTime())) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  const pacote = await montarPacote({ de, ate });

  if (pacote.length === 0) {
    return NextResponse.json({ notas: 0, pacote: [] });
  }

  const marcadas = await marcarExportadas(pacote.map((n) => n.pedidoId));

  await auditar({
    entidade: "configuracao",
    entidadeId: "pull-notas",
    acao: "alterar",
    antes: null,
    depois: { notas: pacote.length, marcadas },
  });

  return NextResponse.json({ geradoEm: new Date().toISOString(), notas: pacote.length, marcadas, pacote });
}
