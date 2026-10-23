import { promises as fs } from "fs";
import path from "path";
import prisma from "@/lib/prisma";

/**
 * Configuração do frete (Melhor Envio) — 7.10.
 *
 * Antes ficava em `src/data/frete.json`, versionado no repositório, com
 * `clientSecret` e `accessToken` em texto puro dentro da árvore do projeto.
 * Consequências: o segredo ia para qualquer cópia/backup/preview, e em
 * serverless o `fs.writeFile` fora de `/tmp` falha — o token não persistia.
 *
 * Agora a fonte é a tabela `configuracoes` (a mesma usada por pagamentos).
 * O arquivo continua sendo lido uma única vez, como migração do que já existe,
 * e nunca é reescrito.
 */

export interface FreteConfig {
  originCep: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string | null;
  packageWeight: number;
  packageHeight: number;
  packageWidth: number;
  packageLength: number;
  markupPercent: number;
  sandbox: boolean;
}

const CHAVE = "frete";
const LEGADO = path.join(process.cwd(), "src/data/frete.json");

export const FRETE_PADRAO: FreteConfig = {
  originCep: "",
  clientId: "",
  clientSecret: "",
  accessToken: "",
  refreshToken: "",
  tokenExpiresAt: null,
  packageWeight: 0.5,
  packageHeight: 2,
  packageWidth: 16,
  packageLength: 18,
  markupPercent: 0,
  sandbox: true,
};

async function lerLegado(): Promise<FreteConfig | null> {
  try {
    const raw = await fs.readFile(LEGADO, "utf-8");
    return { ...FRETE_PADRAO, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export async function readFreteConfig(): Promise<FreteConfig> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CHAVE } });
    if (row?.valor) return { ...FRETE_PADRAO, ...(row.valor as Partial<FreteConfig>) };
  } catch (e) {
    console.error("[frete-config] falha ao ler do banco:", e);
  }

  const legado = await lerLegado();
  return legado ?? FRETE_PADRAO;
}

export async function writeFreteConfig(config: FreteConfig): Promise<void> {
  await prisma.configuracao.upsert({
    where: { chave: CHAVE },
    create: { chave: CHAVE, valor: config as unknown as object },
    update: { valor: config as unknown as object },
  });
}
