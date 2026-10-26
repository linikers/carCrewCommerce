import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/lib/prisma";
import { MODULOS, type IdModulo, dependenciasFaltando } from "./registro";

/**
 * Estado dos módulos (ligado/desligado), guardado na tabela `configuracoes`
 * (chave `modulos`).
 *
 * Por que no banco e não em variável de ambiente: trocar exige deploy. Aqui o
 * dono liga o fiscal no painel e a loja passa a mostrar as telas de nota sem
 * ninguém subir código.
 */

const CHAVE = "modulos";

export type EstadoModulos = Record<string, boolean>;

/** Estado padrão, quando nunca ninguém mexeu. */
export function modulosPadrao(): EstadoModulos {
  const estado: EstadoModulos = {};
  for (const m of MODULOS) estado[m.id] = m.essencial ? true : m.padraoAtivo;
  return estado;
}

export async function lerModulos(): Promise<EstadoModulos> {
  // Sem isto o Next pré-renderiza a página com o estado do momento do build e
  // o desligamento não pega: a rota continuava respondendo 200 e o dono
  // achava que a chave não funcionava. Estado de módulo é sempre request-time.
  noStore();

  const padrao = modulosPadrao();
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CHAVE } });
    if (!row?.valor) return padrao;

    const salvo = row.valor as Record<string, unknown>;
    const estado: EstadoModulos = { ...padrao };

    for (const m of MODULOS) {
      // essencial nunca desliga, mesmo que o banco diga o contrário
      if (m.essencial) {
        estado[m.id] = true;
        continue;
      }
      if (typeof salvo[m.id] === "boolean") estado[m.id] = salvo[m.id] as boolean;
    }
    return estado;
  } catch (e) {
    // Banco fora não pode derrubar a loja: cai no padrão
    console.error("[modulos] falha ao ler estado:", e);
    return padrao;
  }
}

export async function moduloAtivo(id: IdModulo): Promise<boolean> {
  const estado = await lerModulos();
  return estado[id] === true;
}

export class ErroModulo extends Error {
  constructor(
    message: string,
    readonly codigo: "DEPENDENCIA" | "ESSENCIAL" | "DESCONHECIDO" = "DEPENDENCIA"
  ) {
    super(message);
  }
}

/**
 * Salva o estado. Recusa desligar módulo essencial e recusa ligar um módulo
 * sem as dependências — ligar fiscal sem estoque gera nota sem saldo.
 */
export async function salvarModulos(
  pedido: Partial<Record<IdModulo, boolean>>
): Promise<EstadoModulos> {
  const atual = await lerModulos();
  const novo: EstadoModulos = { ...atual };

  for (const [id, valor] of Object.entries(pedido) as [IdModulo, boolean][]) {
    const modulo = MODULOS.find((m) => m.id === id);
    if (!modulo) throw new ErroModulo(`Módulo desconhecido: ${id}`, "DESCONHECIDO");

    if (typeof valor !== "boolean") continue;

    if (modulo.essencial && !valor) {
      throw new ErroModulo(
        `"${modulo.nome}" é essencial: desligar derruba a loja.`,
        "ESSENCIAL"
      );
    }

    if (valor) {
      const faltando = dependenciasFaltando(id, novo);
      if (faltando.length > 0) {
        const nomes = faltando
          .map((d) => MODULOS.find((m) => m.id === d)?.nome ?? d)
          .join(", ");
        throw new ErroModulo(
          `Ligue antes: ${nomes}. "${modulo.nome}" depende disso.`,
          "DEPENDENCIA"
        );
      }
    }

    novo[id] = valor;
  }

  await prisma.configuracao.upsert({
    where: { chave: CHAVE },
    create: { chave: CHAVE, valor: novo },
    update: { valor: novo },
  });

  return novo;
}
