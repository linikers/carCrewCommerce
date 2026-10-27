import { requireAdmin, getAdminId } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  ErroMensagem,
  linkEmail,
  linkWhatsapp,
  validarMensagem,
} from "@/modules/pedidos/dominio/mensagem";
import {
  contatoDoPedido,
  listarMensagens,
  marcarMensagemEnviada,
  registrarMensagem,
} from "@/modules/pedidos/dados/pedidos";

/**
 * Conversa com o cliente sobre o pedido (6.5 / #122).
 *
 * POST registra a mensagem e devolve o link para enviar (wa.me / mailto) —
 * envio automático é configuração posterior.
 * PATCH marca como enviada depois que o operador confirma.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  return NextResponse.json(await listarMensagens(id));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  try {
    const body = await req.json();
    const canal = String(body.canal || "whatsapp");
    const texto = String(body.texto || "");

    validarMensagem(canal, texto);

    const pedido = await contatoDoPedido(id);

    if (!pedido) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const mensagem = await registrarMensagem({
      pedidoId: id,
      canal,
      texto,
      autorId: await getAdminId(),
      enviado: false,
    });

    const assunto = `Pedido Car Crew Garage${pedido.clienteNome ? ` — ${pedido.clienteNome}` : ""}`;

    return NextResponse.json({
      mensagem,
      link:
        canal === "whatsapp"
          ? linkWhatsapp(pedido.clienteTelefone, texto)
          : canal === "email"
            ? linkEmail(pedido.clienteEmail, assunto, texto)
            : null,
      aviso:
        canal === "whatsapp" && !pedido.clienteTelefone
          ? "Pedido sem telefone — a mensagem ficou registrada, mas não há para onde enviar."
          : canal === "email" && !pedido.clienteEmail
            ? "Pedido sem e-mail — a mensagem ficou registrada, mas não há para onde enviar."
            : null,
    });
  } catch (e) {
    if (e instanceof ErroMensagem) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[pedidos/mensagens] falha:", e);
    return NextResponse.json({ error: "Não foi possível registrar a mensagem" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();

  if (!body.mensagemId) {
    return NextResponse.json({ error: "mensagemId é obrigatório" }, { status: 400 });
  }

  const { count } = await marcarMensagemEnviada(id, String(body.mensagemId));
  return NextResponse.json({ ok: count > 0 });
}
