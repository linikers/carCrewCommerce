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
/** 12,3% — percentual com vírgula, como o resto do painel */
export function formatPercent(valor: number, casas = 1): string {
  if (!Number.isFinite(valor)) return "0%";
  return `${valor.toFixed(casas).replace(".", ",")}%`;
}

export function formatNumero(valor: number): string {
  if (!Number.isFinite(valor)) return "0,00";
  return numero.format(valor);
}

/** 12x de R$ 108,25 */
export function formatParcela(total: number, vezes: number): string {
  if (!vezes || vezes < 2 || total <= 0) return formatBRL(total);
  return `${vezes}x de ${formatBRL(total / vezes)}`;
}

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

const dataCompleta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Datas em pt-BR — `dd/mm` e `dd/mm/aaaa`.
 *
 * O admin tinha três formatadores diferentes e nenhum centralizado: uma tela
 * mostrava `10/16` (mês/dia, formato do GA4), outra `20261016`, outra
 * `16/10/2026`. Aqui a ordem é sempre dia/mês/ano.
 */
export function formatDataCurta(valor: Date | string | number): string {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return dataCurta.format(d);
}

export function formatData(valor: Date | string | number): string {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return dataCompleta.format(d);
}

/**
 * Data do GA4 (`YYYYMMDD`) em `dd/mm`.
 *
 * O código anterior fatiava na ordem americana (`slice(4,6) + "/" +
 * slice(6,8)`) e o eixo do gráfico mostrava `10/16` para 16 de outubro.
 */
export function formatDataGA4(valor: string | undefined): string {
  if (!valor || valor.length !== 8) return "—";
  return `${valor.slice(6, 8)}/${valor.slice(4, 6)}`;
}

/** Data do GA4 (`YYYYMMDD`) em `dd/mm/aaaa` — para tooltip. */
export function formatDataGA4Completa(valor: string | undefined): string {
  if (!valor || valor.length !== 8) return "—";
  return `${valor.slice(6, 8)}/${valor.slice(4, 6)}/${valor.slice(0, 4)}`;
}
