import prisma from "@/lib/prisma";
import {
  CANAIS_VENDA,
  ROTULO_CANAL,
  type CanalVenda,
  type ComissaoCanal,
} from "@/modules/pedidos/dominio/resultado";

/**
 * Custo de vender — comissão por plataforma, imposto, embalagem e taxa de
 * gateway (#191).
 *
 * Fica em `configuracoes` (chave `comissoes` e chave `economia`), sem migration:
 * é número que muda quando o marketplace muda a tabela, e trocar isso não pode
 * exigir deploy.
 *
 * Duas regras que a tela precisa respeitar:
 * 1. **Padrão = 0**, nunca um % inventado. O valor real da comissão é o que vem
 *    no pedido importado; o % daqui serve para simular antes de vender.
 * 2. Campo ausente no banco volta ao padrão **campo a campo** — ligar um campo
 *    novo no código não pode zerar o que já estava salvo.
 */

export { CANAIS_VENDA, ROTULO_CANAL, type CanalVenda, type ComissaoCanal };

export const COMISSOES_PADRAO: Record<CanalVenda, ComissaoCanal> = {
  site: { percentual: 0, fixo: 0 },
  mercado_livre: { percentual: 0, fixo: 0 },
  shopee: { percentual: 0, fixo: 0 },
  manual: { percentual: 0, fixo: 0 },
};

export interface Economia {
  /** alíquota efetiva do imposto sobre a venda, em % (0 = não informado) */
  impostoPercent: number;
  /** de onde veio a alíquota — texto livre para o contador conferir depois */
  impostoObs: string;
  /** custo médio de embalagem por venda, em R$ */
  embalagemPadrao: number;
  /** taxa do gateway nas vendas do site (PIX/cartão), em % */
  taxaGatewayPercent: number;
}

export const ECONOMIA_PADRAO: Economia = {
  impostoPercent: 0,
  impostoObs: "",
  embalagemPadrao: 0,
  taxaGatewayPercent: 0,
};

const CHAVE_COMISSOES = "comissoes";
const CHAVE_ECONOMIA = "economia";

export function limitar(valor: unknown, min: number, max: number): number {
  const n = Number(valor);
  if (!Number.isFinite(n)) return min;
  const dentro = Math.min(max, Math.max(min, n));
  return Math.round(dentro * 100) / 100;
}

/** Normaliza o que veio da tela. Entrada de painel é dado de usuário. */
export function normalizarComissoes(bruto: unknown): Record<CanalVenda, ComissaoCanal> {
  const entrada = (bruto ?? {}) as Record<string, Partial<ComissaoCanal>>;
  const saida = {} as Record<CanalVenda, ComissaoCanal>;
  for (const canal of CANAIS_VENDA) {
    const c = entrada[canal] ?? {};
    saida[canal] = {
      // 0–60%: acima disso não é comissão de marketplace, é erro de digitação
      percentual: limitar(c.percentual, 0, 60),
      // fixo limitado a R$ 200 por item — teto de sanidade, não regra de negócio
      fixo: limitar(c.fixo, 0, 200),
    };
  }
  return saida;
}

export function normalizarEconomia(bruto: unknown): Economia {
  const entrada = (bruto ?? {}) as Partial<Economia>;
  return {
    impostoPercent: limitar(entrada.impostoPercent, 0, 100),
    impostoObs: String(entrada.impostoObs ?? "").slice(0, 200),
    embalagemPadrao: limitar(entrada.embalagemPadrao, 0, 500),
    taxaGatewayPercent: limitar(entrada.taxaGatewayPercent, 0, 20),
  };
}

async function lerChave(chave: string): Promise<unknown> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave } });
    return row?.valor ?? null;
  } catch (e) {
    // banco fora não pode derrubar o checkout: volta o padrão
    console.error(`[economia] falha ao ler ${chave}:`, e);
    return null;
  }
}

export async function lerComissoes(): Promise<Record<CanalVenda, ComissaoCanal>> {
  const salvo = await lerChave(CHAVE_COMISSOES);
  return normalizarComissoes({ ...COMISSOES_PADRAO, ...(salvo as object) });
}

export async function lerEconomia(): Promise<Economia> {
  const salvo = await lerChave(CHAVE_ECONOMIA);
  return normalizarEconomia({ ...ECONOMIA_PADRAO, ...(salvo as object) });
}

/**
 * Objeto literal montado na mão: o `valor` de `configuracoes` é Json e o Prisma
 * recusa `interface`/`Record` nomeado ("index signature is missing"). Montar
 * campo a campo resolve o tipo e deixa explícito o que está indo para o banco.
 */
function paraJsonComissoes(c: Record<CanalVenda, ComissaoCanal>) {
  return {
    site: { percentual: c.site.percentual, fixo: c.site.fixo },
    mercado_livre: { percentual: c.mercado_livre.percentual, fixo: c.mercado_livre.fixo },
    shopee: { percentual: c.shopee.percentual, fixo: c.shopee.fixo },
    manual: { percentual: c.manual.percentual, fixo: c.manual.fixo },
  };
}

function paraJsonEconomia(e: Economia) {
  return {
    impostoPercent: e.impostoPercent,
    impostoObs: e.impostoObs,
    embalagemPadrao: e.embalagemPadrao,
    taxaGatewayPercent: e.taxaGatewayPercent,
  };
}

export async function salvarComissoes(bruto: unknown): Promise<Record<CanalVenda, ComissaoCanal>> {
  const comissoes = normalizarComissoes(bruto);
  const valor = paraJsonComissoes(comissoes);
  await prisma.configuracao.upsert({
    where: { chave: CHAVE_COMISSOES },
    update: { valor },
    create: { chave: CHAVE_COMISSOES, valor },
  });
  return comissoes;
}

export async function salvarEconomia(bruto: unknown): Promise<Economia> {
  const economia = normalizarEconomia(bruto);
  const valor = paraJsonEconomia(economia);
  await prisma.configuracao.upsert({
    where: { chave: CHAVE_ECONOMIA },
    update: { valor },
    create: { chave: CHAVE_ECONOMIA, valor },
  });
  return economia;
}
