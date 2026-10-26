/**
 * Regras do pedido — domínio puro (#72).
 *
 * Sem Next, sem Prisma: dá para testar e, um dia, mover para outro processo
 * sem tocar em nada daqui.
 */

export interface ItemEntrada {
  produtoId: number;
  quantidade: number;
}

export interface ItemPedido {
  produtoId: number;
  nome: string;
  sku: string | null;
  preco: number;
  quantidade: number;
  total: number;
}

export interface EnderecoEntrega {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}

export interface DadosPedido {
  itens: ItemPedido[];
  total: number;
  frete: number;
  status: string;
  clienteNome: string | null;
  clienteTelefone: string | null;
  clienteEmail: string | null;
  clienteDocumento: string | null;
  enderecoEntrega: EnderecoEntrega | null;
}

export class ErroPedido extends Error {
  constructor(
    message: string,
    readonly codigo: "ITEM_INVALIDO" | "SEM_ITENS" | "ESTOQUE" | "PRODUTO" = "ITEM_INVALIDO"
  ) {
    super(message);
  }
}

/** Normaliza o carrinho que vem do cliente: quantidade inteira positiva. */
export function normalizarItens(bruto: unknown): ItemEntrada[] {
  if (!Array.isArray(bruto)) return [];

  const itens: ItemEntrada[] = [];
  for (const entrada of bruto) {
    const produtoId = Number(
      (entrada as { produto?: { id?: unknown }; produtoId?: unknown })?.produto?.id ??
        (entrada as { produtoId?: unknown })?.produtoId
    );
    const quantidade = Math.floor(
      Number((entrada as { quantidade?: unknown })?.quantidade ?? 0)
    );

    if (!Number.isFinite(produtoId) || produtoId <= 0) {
      throw new ErroPedido("Item sem produto válido", "ITEM_INVALIDO");
    }
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      throw new ErroPedido("Quantidade inválida no carrinho", "ITEM_INVALIDO");
    }
    itens.push({ produtoId, quantidade });
  }

  return itens;
}

export function totalDosItens(itens: ItemPedido[]): number {
  return Number(itens.reduce((soma, i) => soma + i.total, 0).toFixed(2));
}

/** CPF/CNPJ só com dígitos — nota fiscal não aceita pontuação. */
export function normalizarDocumento(doc: unknown): string | null {
  if (!doc) return null;
  const digitos = String(doc).replace(/\D/g, "");
  return digitos.length >= 11 ? digitos : null;
}

export function montarEndereco(form: Record<string, unknown> | null | undefined): EnderecoEntrega | null {
  if (!form) return null;
  const texto = (v: unknown) => (v ? String(v).trim() || null : null);
  const endereco: EnderecoEntrega = {
    cep: texto(form.cep),
    logradouro: texto(form.endereco),
    numero: texto(form.numero),
    bairro: texto(form.bairro),
    cidade: texto(form.cidade),
    uf: texto(form.uf),
  };
  // sem nenhum campo preenchido, não grava objeto vazio
  return Object.values(endereco).some(Boolean) ? endereco : null;
}
