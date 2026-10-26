import prisma from "@/lib/prisma";

/**
 * Configuração do convite (popup) de captura de lead.
 *
 * O convite é a peça mais fácil de ligar/desligar sem deploy: em campanha fica
 * ligado, em data comemorativa ou quando o dono acha que está atrapalhando,
 * desliga no painel. Guardado na tabela `configuracoes` (mesma de pagamentos e
 * frete), sem migration nova.
 */

export interface ConfigConvite {
  ativo: boolean;
  /** Segundos de navegação antes de aparecer. */
  atrasoSegundos: number;
}

export const CONVITE_PADRAO: ConfigConvite = { ativo: true, atrasoSegundos: 30 };

const CHAVE = "lead_popup";

export async function lerConfigConvite(): Promise<ConfigConvite> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CHAVE } });
    if (row?.valor) return { ...CONVITE_PADRAO, ...(row.valor as Partial<ConfigConvite>) };
  } catch (e) {
    console.error("[config-convite] falha ao ler:", e);
  }
  return CONVITE_PADRAO;
}

export async function salvarConfigConvite(config: Partial<ConfigConvite>): Promise<ConfigConvite> {
  const atual = await lerConfigConvite();
  const novo: ConfigConvite = {
    ativo: config.ativo ?? atual.ativo,
    atrasoSegundos:
      typeof config.atrasoSegundos === "number" && config.atrasoSegundos >= 5
        ? Math.min(config.atrasoSegundos, 300)
        : atual.atrasoSegundos,
  };

  // Prisma exige objeto "puro" no campo Json
  const valor = { ativo: novo.ativo, atrasoSegundos: novo.atrasoSegundos };

  await prisma.configuracao.upsert({
    where: { chave: CHAVE },
    create: { chave: CHAVE, valor },
    update: { valor },
  });

  return novo;
}
