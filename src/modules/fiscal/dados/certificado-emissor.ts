import prisma from "@/lib/prisma";
import { decifrar } from "@/modules/_nucleo/cripto";

/**
 * Entrega o certificado A1 para o worker do emissor (rota autenticada).
 *
 * Por que existe: o worker precisa do `.pfx` **e da senha** para assinar. Deixar
 * uma cópia solta em disco no servidor é mais um lugar onde o segredo vaza e
 * desatualiza (certificado troca, cópia fica velha). Aqui ele busca na hora, com
 * chave de API, e o uso fica auditado.
 *
 * Nunca exponha isto em rota pública: é a chave de assinatura da empresa.
 */

export interface CertificadoEmissor {
  pfxBase64: string;
  senha: string;
  cnpj: string | null;
  titular: string | null;
  validoAte: string | null;
  nomeArquivo: string | null;
}

export async function lerCertificadoParaEmissor(): Promise<CertificadoEmissor | null> {
  const registro = await prisma.certificadoDigital.findUnique({ where: { id: "unica" } });
  if (!registro?.conteudo) return null;

  let senha = "";
  try {
    senha = registro.senha ? decifrar(registro.senha) : "";
  } catch {
    // senha cifrada com outra chave (CONFIG_SECRET_KEY/NEXTAUTH_SECRET trocado):
    // o emissor não consegue assinar, e quem lê precisa saber disso na hora
    throw new Error(
      "Não foi possível decifrar a senha do certificado — a chave de cifra (CONFIG_SECRET_KEY/NEXTAUTH_SECRET) mudou. Reenvie o certificado pelo painel."
    );
  }

  return {
    pfxBase64: registro.conteudo,
    senha,
    cnpj: registro.cnpj,
    titular: registro.titular,
    validoAte: registro.validoAte ? registro.validoAte.toISOString() : null,
    nomeArquivo: registro.nomeArquivo,
  };
}
