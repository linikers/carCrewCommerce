/**
 * Regras de estoque — domínio puro (#73).
 *
 * Sem Next, sem Prisma: a conta de saldo e a validação de saída rodam em
 * qualquer lugar (checkout, ajuste manual, importação futura).
 */

export type TipoMovimento = "entrada" | "saida" | "ajuste" | "estorno";

export const TIPO_LABEL: Record<TipoMovimento, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste de conferência",
  estorno: "Estorno",
};

export interface MovimentoEntrada {
  produtoId: number;
  tipo: TipoMovimento;
  /** Sempre positivo: o sinal vem do tipo (saída subtrai). */
  quantidade: number;
  motivo: string;
  origem: "pedido" | "manual" | "compra" | "estorno" | "conferencia" | "migracao";
  pedidoId?: string | null;
  usuarioId?: string | null;
}

export class ErroEstoque extends Error {
  constructor(
    message: string,
    readonly codigo: "QUANTIDADE" | "SALDO" | "MOTIVO" | "PRODUTO" = "QUANTIDADE"
  ) {
    super(message);
  }
}

/** Quanto o saldo muda com este movimento (sinal aplicado). */
export function deltaDoMovimento(tipo: TipoMovimento, quantidade: number): number {
  switch (tipo) {
    case "entrada":
    case "estorno":
      return quantidade;
    case "saida":
      return -quantidade;
    case "ajuste":
      // ajuste é a diferença informada (pode ser negativa na chamada)
      return quantidade;
  }
}

export function validarMovimento(
  movimento: MovimentoEntrada,
  saldoAtual: number
): number {
  const quantidade = Math.trunc(Number(movimento.quantidade));

  if (!Number.isFinite(quantidade) || quantidade === 0) {
    throw new ErroEstoque("Informe uma quantidade diferente de zero", "QUANTIDADE");
  }

  if (movimento.tipo !== "ajuste" && quantidade < 0) {
    throw new ErroEstoque("Quantidade não pode ser negativa — use o tipo certo", "QUANTIDADE");
  }

  if (!movimento.motivo?.trim()) {
    throw new ErroEstoque("O motivo é obrigatório: daqui a três meses é o que explica o número", "MOTIVO");
  }

  const delta = deltaDoMovimento(movimento.tipo, quantidade);
  const saldoDepois = saldoAtual + delta;

  if (saldoDepois < 0) {
    throw new ErroEstoque(
      `Saldo ficaria negativo (${saldoAtual} ${delta > 0 ? "+" : ""}${delta} = ${saldoDepois})`,
      "SALDO"
    );
  }

  return saldoDepois;
}
