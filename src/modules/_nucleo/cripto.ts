import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * Cifra de segredos do painel (certificado A1, credenciais de marketplace).
 *
 * AES-256-GCM com chave de `CONFIG_SECRET_KEY`. Se a env não existir, deriva
 * de `NEXTAUTH_SECRET` — funciona, mas fica registrado nos logs para não
 * descobrir isso no dia em que o segredo mudar e nada mais abrir.
 *
 * Formato do blob: base64(iv[12] + tag[16] + ciphertext)
 */

let avisou = false;

function chave(): Buffer {
  const explicita = process.env.CONFIG_SECRET_KEY;

  if (explicita && explicita.length >= 16) {
    return scryptSync(explicita, "carcrew-config", 32);
  }

  const fallback = process.env.NEXTAUTH_SECRET;
  if (!fallback) {
    throw new Error(
      "Sem CONFIG_SECRET_KEY nem NEXTAUTH_SECRET: não é possível cifrar segredos."
    );
  }

  if (!avisou) {
    console.warn(
      "[cripto] CONFIG_SECRET_KEY ausente — usando NEXTAUTH_SECRET. " +
        "Defina CONFIG_SECRET_KEY para separar as duas coisas."
    );
    avisou = true;
  }

  return scryptSync(fallback, "carcrew-config", 32);
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chave(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, cifrado]).toString("base64");
}

export function decifrar(blob: string): string {
  const bruto = Buffer.from(blob, "base64");
  const iv = bruto.subarray(0, 12);
  const tag = bruto.subarray(12, 28);
  const cifrado = bruto.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", chave(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString("utf8");
}

/** Objeto → JSON cifrado (para credencial de canal). */
export function cifrarObjeto(dados: Record<string, unknown>): string {
  return cifrar(JSON.stringify(dados));
}

export function decifrarObjeto<T = Record<string, unknown>>(blob: string): T {
  return JSON.parse(decifrar(blob)) as T;
}
