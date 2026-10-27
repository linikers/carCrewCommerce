import forge from "node-forge";
import { cifrar, decifrar } from "./cripto";

/**
 * Certificado A1 (.pfx/.p12) — leitura e guarda cifrada.
 *
 * O arquivo e a senha vão para o banco **cifrados**; o parse serve para
 * conferir se a senha abre o arquivo e para ler titular, CNPJ e validade.
 * Sem esse parse, o dono só descobriria que a senha está errada no dia da
 * primeira nota.
 */

export interface CertificadoLido {
  titular: string | null;
  cnpj: string | null;
  emissor: string | null;
  validoDe: Date | null;
  validoAte: Date | null;
}

/** Lê um .pfx com a senha e devolve os dados do titular. */
export function lerCertificado(pfx: Buffer, senha: string): CertificadoLido {
  let p12: forge.pkcs12.Pkcs12Pfx;

  try {
    const der = forge.util.createBuffer(pfx.toString("binary"));
    const asn1 = forge.asn1.fromDer(der);
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, senha);
  } catch {
    throw new Error(
      "Não foi possível abrir o certificado. Confira se é um .pfx/.p12 e se a senha está correta."
    );
  }

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  // `getBags` devolve arrays por bagType; a tipagem do forge é frouxa
  const certificados: forge.pki.Certificate[] = [];
  const listas = Object.values(certBags) as unknown as Array<Array<{ cert?: forge.pki.Certificate }>>;
  for (const lista of listas) {
    for (const bag of lista ?? []) {
      if (bag?.cert) certificados.push(bag.cert);
    }
  }

  if (certificados.length === 0) {
    throw new Error("O arquivo não tem certificado dentro.");
  }

  // o certificado da empresa é o que tem e-mail/CNPJ; o da cadeia é a CA
  const titular =
    certificados.find((c) => c.subject.getField("CN")) ?? certificados[0];

  const pegar = (campo: string): string | null => {
    const valor = titular.subject.getField(campo);
    return valor ? String(valor.value) : null;
  };

  // CNPJ costuma vir no OU (14 dígitos) ou no CN (razão social: CNPJ)
  const texto = `${pegar("CN") ?? ""} ${pegar("OU") ?? ""} ${pegar("O") ?? ""}`;
  const cnpj = (texto.match(/\d{14}/) || [])[0] ?? null;

  return {
    titular: pegar("CN"),
    cnpj,
    emissor: titular.issuer.getField("CN")?.value
      ? String(titular.issuer.getField("CN")!.value)
      : null,
    validoDe: titular.validity?.notBefore ?? null,
    validoAte: titular.validity?.notAfter ?? null,
  };
}

export interface CertificadoGuardado extends CertificadoLido {
  nomeArquivo: string;
  conteudoCifrado: string;
  senhaCifrada: string;
}

/** Prepara o certificado para gravar: valida a senha e cifra tudo. */
export function prepararCertificado(
  nomeArquivo: string,
  pfx: Buffer,
  senha: string
): CertificadoGuardado {
  const dados = lerCertificado(pfx, senha);

  return {
    nomeArquivo,
    ...dados,
    conteudoCifrado: cifrar(pfx.toString("base64")),
    senhaCifrada: cifrar(senha),
  };
}

/** Devolve o .pfx em bytes e a senha para o emissor do #79 usar. */
export function abrirCertificado(conteudoCifrado: string, senhaCifrada: string) {
  return {
    pfx: Buffer.from(decifrar(conteudoCifrado), "base64"),
    senha: decifrar(senhaCifrada),
  };
}

/** Dias até vencer (negativo = vencido). */
export function diasParaVencer(validoAte: Date | string | null): number | null {
  if (!validoAte) return null;
  const alvo = new Date(validoAte).getTime();
  return Math.floor((alvo - Date.now()) / (24 * 60 * 60 * 1000));
}
