/**
 * Cotação de frete — regra pura, sem Next e sem Prisma.
 *
 * ⚠️ O cálculo aqui é **simulado** (tabela fixa por modalidade). Ele existe
 * para a loja não ficar sem resposta enquanto a cotação real do Melhor Envio
 * não entra — é o que a issue #75 resolve. Enquanto isso, o número que o
 * cliente vê é estimativa, não preço de transportadora.
 *
 * Quando entrar a chamada real, só esta pasta muda: a API e o checkout já
 * conversam com `cotar()`.
 */

export const CEP_ORIGEM = "87033400";

export interface ItemFrete {
  peso: number;
  altura: number;
  largura: number;
  profundidade: number;
  quantidade: number;
}

export interface OpcaoFrete {
  id: string;
  transportadora: string;
  modalidade: string;
  prazo: string;
  valor: number;
  /** true = valor estimado, não cotação de transportadora. */
  estimado: boolean;
  erro?: string;
}

export interface Cotacao {
  cepOrigem: string;
  cepDestino: string;
  pesoTotal: string;
  dimensoes: string;
  opcoes: OpcaoFrete[];
}

export function limparCep(cep: string): string | null {
  const digitos = (cep || "").replace(/\D/g, "");
  return digitos.length === 8 ? digitos : null;
}

/** Tabela simulada — ver aviso no topo do arquivo. */
function valorSimulado(pesoGramas: number, modalidade: string): number {
  const pesoKg = pesoGramas / 1000;
  const base: Record<string, number> = { pac: 15, sedex: 25, express: 35 };
  const porKg: Record<string, number> = { pac: 4.5, sedex: 7, express: 10 };

  const valor = (base[modalidade] || 15) + (porKg[modalidade] || 4.5) * pesoKg;
  return Math.max(valor, 18.9);
}

export function cotar(cepDestino: string, itens: ItemFrete[]): Cotacao | null {
  const cep = limparCep(cepDestino);
  if (!cep || itens.length === 0) return null;

  const pesoTotal = itens.reduce((soma, i) => soma + i.peso * i.quantidade, 0);
  const alturaMax = Math.max(...itens.map((i) => i.altura));
  const larguraMax = Math.max(...itens.map((i) => i.largura));
  const profundidadeTotal = itens.reduce((soma, i) => soma + i.profundidade * i.quantidade, 0);

  const opcoes: OpcaoFrete[] = [
    {
      id: "pac",
      transportadora: "Correios",
      modalidade: "PAC",
      prazo: "8 a 12 dias úteis",
      valor: valorSimulado(pesoTotal, "pac"),
      estimado: true,
    },
    {
      id: "sedex",
      transportadora: "Correios",
      modalidade: "SEDEX",
      prazo: "3 a 5 dias úteis",
      valor: valorSimulado(pesoTotal, "sedex"),
      estimado: true,
    },
    {
      id: "express",
      transportadora: "Jadlog",
      modalidade: "Express",
      prazo: "2 a 4 dias úteis",
      valor: valorSimulado(pesoTotal, "express"),
      estimado: true,
    },
  ];

  return {
    cepOrigem: CEP_ORIGEM,
    cepDestino: cep,
    pesoTotal: `${pesoTotal}g`,
    dimensoes: `${alturaMax}x${larguraMax}x${profundidadeTotal}cm`,
    opcoes,
  };
}
