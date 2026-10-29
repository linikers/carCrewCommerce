/**
 * Importação de vendas por planilha (#191).
 *
 * O cliente tem histórico no sistema atual e não vai digitar venda por venda.
 * Ele exporta, cola, e o sistema lê. Formato aceito (cabeçalho obrigatório):
 *
 *   data;canal;sku;quantidade;valor;comissao;frete;custo;imposto;embalagem;ads;id;cliente
 *
 * - `data`: AAAA-MM-DD ou DD/MM/AAAA
 * - `canal`: mercado_livre | shopee | site | manual (sinônimos: ML, mercado livre)
 * - `valor`: valor unitário da peça
 * - `id`: id do pedido no marketplace (deduplicação). Vazio = pode duplicar.
 * - `cliente`: nome livre, opcional
 *
 * Linha recusada volta com o número e o motivo: importação de dinheiro não
 * termina com "ok" sem dizer o que ignorou.
 */

export interface LinhaVenda {
  linha: number;
  data: Date | null;
  canal: string;
  sku: string;
  quantidade: number;
  valor: number;
  comissao: number | null;
  frete: number;
  custo: number | null;
  imposto: number | null;
  embalagem: number | null;
  ads: number;
  canalPedidoId: string | null;
  cliente: string | null;
}

export interface LeituraVendas {
  linhas: LinhaVenda[];
  erros: { linha: number; texto: string; motivo: string }[];
}

const CANONICO: Record<string, string> = {
  mercado_livre: "mercado_livre",
  "mercado livre": "mercado_livre",
  ml: "mercado_livre",
  meli: "mercado_livre",
  shopee: "shopee",
  site: "site",
  loja: "site",
  manual: "manual",
  balcao: "manual",
  "balcão": "manual",
};

export function normalizarCanal(bruto: string): string | null {
  const chave = String(bruto ?? "").trim().toLowerCase();
  return CANONICO[chave] ?? null;
}

export function numero(bruto: string): number | null {
  const texto = String(bruto ?? "").trim();
  if (texto === "") return null;
  let limpo = texto.replace(/[R$\s]/gi, "");
  if (limpo === "") return null;
  if (limpo.includes(",") && limpo.includes(".")) limpo = limpo.replace(/\./g, "").replace(",", ".");
  else if (limpo.includes(",")) limpo = limpo.replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(limpo)) return null;
  return Math.round(Number(limpo) * 100) / 100;
}

export function data(bruto: string): Date | null {
  const texto = String(bruto ?? "").trim();
  if (texto === "") return null;
  // DD/MM/AAAA
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const d = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]), 12, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const iso = new Date(texto);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

const COLUNAS = [
  "data",
  "canal",
  "sku",
  "quantidade",
  "valor",
  "comissao",
  "frete",
  "custo",
  "imposto",
  "embalagem",
  "ads",
  "id",
  "cliente",
] as const;

export function lerLinhasDeVenda(texto: string): LeituraVendas {
  const linhas: LinhaVenda[] = [];
  const erros: LeituraVendas["erros"] = [];

  const brutas = String(texto ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"));

  if (brutas.length === 0) return { linhas, erros };

  // cabeçalho: primeira linha precisa ter os nomes das colunas na ordem que
  // vier — planilha do cliente raramente sai na ordem documentada
  const primeira = brutas[0].toLowerCase();
  const temCabecalho = primeira.includes("sku") || primeira.includes("canal");
  if (!temCabecalho) {
    erros.push({
      linha: 1,
      texto: brutas[0],
      motivo: "falta o cabeçalho (data;canal;sku;quantidade;valor;...)",
    });
    return { linhas, erros };
  }

  const cabecalho = brutas[0].split(";").map((c) => c.trim().toLowerCase());
  const indice = (nome: string) => cabecalho.indexOf(nome);
  const faltando = ["canal", "sku", "quantidade", "valor"].filter((c) => indice(c) === -1);
  if (faltando.length > 0) {
    erros.push({
      linha: 1,
      texto: brutas[0],
      motivo: `coluna obrigatória ausente: ${faltando.join(", ")}`,
    });
    return { linhas, erros };
  }

  brutas.slice(1).forEach((linha, i) => {
    const numeroLinha = i + 2;
    const campos = linha.split(";").map((c) => c.trim());
    const pegar = (nome: (typeof COLUNAS)[number]) => {
      const pos = indice(nome);
      return pos === -1 ? "" : campos[pos] ?? "";
    };

    const canal = normalizarCanal(pegar("canal"));
    if (!canal) {
      erros.push({ linha: numeroLinha, texto: linha, motivo: `canal "${pegar("canal")}" desconhecido` });
      return;
    }

    const sku = pegar("sku").toUpperCase();
    if (!sku) {
      erros.push({ linha: numeroLinha, texto: linha, motivo: "sku vazio" });
      return;
    }

    const quantidade = numero(pegar("quantidade"));
    if (quantidade === null || quantidade < 1) {
      erros.push({ linha: numeroLinha, texto: linha, motivo: "quantidade inválida" });
      return;
    }

    const valor = numero(pegar("valor"));
    if (valor === null || valor <= 0) {
      erros.push({ linha: numeroLinha, texto: linha, motivo: "valor inválido" });
      return;
    }

    linhas.push({
      linha: numeroLinha,
      data: data(pegar("data")),
      canal,
      sku,
      quantidade: Math.trunc(quantidade),
      valor,
      comissao: numero(pegar("comissao")),
      frete: numero(pegar("frete")) ?? 0,
      custo: numero(pegar("custo")),
      imposto: numero(pegar("imposto")),
      embalagem: numero(pegar("embalagem")),
      ads: numero(pegar("ads")) ?? 0,
      canalPedidoId: pegar("id") || null,
      cliente: pegar("cliente") || null,
    });
  });

  return { linhas, erros };
}
