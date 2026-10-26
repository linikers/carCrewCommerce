import prisma from "@/lib/prisma";
import {
  pendenciasDoProduto,
  POLITICA_PADRAO,
  type PendenciaProduto,
  type PoliticaEmissao,
} from "../dominio/fiscal";

/**
 * Persistência do cadastro fiscal (#78) e da política de emissão.
 *
 * A política mora em `configuracoes` (chave `fiscal`) para poder ser trocada no
 * painel sem deploy — mesma decisão do convite de lead e do frete.
 */

const CHAVE_POLITICA = "fiscal";
const ID_EMPRESA = "unica";

export interface EmpresaFiscalDados {
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  ie: string | null;
  im: string | null;
  crt: number;
  cnae: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  email: string | null;
  ambiente: "homologacao" | "producao";
  serie: number;
  proximoNumero: number;
  certificadoNome: string | null;
  certificadoValidade: Date | null;
}

export async function lerEmpresa() {
  return prisma.empresaFiscal.findUnique({ where: { id: ID_EMPRESA } });
}

export async function salvarEmpresa(dados: Partial<EmpresaFiscalDados>) {
  const atual = await lerEmpresa();

  const payload = {
    razaoSocial: (dados.razaoSocial ?? atual?.razaoSocial ?? "").trim(),
    nomeFantasia: dados.nomeFantasia ?? atual?.nomeFantasia ?? null,
    cnpj: (dados.cnpj ?? atual?.cnpj ?? "").replace(/\D/g, ""),
    ie: dados.ie ?? atual?.ie ?? null,
    im: dados.im ?? atual?.im ?? null,
    crt: dados.crt ?? atual?.crt ?? 1,
    cnae: dados.cnae ?? atual?.cnae ?? null,
    cep: dados.cep ?? atual?.cep ?? null,
    logradouro: dados.logradouro ?? atual?.logradouro ?? null,
    numero: dados.numero ?? atual?.numero ?? null,
    complemento: dados.complemento ?? atual?.complemento ?? null,
    bairro: dados.bairro ?? atual?.bairro ?? null,
    cidade: dados.cidade ?? atual?.cidade ?? null,
    uf: dados.uf ?? atual?.uf ?? null,
    telefone: dados.telefone ?? atual?.telefone ?? null,
    email: dados.email ?? atual?.email ?? null,
    ambiente: dados.ambiente ?? atual?.ambiente ?? "homologacao",
    serie: dados.serie ?? atual?.serie ?? 1,
    proximoNumero: dados.proximoNumero ?? atual?.proximoNumero ?? 1,
    certificadoNome: dados.certificadoNome ?? atual?.certificadoNome ?? null,
    certificadoValidade: dados.certificadoValidade ?? atual?.certificadoValidade ?? null,
  };

  return prisma.empresaFiscal.upsert({
    where: { id: ID_EMPRESA },
    create: { id: ID_EMPRESA, ...payload },
    update: payload,
  });
}

export async function lerPolitica(): Promise<PoliticaEmissao> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CHAVE_POLITICA } });
    if (row?.valor) {
      const salvo = row.valor as Partial<PoliticaEmissao>;
      return { ...POLITICA_PADRAO, ...salvo };
    }
  } catch (e) {
    console.error("[fiscal] falha ao ler política:", e);
  }
  return POLITICA_PADRAO;
}

export async function salvarPolitica(pedido: Partial<PoliticaEmissao>): Promise<PoliticaEmissao> {
  const atual = await lerPolitica();
  const nova: PoliticaEmissao = {
    emitirSite: pedido.emitirSite ?? atual.emitirSite,
    emitirMarketplace: pedido.emitirMarketplace ?? atual.emitirMarketplace,
    emitirPdv: pedido.emitirPdv ?? atual.emitirPdv,
    ambiente: pedido.ambiente ?? atual.ambiente,
    momento: pedido.momento ?? atual.momento,
  };

  // Prisma exige objeto "puro" no campo Json
  const valor = {
    emitirSite: nova.emitirSite,
    emitirMarketplace: nova.emitirMarketplace,
    emitirPdv: nova.emitirPdv,
    ambiente: nova.ambiente,
    momento: nova.momento,
  };

  await prisma.configuracao.upsert({
    where: { chave: CHAVE_POLITICA },
    create: { chave: CHAVE_POLITICA, valor },
    update: { valor },
  });

  return nova;
}

/** Peças que não podem entrar numa nota por falta de campo fiscal. */
export async function listarPendencias(): Promise<PendenciaProduto[]> {
  const produtos = await prisma.produto.findMany({
    select: {
      id: true,
      nome: true,
      sku: true,
      ncm: true,
      cfop: true,
      cstIcms: true,
      unidade: true,
      origem: true,
      ativo: true,
    },
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return produtos
    .map((p) => ({
      produtoId: p.id,
      nome: p.nome,
      sku: p.sku,
      faltando: pendenciasDoProduto(p),
    }))
    .filter((p) => p.faltando.length > 0);
}
