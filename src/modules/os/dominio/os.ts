/**
 * Regras da ordem de serviço — domínio puro (#80).
 *
 * A oficina trabalha em etapas: chega o carro, faz diagnóstico, manda orçamento,
 * o cliente aprova, executa, entrega. O status é esse caminho — e cada passo
 * tem uma consequência (baixa de peça na execução, por exemplo).
 */

export const STATUS_OS = [
  "aberta",
  "orcamento",
  "aprovada",
  "aguardando_peca",
  "execucao",
  "concluida",
  "entregue",
  "cancelada",
] as const;

export type StatusOS = (typeof STATUS_OS)[number];

export const STATUS_OS_LABEL: Record<StatusOS, string> = {
  aberta: "Aberta",
  orcamento: "Orçamento enviado",
  aprovada: "Aprovada pelo cliente",
  aguardando_peca: "Aguardando peça",
  execucao: "Em execução",
  concluida: "Concluída",
  entregue: "Entregue",
  cancelada: "Cancelada",
};

export const STATUS_OS_COR: Record<StatusOS, "default" | "info" | "warning" | "primary" | "success" | "error"> = {
  aberta: "default",
  orcamento: "info",
  aprovada: "warning",
  aguardando_peca: "info",
  execucao: "primary",
  concluida: "success",
  entregue: "success",
  cancelada: "error",
};

export const TIPO_ITEM_LABEL: Record<"peca" | "servico" | "terceiro", string> = {
  peca: "Peça",
  servico: "Serviço",
  terceiro: "Serviço de terceiro",
};

/** De onde veio a peça. `catalogo` baixa estoque; `externa` não. */
export const ORIGEM_PECA_LABEL: Record<"catalogo" | "externa", string> = {
  catalogo: "Do catálogo",
  externa: "Comprada fora",
};

export interface ItemOS {
  tipo: "peca" | "servico" | "terceiro";
  descricao: string;
  produtoId?: number | null;
  origem?: "catalogo" | "externa" | null;
  /** custo do item (peça comprada fora / terceiro) */
  custo?: number | null;
  terceiro?: string | null;
  quantidade: number;
  valorUnit: number;
}

/** Item do catálogo é o único que mexe em estoque. */
export function baixaEstoque(item: Pick<ItemOS, "tipo" | "origem" | "produtoId">): boolean {
  return item.tipo === "peca" && item.origem === "catalogo" && !!item.produtoId;
}

export class ErroOS extends Error {
  constructor(message: string, readonly codigo: "DADOS" | "STATUS" | "ITEM" = "DADOS") {
    super(message);
  }
}

/** Totais por tipo — peça e serviço separados, porque margem é diferente. */
export function calcularTotais(itens: ItemOS[]) {
  let totalPecas = 0;
  let totalServicos = 0;

  for (const item of itens) {
    const total = Number((item.quantidade * item.valorUnit).toFixed(2));
    if (item.tipo === "peca") totalPecas += total;
    else totalServicos += total;
  }

  totalPecas = Number(totalPecas.toFixed(2));
  totalServicos = Number(totalServicos.toFixed(2));

  return {
    totalPecas,
    totalServicos,
    total: Number((totalPecas + totalServicos).toFixed(2)),
  };
}

/** Próximo status possível: nada de pular de "aberta" para "entregue". */
const TRANSICOES: Record<StatusOS, StatusOS[]> = {
  aberta: ["orcamento", "aprovada", "cancelada"],
  orcamento: ["aprovada", "aberta", "cancelada"],
  aprovada: ["aguardando_peca", "execucao", "orcamento", "cancelada"],
  aguardando_peca: ["execucao", "aprovada", "cancelada"],
  execucao: ["concluida", "cancelada"],
  concluida: ["entregue", "execucao"],
  // reabrir só para corrigir: voltar de "entregue" para "concluída" não mexe
  // em estoque (a baixa aconteceu na venda, não no status)
  entregue: ["concluida"],
  cancelada: [],
};

export function podeMudarStatus(atual: string, novo: string): boolean {
  const de = atual as StatusOS;
  const para = novo as StatusOS;
  if (!TRANSICOES[de] || !STATUS_OS.includes(para)) return false;
  return TRANSICOES[de].includes(para);
}

export function validarNovaOS(dados: {
  clienteNome?: string;
  veiculo?: string;
  descricaoProblema?: string;
}): void {
  if (!dados.clienteNome?.trim()) throw new ErroOS("Informe o nome do cliente");
  if (!dados.veiculo?.trim()) throw new ErroOS("Informe o veículo (modelo/ano)");
  if (!dados.descricaoProblema?.trim()) {
    throw new ErroOS("Descreva o problema relatado — é o que o mecânico lê na bancada");
  }
}

export function validarItem(item: ItemOS): void {
  if (!item.descricao?.trim()) throw new ErroOS("Descrição do item é obrigatória", "ITEM");
  if (!["peca", "servico", "terceiro"].includes(item.tipo)) {
    throw new ErroOS("Tipo do item inválido", "ITEM");
  }
  if (item.tipo === "peca" && item.origem === "catalogo" && !item.produtoId) {
    throw new ErroOS("Peça do catálogo precisa estar vinculada a um produto", "ITEM");
  }
  if (!Number.isFinite(item.quantidade) || item.quantidade <= 0) {
    throw new ErroOS("Quantidade inválida", "ITEM");
  }
  if (!Number.isFinite(item.valorUnit) || item.valorUnit < 0) {
    throw new ErroOS("Valor inválido", "ITEM");
  }
}
