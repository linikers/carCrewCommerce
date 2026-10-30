import { requireAdmin } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { auditar } from "@/lib/auditoria";
import { criarChave, revogarChave, statusChave } from "@/modules/fiscal/dados/retorno";

/** Chave de API do emissor: criar (valor volta uma vez), consultar e revogar. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;
  return NextResponse.json({ chave: await statusChave() });
}

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  const { chave, prefixo } = await criarChave();
  await auditar({
    entidade: "configuracao",
    entidadeId: "fiscal-chave-api",
    acao: "criar",
    antes: null,
    depois: { prefixo },
  });
  return NextResponse.json({
    ok: true,
    chave,
    prefixo,
    aviso: "Guarde agora: a chave não é exibida de novo.",
  });
}

export async function DELETE() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  await revogarChave();
  await auditar({
    entidade: "configuracao",
    entidadeId: "fiscal-chave-api",
    acao: "excluir",
    antes: { revogada: true },
    depois: null,
  });
  return NextResponse.json({ ok: true });
}
