/**
 * Conversa com o cliente sobre o pedido — domínio puro (#122 / 6.5).
 *
 * O envio automático (SMTP, WhatsApp API) é configuração posterior. Hoje a
 * tela registra a mensagem e monta o link que abre o app com o texto pronto —
 * que é o que a operação fazia na mão, só que agora com histórico.
 */

export type CanalMensagem = "whatsapp" | "email" | "interno";

export const CANAL_LABEL: Record<CanalMensagem, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  interno: "Nota interna",
};

export interface PedidoParaContato {
  clienteNome: string | null;
  clienteTelefone: string | null;
  clienteEmail: string | null;
  status: string;
}

/** Só dígitos, com 55 na frente — formato que o wa.me exige. */
export function telefoneParaWhatsapp(telefone: string | null): string | null {
  if (!telefone) return null;
  const digits = telefone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function linkWhatsapp(telefone: string | null, texto: string): string | null {
  const numero = telefoneParaWhatsapp(telefone);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function linkEmail(email: string | null, assunto: string, texto: string): string | null {
  if (!email || !email.includes("@")) return null;
  return `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`;
}

export function primeiroNome(nome: string | null | undefined): string {
  const limpo = (nome || "").trim();
  if (!limpo) return "tudo bem";
  return limpo.split(/\s+/)[0];
}

/**
 * Modelos por status: o texto que a operação mais repete.
 * Nada de promessa que a loja não cumpre (prazo, desconto) — só o que é fato.
 */
export function modelosPorStatus(pedido: PedidoParaContato): { rotulo: string; texto: string }[] {
  const nome = primeiroNome(pedido.clienteNome);

  const comuns = [
    { rotulo: "Pedido recebido", texto: `Oi, ${nome}! Recebemos seu pedido aqui na Car Crew Garage. Qualquer dúvida é só chamar por aqui.` },
  ];

  switch (pedido.status) {
    case "aguardando_pagamento":
      return [
        {
          rotulo: "Lembrete de PIX",
          texto: `Oi, ${nome}! Seu pedido está reservado e aguardando o PIX. Assim que o pagamento cair, já separamos a peça.`,
        },
        ...comuns,
      ];
    case "pago":
      return [
        {
          rotulo: "Pagamento confirmado",
          texto: `Oi, ${nome}! Pagamento confirmado. Já estamos separando sua peça e avisamos assim que sair para entrega.`,
        },
        ...comuns,
      ];
    case "em_separacao":
      return [
        {
          rotulo: "Em separação",
          texto: `Oi, ${nome}! Sua peça está sendo separada aqui na loja. Avisamos quando seguir para transporte.`,
        },
        ...comuns,
      ];
    case "enviado":
      return [
        {
          rotulo: "Enviado",
          texto: `Oi, ${nome}! Seu pedido saiu para entrega. Qualquer coisa sobre a instalação, me chama aqui.`,
        },
        ...comuns,
      ];
    case "entregue":
      return [
        {
          rotulo: "Pós-venda",
          texto: `Oi, ${nome}! Vi que seu pedido foi entregue. Deu tudo certo na instalação? Qualquer dúvida sobre a peça, estou por aqui.`,
        },
        ...comuns,
      ];
    case "cancelado":
      return [
        {
          rotulo: "Cancelamento",
          texto: `Oi, ${nome}! Seu pedido foi cancelado e o valor será devolvido conforme o meio de pagamento. Se quiser, posso te ajudar a escolher outra peça.`,
        },
      ];
    default:
      return comuns;
  }
}

export class ErroMensagem extends Error {
  constructor(message: string, readonly codigo: "TEXTO" | "CANAL" | "CONTATO" = "TEXTO") {
    super(message);
  }
}

export function validarMensagem(canal: string, texto: string): void {
  if (!["whatsapp", "email", "interno"].includes(canal)) {
    throw new ErroMensagem("Canal inválido", "CANAL");
  }
  if (!texto?.trim()) {
    throw new ErroMensagem("Escreva a mensagem", "TEXTO");
  }
  if (texto.length > 2000) {
    throw new ErroMensagem("Mensagem muito longa (máximo 2000 caracteres)", "TEXTO");
  }
}
