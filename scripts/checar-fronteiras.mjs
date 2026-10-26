#!/usr/bin/env node
/**
 * Checagem de fronteira entre módulos.
 *
 * Regra que não é verificada morre na terceira semana. Este script roda no
 * `npm run checar:fronteiras` e falha (exit 1) se:
 *
 * 1. um módulo importar outro módulo diretamente — o contrato é o registro ou
 *    um evento na tabela `eventos`, nunca import cruzado de implementação
 * 2. `dominio/` importar Next, React ou Prisma — domínio tem que rodar em
 *    qualquer lugar (Vercel, worker, teste), senão a extração futura morre
 * 3. uma rota de `src/app/api/**` usar Prisma na mão — a rota é casca; quem
 *    decide é o módulo
 *
 * Dívida antiga fica em `scripts/fronteiras-baseline.json`: o check falha só
 * em violação NOVA. Cada rota sai da lista quando migra para um módulo.
 *
 * Uso: node scripts/checar-fronteiras.mjs [--aviso]
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = process.cwd();
const MODULOS_DIR = join(RAIZ, "src/modules");
const API_DIR = join(RAIZ, "src/app/api");

const soAviso = process.argv.includes("--aviso");
const problemas = [];

/** Rotas legadas que ainda fazem regra com Prisma na mão. */
const baseline = existsSync(join(RAIZ, "scripts/fronteiras-baseline.json"))
  ? new Set(JSON.parse(readFileSync(join(RAIZ, "scripts/fronteiras-baseline.json"), "utf8")))
  : new Set();

function arquivos(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho));
    else if (/\.(ts|tsx)$/.test(nome)) saida.push(caminho);
  }
  return saida;
}

function importsDe(arquivo) {
  const fonte = readFileSync(arquivo, "utf8");
  const achados = [];
  const regex = /(?:from|import)\s+["']([^"']+)["']/g;
  let m;
  while ((m = regex.exec(fonte))) achados.push(m[1]);
  return achados;
}

// 1 e 2 — dentro de cada módulo (pastas com "_" são núcleo compartilhado)
for (const nomeModulo of readdirSync(MODULOS_DIR)) {
  const dirModulo = join(MODULOS_DIR, nomeModulo);
  if (!statSync(dirModulo).isDirectory()) continue;
  if (nomeModulo.startsWith("_")) continue;

  for (const arquivo of arquivos(dirModulo)) {
    const rel = relative(RAIZ, arquivo);
    const ehDominio = rel.includes(`/${nomeModulo}/dominio/`);

    for (const alvo of importsDe(arquivo)) {
      const cruzado = alvo.match(/^@\/modules\/([^/]+)/);
      if (cruzado && cruzado[1] !== nomeModulo && !cruzado[1].startsWith("_")) {
        problemas.push(`${rel} importa o módulo "${cruzado[1]}" (${alvo})`);
      }

      if (ehDominio && /^(next|react)(\/|$)/.test(alvo)) {
        problemas.push(`${rel} — dominio/ não pode importar "${alvo}"`);
      }
      if (ehDominio && (alvo === "@prisma/client" || alvo === "@/lib/prisma")) {
        problemas.push(`${rel} — dominio/ não pode importar Prisma ("${alvo}")`);
      }
    }
  }
}

// 3 — rotas de API não fazem regra de negócio com Prisma na mão
if (statSync(API_DIR).isDirectory()) {
  for (const arquivo of arquivos(API_DIR)) {
    const rel = relative(RAIZ, arquivo);
    if (importsDe(arquivo).includes("@/lib/prisma") && !baseline.has(rel)) {
      problemas.push(`${rel} usa Prisma direto no route handler`);
    }
  }
}

if (problemas.length === 0) {
  console.log("✓ fronteiras ok — nenhum módulo importa outro, domínio limpo");
  process.exit(0);
}

console.log(`${soAviso ? "⚠" : "✗"} ${problemas.length} problema(s) de fronteira:\n`);
for (const p of problemas) console.log(`  - ${p}`);
if (!soAviso) {
  console.log("\nCorrija antes de mesclar (ou rode com --aviso para só listar).");
  process.exit(1);
}
