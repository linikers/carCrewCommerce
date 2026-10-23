/**
 * Fonte única de verdade dos status de pedido.
 *
 * O checkout gravava `aguardando_pagamento` (PIX) e `confirmado` (resto),
 * mas o admin só conhecia `pendente|pago|preparando|enviado|entregue|cancelado`.
 * Resultado: todo pedido real nascia com um status que o painel não
 * reconhecia — chip cinza, nenhum botão de ação e o PATCH recusava gravar.
 * Na prática não dava para movimentar um pedido feito no site.
 */

export const STATUS_PEDIDO = [
  "aguardando_pagamento",
  "pago",
  "em_separacao",
  "enviado",
  "entregue",
  "cancelado",
] as const;

export type StatusPedido = (typeof STATUS_PEDIDO)[number];

export const STATUS_LABEL: Record<StatusPedido, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_COLOR: Record<
  StatusPedido,
  "warning" | "info" | "primary" | "success" | "error"
> = {
  aguardando_pagamento: "warning",
  pago: "info",
  em_separacao: "primary",
  enviado: "primary",
  entregue: "success",
  cancelado: "error",
};

/** Próximo passo natural da operação. `null` = fim de linha. */
export const PROXIMO_STATUS: Record<StatusPedido, StatusPedido | null> = {
  aguardando_pagamento: "pago",
  pago: "em_separacao",
  em_separacao: "enviado",
  enviado: "entregue",
  entregue: null,
  cancelado: null,
};

/** Rótulo do botão que leva ao próximo status. */
export const ACAO_PROXIMO: Record<StatusPedido, string | null> = {
  aguardando_pagamento: "Marcar pago",
  pago: "Separar",
  em_separacao: "Enviar",
  enviado: "Entregue",
  entregue: null,
  cancelado: null,
};

export function statusValido(valor: unknown): valor is StatusPedido {
  return typeof valor === "string" && (STATUS_PEDIDO as readonly string[]).includes(valor);
}

export function labelStatus(valor: string): string {
  return STATUS_LABEL[valor as StatusPedido] ?? valor;
}
