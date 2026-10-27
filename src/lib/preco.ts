/**
 * Preço com desconto — fonte única (#desconto).
 *
 * O desconto é aplicado **no servidor** ao gravar o pedido, então o valor que o
 * cliente vê é o valor que ele paga. Se o cálculo existisse só na tela, o
 * checkout cobraria o preço cheio e a promoção seria mentira.
 */

export interface PrecoExibido {
  /** preço de tabela */
  de: number;
  /** preço que o cliente paga */
  por: number;
  /** 0 quando não há desconto */
  percentual: number;
  temDesconto: boolean;
  /** quanto economiza, em reais */
  economia: number;
}

function arredondar(valor: number): number {
  return Number(valor.toFixed(2));
}

/** Normaliza o percentual vindo do banco/banco de dados (0–90, passo 0,5). */
export function normalizarPercentual(valor: unknown): number {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return 0;
  // acima de 90% quase sempre é erro de digitação; segura em 90
  return Math.min(90, Math.round(n * 2) / 2);
}

export function calcularPreco(preco: number, percentual: unknown): PrecoExibido {
  const de = arredondar(Number(preco) || 0);
  const pct = normalizarPercentual(percentual);

  if (pct === 0) {
    return { de, por: de, percentual: 0, temDesconto: false, economia: 0 };
  }

  const por = arredondar(de * (1 - pct / 100));
  return { de, por, percentual: pct, temDesconto: true, economia: arredondar(de - por) };
}
