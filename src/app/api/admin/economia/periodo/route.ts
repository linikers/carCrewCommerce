import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { auditar } from "@/lib/auditoria";
import { normalizarCanal } from "@/lib/venda-import";
import { numero } from "@/lib/venda-import";
import {
  TIPOS_CUSTO,
  ROTULO_TIPO,
  CAMPO_DO_RATEIO,
  listarCustosPeriodo,
  criarCustoPeriodo,
  removerCustoPeriodo,
  tipoValido,
} from "@/lib/custos-periodo";

/**
 * Custos por período (#191, PR-4): ads e fatura do Mercado Livre Full.
 *
 * GET lista; POST cria; DELETE remove (só lançamento ainda não rateado, para não
 * deixar o rateio aplicado sem a origem).
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("relatorios");
  if (bloqueio) return bloqueio;

  return NextResponse.json({
    lancamentos: await listarCustosPeriodo(),
    tipos: TIPOS_CUSTO.map((id) => ({ id, rotulo: ROTULO_TIPO[id], rateia: CAMPO_DO_RATEIO[id] !== null })),
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("relatorios");
  if (bloqueio) return bloqueio;

  try {
    const body = await req.json();

    if (!tipoValido(String(body.tipo ?? ""))) {
      return NextResponse.json(
        { error: `Tipo inválido. Use: ${TIPOS_CUSTO.join(", ")}` },
        { status: 400 }
      );
    }
    const canal = normalizarCanal(String(body.canal ?? ""));
    if (!canal) {
      return NextResponse.json({ error: "Canal inválido" }, { status: 400 });
    }

    const inicio = body.inicio ? new Date(String(body.inicio)) : null;
    const fim = body.fim ? new Date(String(body.fim)) : null;
    if (!inicio || Number.isNaN(inicio.getTime()) || !fim || Number.isNaN(fim.getTime())) {
      return NextResponse.json({ error: "Informe o período (de e até)" }, { status: 400 });
    }

    const valor = numero(String(body.valor ?? ""));
    if (valor === null || valor <= 0) {
      return NextResponse.json({ error: "Valor precisa ser maior que zero" }, { status: 400 });
    }

    const criado = await criarCustoPeriodo({
      tipo: String(body.tipo),
      canal,
      inicio,
      fim,
      valor,
      observacao: body.observacao ? String(body.observacao) : null,
    });

    await auditar({
      entidade: "economia",
      entidadeId: criado.id,
      acao: "criar",
      antes: null,
      depois: { tipo: criado.tipo, canal: criado.canal, valor: criado.valor, inicio, fim },
    });

    return NextResponse.json({ ok: true, lancamento: criado }, { status: 201 });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Não foi possível lançar";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("relatorios");
  if (bloqueio) return bloqueio;

  const id = req.nextUrl.searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Informe o id" }, { status: 400 });

  const lancamento = (await listarCustosPeriodo()).find((l) => l.id === id);
  if (!lancamento) return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
  if (lancamento.rateadoEm) {
    return NextResponse.json(
      { error: "Este lançamento já foi rateado. Remover deixaria o rateio sem origem." },
      { status: 409 }
    );
  }

  await removerCustoPeriodo(id);
  await auditar({
    entidade: "economia",
    entidadeId: id,
    acao: "excluir",
    antes: { tipo: lancamento.tipo, canal: lancamento.canal, valor: lancamento.valor },
    depois: null,
  });

  return NextResponse.json({ ok: true });
}
