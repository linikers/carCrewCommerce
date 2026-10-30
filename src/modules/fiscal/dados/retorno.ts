import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";

/**
 * Retorno do emissor e chave de API.
 *
 * Quem emite pode ser um sistema (devolve por API) ou uma pessoa (contador
 * manda o número no WhatsApp). Os dois caminhos terminam na MESMA escrita:
 * `registrarRetorno`. Duas rotinas gravando "autorizada" divergem na primeira
 * vez que alguém esquece um campo.
 *
 * A chave de API é guardada como hash — não existe "ver a chave de novo", só
 * gerar outra. Isso evita que um vazamento do banco vire acesso ao endpoint.
 */

const CHAVE_CONFIG = "fiscal_api";

export interface ChaveApi {
  prefixo: string;
  criadaEm: string;
  ultimoUso: string | null;
}

interface ChaveSalva {
  hash: string;
  prefixo: string;
  criadaEm: string;
  ultimoUso: string | null;
}

function hashDe(chave: string): string {
  return createHash("sha256").update(chave).digest("hex");
}

async function lerSalva(): Promise<ChaveSalva | null> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CHAVE_CONFIG } });
    return (row?.valor as unknown as ChaveSalva) ?? null;
  } catch {
    return null;
  }
}

/** Status da chave para a tela. Nunca devolve o valor. */
export async function statusChave(): Promise<ChaveApi | null> {
  const salva = await lerSalva();
  if (!salva) return null;
  return { prefixo: salva.prefixo, criadaEm: salva.criadaEm, ultimoUso: salva.ultimoUso };
}

/** Cria (ou substitui) a chave. O valor em texto volta UMA vez. */
export async function criarChave(): Promise<{ chave: string; prefixo: string }> {
  const chave = `cc_${randomBytes(24).toString("hex")}`;
  const prefixo = chave.slice(0, 11);
  const salva: ChaveSalva = {
    hash: hashDe(chave),
    prefixo,
    criadaEm: new Date().toISOString(),
    ultimoUso: null,
  };

  const valor = { hash: salva.hash, prefixo: salva.prefixo, criadaEm: salva.criadaEm, ultimoUso: null };
  await prisma.configuracao.upsert({
    where: { chave: CHAVE_CONFIG },
    update: { valor },
    create: { chave: CHAVE_CONFIG, valor },
  });

  return { chave, prefixo };
}

export async function revogarChave(): Promise<void> {
  await prisma.configuracao.deleteMany({ where: { chave: CHAVE_CONFIG } });
}

/** Valida o Bearer e registra o último uso. */
export async function validarChave(cabecalho: string | null): Promise<boolean> {
  const salva = await lerSalva();
  if (!salva) return false;

  const token = String(cabecalho ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  if (hashDe(token) !== salva.hash) return false;

  await prisma.configuracao
    .update({
      where: { chave: CHAVE_CONFIG },
      data: { valor: { ...salva, ultimoUso: new Date().toISOString() } },
    })
    .catch(() => undefined);

  return true;
}

export interface RetornoEntrada {
  pedidoId: string;
  status: "autorizada" | "rejeitada" | "cancelada";
  numero?: string | null;
  serie?: string | null;
  chave?: string | null;
  motivo?: string | null;
}

export interface RetornoResultado {
  aplicado: boolean;
  jaEstava: boolean;
  status: string;
  numero: string | null;
}

/**
 * Grava o retorno do emissor na nota.
 *
 * Idempotente: repetir o mesmo retorno (mesmo status e mesmo número) responde
 * sem regravar nem auditar de novo — reenvio de webhook é rotina.
 */
export async function registrarRetorno(entrada: RetornoEntrada): Promise<RetornoResultado> {
  const nota = await prisma.notaFiscal.findUnique({ where: { pedidoId: entrada.pedidoId } });
  if (!nota) throw new Error("Pedido não está na fila de notas");

  const mesmoStatus = nota.status === entrada.status;
  const mesmoNumero = (nota.numero ?? null) === (entrada.numero ?? null);
  if (mesmoStatus && mesmoNumero && entrada.status !== "rejeitada") {
    return { aplicado: false, jaEstava: true, status: nota.status, numero: nota.numero };
  }

  const agora = new Date();
  const atualizada = await prisma.notaFiscal.update({
    where: { pedidoId: entrada.pedidoId },
    data: {
      status: entrada.status,
      numero: entrada.numero ?? nota.numero,
      serie: entrada.serie ?? nota.serie,
      chave: entrada.chave ?? nota.chave,
      motivo: entrada.status === "rejeitada" ? (entrada.motivo ?? "rejeitada sem motivo informado") : null,
      ...(entrada.status === "autorizada" ? { autorizadaEm: agora } : {}),
    },
  });

  return { aplicado: true, jaEstava: false, status: atualizada.status, numero: atualizada.numero };
}

/** Volta a nota rejeitada para a fila, depois de corrigir o dado. */
export async function reabrirNota(pedidoId: string): Promise<void> {
  await prisma.notaFiscal.update({
    where: { pedidoId },
    data: { status: "pronta", motivo: null },
  });
}
