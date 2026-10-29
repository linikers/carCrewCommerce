/**
 * Leitura de custos colados de planilha (#191).
 *
 * O dono exporta do sistema atual (Excel/Sheets) e cola aqui. Formatos aceitos
 * por linha:
 *
 *   SKU;custo           AMO-007;550,00
 *   SKU<TAB>custo       (colagem direta do Excel)
 *   SKU,custo           (CSV simples)
 *
 * Cabeçalho (`sku;custo`) é ignorado, linha vazia e linha iniciada por `#`
 * também. Custo vazio (`AMO-007;`) limpa o valor — volta a "não informado",
 * que é diferente de custo zero.
 *
 * Devolve o que conseguiu ler e o que recusou, com o número da linha: erro
 * silencioso em importação de dinheiro é o pior tipo de erro.
 */

export interface LinhaCusto {
  sku: string;
  /** null = limpar o custo cadastrado */
  custo: number | null;
}

export interface ResultadoLeitura {
  linhas: LinhaCusto[];
  erros: { linha: number; texto: string; motivo: string }[];
  repetidos: string[];
}

/** "R$ 1.234,56" → 1234.56 · "550.90" → 550.9 · "" → null */
export function converterCusto(bruto: string): number | null | "invalido" {
  const texto = String(bruto ?? "").trim();
  if (texto === "") return null;

  let limpo = texto.replace(/[R$\s]/gi, "");
  if (limpo === "") return null;

  const temVirgula = limpo.includes(",");
  const temPonto = limpo.includes(".");

  if (temVirgula && temPonto) {
    // formato brasileiro completo: 1.234,56
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    limpo = limpo.replace(",", ".");
  }

  if (!/^\d+(\.\d+)?$/.test(limpo)) return "invalido";

  const valor = Number(limpo);
  if (!Number.isFinite(valor) || valor < 0) return "invalido";

  return Math.round(valor * 100) / 100;
}

export function lerLinhasDeCusto(texto: string): ResultadoLeitura {
  const linhas: LinhaCusto[] = [];
  const erros: ResultadoLeitura["erros"] = [];
  const vistos = new Set<string>();
  const repetidos: string[] = [];

  String(texto ?? "")
    .split(/\r?\n/)
    .forEach((linhaCrua, indice) => {
      const numero = indice + 1;
      const linha = linhaCrua.trim();
      if (linha === "" || linha.startsWith("#")) return;

      // separador: ponto e vírgula e tab são os que aparecem na colagem do
      // Excel; vírgula só quando a linha tem exatamente dois campos.
      let partes: string[];
      if (linha.includes(";")) partes = linha.split(";");
      else if (linha.includes("\t")) partes = linha.split("\t");
      else if ((linha.match(/,/g) || []).length === 1) partes = linha.split(",");
      else partes = [linha];

      if (partes.length < 2) {
        // "SKU 550,00" — separa o último espaço
        const ultimoEspaco = linha.lastIndexOf(" ");
        if (ultimoEspaco > 0) partes = [linha.slice(0, ultimoEspaco), linha.slice(ultimoEspaco + 1)];
      }

      const sku = String(partes[0] ?? "").trim().toUpperCase();
      const valorBruto = partes.slice(1).join(" ").trim();

      if (sku === "" || sku.toLowerCase() === "sku") return; // cabeçalho ou vazio
      if (partes.length < 2) {
        erros.push({ linha: numero, texto: linha, motivo: "sem custo na linha" });
        return;
      }

      const custo = converterCusto(valorBruto);
      if (custo === "invalido") {
        erros.push({ linha: numero, texto: linha, motivo: `custo "${valorBruto}" não é número` });
        return;
      }

      if (vistos.has(sku)) repetidos.push(sku);
      vistos.add(sku);
      linhas.push({ sku, custo });
    });

  return { linhas, erros, repetidos };
}
