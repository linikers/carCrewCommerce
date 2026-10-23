/**
 * CPF e CNPJ — validação e máscara (5.5).
 *
 * O checkout não pedia documento. Sem CPF/CNPJ no pedido não há como emitir
 * nota depois (item 6.12) nem conferir o pagador.
 */

export function soDigitos(valor: string): string {
  return (valor || "").replace(/\D/g, "");
}

/** CPF: 11 dígitos, dois verificadores. Rejeita sequências repetidas. */
export function cpfValido(valor: string): boolean {
  const c = soDigitos(valor);
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false;

  const calc = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(c[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
}

/** CNPJ: 14 dígitos, dois verificadores. */
export function cnpjValido(valor: string): boolean {
  const c = soDigitos(valor);
  if (c.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(c)) return false;

  const calc = (ate: number) => {
    let soma = 0;
    let peso = ate - 7;
    for (let i = 0; i < ate; i++) {
      soma += Number(c[i]) * peso;
      peso -= 1;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
}

export function documentoValido(valor: string): boolean {
  const d = soDigitos(valor);
  return d.length === 11 ? cpfValido(d) : d.length === 14 ? cnpjValido(d) : false;
}

/** 000.000.000-00 ou 00.000.000/0000-00, conforme o tamanho digitado. */
export function formatarDocumento(valor: string): string {
  const d = soDigitos(valor).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatarCep(valor: string): string {
  const d = soDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function formatarTelefone(valor: string): string {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;
