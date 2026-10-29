import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { auditar } from "@/lib/auditoria";
import prisma from "@/lib/prisma";
import {
  CANAIS_VENDA,
  ROTULO_CANAL,
  lerComissoes,
  lerEconomia,
  salvarComissoes,
  salvarEconomia,
} from "@/lib/economia";

/**
 * Custo de vender (#191): comissão por plataforma, imposto, embalagem e taxa de
 * gateway.
 *
 * A tela fica em `/admin/economia`, dentro do módulo Relatórios — e não em
 * `/admin/marketplace`, porque o módulo de marketplace pode estar desligado e aí
 * o cliente não teria onde cadastrar a comissão que ele paga hoje.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("relatorios");
  if (bloqueio) return bloqueio;

  const [economia, comissoes, exemplo] = await Promise.all([
    lerEconomia(),
    lerComissoes(),
    // prévia com peça real: o dono confere o número antes de salvar
    prisma.produto.findFirst({
      where: { ativo: true, preco: { gt: 0 } },
      orderBy: { id: "asc" },
      select: { id: true, nome: true, preco: true, custo: true },
    }),
  ]);

  return NextResponse.json({
    economia,
    comissoes,
    canais: CANAIS_VENDA.map((id) => ({ id, rotulo: ROTULO_CANAL[id] })),
    exemplo,
  });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("relatorios");
  if (bloqueio) return bloqueio;

  try {
    const body = (await req.json()) as { economia?: unknown; comissoes?: unknown };

    const antes = {
      economia: await lerEconomia(),
      comissoes: await lerComissoes(),
    };

    // Merge campo a campo (e canal a canal). O corpo pode vir parcial: sem isso,
    // um PUT que manda só o Mercado Livre zera Shopee e site — e o cliente
    // descobre quando o relatório mostra comissão zero num canal que ele pagou.
    const economiaEntrada = body.economia !== undefined ? (body.economia as Record<string, unknown>) : null;
    const comissoesEntrada = body.comissoes !== undefined ? (body.comissoes as Record<string, Record<string, unknown>>) : null;

    const economia = economiaEntrada
      ? await salvarEconomia({ ...antes.economia, ...economiaEntrada })
      : antes.economia;

    const comissoes = comissoesEntrada
      ? await salvarComissoes(
          Object.fromEntries(
            CANAIS_VENDA.map((canal) => [
              canal,
              { ...antes.comissoes[canal], ...(comissoesEntrada[canal] ?? {}) },
            ])
          )
        )
      : antes.comissoes;

    await auditar({
      entidade: "economia",
      entidadeId: "custo-de-vender",
      acao: "alterar",
      antes,
      depois: { economia, comissoes },
    });

    return NextResponse.json({ ok: true, economia, comissoes });
  } catch (error) {
    console.error("[admin/economia] falha ao salvar:", error);
    return NextResponse.json({ error: "Não foi possível salvar" }, { status: 500 });
  }
}
