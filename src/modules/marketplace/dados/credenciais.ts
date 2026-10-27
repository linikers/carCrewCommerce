import prisma from "@/lib/prisma";
import { cifrarObjeto, decifrarObjeto } from "@/modules/_nucleo/cripto";
import { acharCanal, camposFaltando, situacaoCredencial, type Canal } from "../dominio/canais";

/**
 * Credenciais de marketplace cifradas no banco.
 *
 * A leitura para a tela devolve só a **presença** dos campos secretos
 * (`temAccessToken: true`), nunca o valor. Para autenticar de verdade, use
 * `lerCredencialCompleta` (uso interno, servidor).
 */

const CAMPOS_SECRETOS = new Set(["partnerKey", "clientSecret", "accessToken", "refreshToken"]);

export interface CredencialPublica {
  canal: string;
  campos: Record<string, string | boolean | null>;
  ativo: boolean;
  conectadoEm: Date | null;
  atualizadoEm: Date | null;
  faltando: string[];
  estado: "vazio" | "incompleto" | "vencido" | "ok";
}

export async function listarCredenciais(): Promise<CredencialPublica[]> {
  const registros = await prisma.credencialCanal.findMany();
  const porCanal = new Map(registros.map((r) => [r.canal, r]));

  const saida: CredencialPublica[] = [];

  for (const canal of ["shopee", "mercado_livre"]) {
    const definicao = acharCanal(canal);
    if (!definicao) continue;

    const registro = porCanal.get(canal);
    if (!registro) {
      saida.push({
        canal,
        campos: {},
        ativo: false,
        conectadoEm: null,
        atualizadoEm: null,
        faltando: definicao.campos.filter((c) => c.obrigatorio).map((c) => c.rotulo),
        estado: "vazio",
      });
      continue;
    }

    let dados: Record<string, unknown> = {};
    try {
      dados = decifrarObjeto(registro.dados);
    } catch {
      console.error(`[canais] não foi possível decifrar ${canal}`);
    }

    // devolve tudo que não é segredo; segredo vira booleano
    const campos: CredencialPublica["campos"] = {};
    for (const [chave, valor] of Object.entries(dados)) {
      if (CAMPOS_SECRETOS.has(chave)) {
        campos[`tem_${chave}`] = Boolean(valor);
      } else {
        campos[chave] = valor === null || valor === undefined ? null : String(valor);
      }
    }

    const situacao = situacaoCredencial(definicao, dados as Record<string, unknown>);

    saida.push({
      canal,
      campos,
      ativo: registro.ativo,
      conectadoEm: registro.conectadoEm,
      atualizadoEm: registro.atualizadoEm,
      faltando: situacao.faltando,
      estado: situacao.estado,
    });
  }

  return saida;
}

/** Grava (cifrando). Campo secreto vazio mantém o valor anterior. */
export async function salvarCredencial(
  canalId: string,
  recebidos: Record<string, unknown>
): Promise<{ canal: Canal; faltando: string[] }> {
  const canal = acharCanal(canalId);
  if (!canal) throw new Error(`Canal desconhecido: ${canalId}`);

  const atual = await prisma.credencialCanal.findUnique({ where: { canal: canalId } });

  let anteriores: Record<string, unknown> = {};
  if (atual) {
    try {
      anteriores = decifrarObjeto(atual.dados);
    } catch {
      anteriores = {};
    }
  }

  const dados: Record<string, unknown> = { ...anteriores };

  for (const campo of canal.campos) {
    const recebido = recebidos[campo.chave];

    if (CAMPOS_SECRETOS.has(campo.chave)) {
      // vazio = "não mexer" (o form nunca devolve o segredo)
      if (typeof recebido === "string" && recebido.trim() !== "") {
        dados[campo.chave] = recebido.trim();
      }
      continue;
    }

    if (recebido === undefined) continue;
    dados[campo.chave] = recebido === null ? null : String(recebido).trim();
  }

  const faltando = camposFaltando(canal, dados);

  const dadosCifrados = cifrarObjeto(dados);

  await prisma.credencialCanal.upsert({
    where: { canal: canalId },
    create: {
      canal: canalId,
      dados: dadosCifrados,
      ativo: faltando.length === 0,
      conectadoEm: faltando.length === 0 ? new Date() : null,
    },
    update: {
      dados: dadosCifrados,
      ativo: faltando.length === 0,
      conectadoEm:
        faltando.length === 0 ? atual?.conectadoEm ?? new Date() : atual?.conectadoEm ?? null,
    },
  });

  return { canal, faltando };
}

/** Uso interno (integração): devolve os segredos decifrados. */
export async function lerCredencialCompleta(
  canalId: string
): Promise<Record<string, unknown> | null> {
  const registro = await prisma.credencialCanal.findUnique({ where: { canal: canalId } });
  if (!registro) return null;
  return decifrarObjeto(registro.dados);
}

export async function removerCredencial(canalId: string) {
  await prisma.credencialCanal.deleteMany({ where: { canal: canalId } });
}
