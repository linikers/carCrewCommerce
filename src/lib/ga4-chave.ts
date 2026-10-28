import { createPrivateKey } from "node:crypto";

/**
 * Normaliza a chave do service account do Google para PKCS#8.
 *
 * O `importPKCS8` do jose só aceita `-----BEGIN PRIVATE KEY-----`. Na prática
 * aparecem três formatos:
 *
 * 1. PKCS#8 — o certo, sai do JSON do service account.
 * 2. PKCS#1 (`BEGIN RSA PRIVATE KEY`) — chave gerada por `openssl genrsa` ou
 *    service account antigo; converte com o próprio Node.
 * 3. Só o base64, sem cabeçalho — veio colado de um JSON com `\n` literal.
 *
 * Sem isso o painel mostrava `"pkcs8" must be PKCS#8 formatted string`, que não
 * diz nada a quem está tentando configurar o Analytics.
 */
export function normalizarChavePkcs8(bruta?: string | null): string | null {
  if (!bruta) return null;

  let pem = bruta.trim().replace(/\\n/g, "\n");
  if (pem.startsWith('"') && pem.endsWith('"')) pem = pem.slice(1, -1);

  if (pem.includes("BEGIN PRIVATE KEY")) return pem;

  if (pem.includes("BEGIN RSA PRIVATE KEY")) {
    return String(createPrivateKey(pem).export({ type: "pkcs8", format: "pem" }));
  }

  if (pem.includes("BEGIN")) {
    throw new Error("GA4_KEY_FORMATO");
  }

  const corpo = pem.replace(/\s+/g, "");
  if (!corpo) return null;
  const linhas = corpo.match(/.{1,64}/g)?.join("\n") ?? corpo;
  return `-----BEGIN PRIVATE KEY-----\n${linhas}\n-----END PRIVATE KEY-----\n`;
}
