import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { CANAIS, CANAIS_EM_BREVE, acharCanal } from "@/modules/marketplace/dominio/canais";
import { lerComissoes } from "@/lib/economia";
import {
  listarCredenciais,
  removerCredencial,
  salvarCredencial,
} from "@/modules/marketplace/dados/credenciais";

/**
 * Cadastro de credenciais de marketplace (Shopee, Mercado Livre).
 *
 * Aqui é só o cadastro: nada sincroniza ainda (#83/#84). A leitura nunca
 * devolve segredo — só se ele existe.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("marketplace");
  if (bloqueio) return bloqueio;

  return NextResponse.json({
    canais: CANAIS,
    emBreve: CANAIS_EM_BREVE,
    credenciais: await listarCredenciais(),
    // comissão cadastrada para cada canal (#191). A edição vive em
    // /admin/economia; aqui é só leitura, para a tela de integração não
    // esconder o número que o cliente paga hoje.
    comissoes: await lerComissoes(),
  });
}

/** PUT com `?canal=shopee` no corpo: { canal, ...campos } */
export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("marketplace");
  if (bloqueio) return bloqueio;

  try {
    const body = (await req.json()) as { canal?: string } & Record<string, unknown>;
    const canalId = String(body.canal || "");
    const definicao = acharCanal(canalId);

    if (!definicao) {
      return NextResponse.json({ error: "Canal desconhecido" }, { status: 400 });
    }

    const { canal: _ignorado, ...campos } = body;
    const { faltando } = await salvarCredencial(canalId, campos);

    return NextResponse.json({
      ok: true,
      faltando,
      mensagem:
        faltando.length === 0
          ? `Credenciais de ${definicao.nome} salvas.`
          : `Salvo, mas faltam: ${faltando.join(", ")}.`,
    });
  } catch (error) {
    console.error("[admin/canais] falha ao salvar:", error);
    return NextResponse.json({ error: "Não foi possível salvar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("marketplace");
  if (bloqueio) return bloqueio;

  const canal = req.nextUrl.searchParams.get("canal") || "";
  if (!acharCanal(canal)) {
    return NextResponse.json({ error: "Canal desconhecido" }, { status: 400 });
  }

  await removerCredencial(canal);
  return NextResponse.json({ ok: true });
}
