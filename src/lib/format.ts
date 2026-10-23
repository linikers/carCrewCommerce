/**
 * Formatação de valores em pt-BR.
 *
 * Motivo: o site usava `toFixed(2)` em 27 lugares, o que produz "R$ 849.00"
 * (ponto decimal, sem separador de milhar). Em pt-BR o correto é "R$ 849,00".
 * Centralizar aqui garante consistência e um único ponto de mudança.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numero = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** R$ 1.299,00 */
export function formatBRL(valor: number): string {
  if (!Number.isFinite(valor)) return "R$ 0,00";
  return brl.format(valor);
}

/** 1.299,00 — sem o símbolo, para composições */
export function formatNumero(valor: number): string {
  if (!Number.isFinite(valor)) return "0,00";
  return numero.format(valor);
}

/** 12x de R$ 108,25 */
export function formatParcela(total: number, vezes: number): string {
  if (!vezes || vezes < 2 || total <= 0) return formatBRL(total);
  return `${vezes}x de ${formatBRL(total / vezes)}`;
}
