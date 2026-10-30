import prisma from "@/lib/prisma";

/**
 * Pacote de emissão (interface do emissor).
 *
 * Monta o que o emissor do cliente precisa para emitir: emitente, destinatário,
 * itens com NCM/CFOP/CSOSN **do momento da venda** e totais.
 *
 * Duas saídas do MESMO objeto (JSON e CSV) — duas construções separadas divergem
 * no terceiro dia. Exportar marca as notas como `exportada` (idempotente: quem
 * já saiu não volta para a fila).
 */

const cacheIbge = new Map<string, string | null>();

/** Código IBGE do município a partir do CEP (Brasil API). null = não resolveu. */
export async function ibgePorCep(cep: string | null | undefined): Promise<string | null> {
  const limpo = String(cep ?? "").replace(/\D/g, "");
  if (limpo.length !== 8) return null;
  if (cacheIbge.has(limpo)) return cacheIbge.get(limpo) ?? null;

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${limpo}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      cacheIbge.set(limpo, null);
      return null;
    }
    const dados = (await res.json()) as { city?: string; state?: string; ibge?: string };
    const ibge = dados.ibge ? String(dados.ibge).replace(/\D/g, "").slice(0, 7) : null;
    cacheIbge.set(limpo, ibge && ibge.length === 7 ? ibge : null);
    return cacheIbge.get(limpo) ?? null;
  } catch {
    cacheIbge.set(limpo, null);
    return null;
  }
}

/** CPF (11) ou CNPJ (14) a partir do documento sem máscara. */
export function tipoDocumento(documento: string | null | undefined): "cpf" | "cnpj" | null {
  const digitos = String(documento ?? "").replace(/\D/g, "");
  if (digitos.length === 11) return "cpf";
  if (digitos.length === 14) return "cnpj";
  return null;
}

export interface ItemPacote {
  sku: string | null;
  nome: string;
  ncm: string | null;
  cfop: string | null;
  cst: string | null;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface NotaPacote {
  pedidoId: string;
  canal: string;
  vendaEm: string;
  emitente: {
    cnpj: string;
    ie: string | null;
    im?: string | null;
    crt: number;
    razaoSocial: string;
    nomeFantasia?: string | null;
    cnae?: string | null;
    uf: string | null;
    serie: number;
    telefone?: string | null;
    email?: string | null;
    endereco: {
      logradouro: string | null;
      numero: string | null;
      complemento?: string | null;
      bairro: string | null;
      cidade: string | null;
      cep: string | null;
      codigoMunicipio: string | null;
    };
  };
  destinatario: {
    nome: string | null;
    documento: string | null;
    email: string | null;
    endereco: {
      logradouro: string | null;
      numero: string | null;
      bairro: string | null;
      cidade: string | null;
      uf: string | null;
      cep: string | null;
      /** IBGE de 7 dígitos — exigido pelo emissor */
      codigoMunicipio: string | null;
    };
    /** cpf | cnpj | null (o emissor separa os campos) */
    tipoDocumento: "cpf" | "cnpj" | null;
  };
  itens: ItemPacote[];
  frete: number;
  total: number;
  observacoes: string;
  // campos do leiaute que o emissor precisa e o site sabe decidir
  modelo: "55" | "65";
  naturezaOperacao: string;
  destinoOperacao: "1" | "2" | "3";
  indicadorPresenca: "1" | "2" | "9";
  modalidadeFrete: string;
  pagamento: { forma: string; valor: number };
}

interface Endereco {
  codigoMunicipio?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
}

/**
 * Monta o pacote das notas selecionadas.
 *
 * `somenteProntas` (padrão) pega o que está apto a emitir; `incluirPendentes`
 * serve para o dono exportar tudo e conferir no emissor o que falta.
 */
export async function montarPacote(opcoes: {
  de: Date;
  ate: Date;
  canal?: string | null;
  incluirPendentes?: boolean;
}): Promise<NotaPacote[]> {
  const empresa = await prisma.empresaFiscal.findFirst();

  // IBGE do emitente: o leiaute exige cMunFG de 7 dígitos e não aceita cidade
  // em texto; resolve pelo CEP do cadastro quando não estiver gravado
  const ibgeEmitente = empresa?.cep ? await ibgePorCep(empresa.cep) : null;

  const notas = await prisma.notaFiscal.findMany({
    where: {
      ...(opcoes.canal ? { canal: opcoes.canal } : {}),
      status: opcoes.incluirPendentes ? { in: ["pronta", "pendente"] } : "pronta",
      criadoEm: { gte: opcoes.de, lte: opcoes.ate },
    },
    include: {
      pedido: { include: { itens: { orderBy: { criadoEm: "asc" } } } },
    },
    orderBy: { criadoEm: "asc" },
  });

  return Promise.all(notas.map(async (nota) => {
    const endereco = (nota.pedido.enderecoEntrega ?? {}) as Endereco;
    const ufDestino = endereco.uf ?? null;
    const ufEmitente = empresa?.uf ?? null;
    // IBGE: usa o que já está gravado; se faltar, resolve pelo CEP
    const ibge = endereco.codigoMunicipio ?? (await ibgePorCep(endereco.cep));
    const frete = nota.pedido.frete ?? 0;

    return {
      pedidoId: nota.pedidoId,
      canal: nota.canal,
      vendaEm: (nota.pedido.vendaEm ?? nota.pedido.createdAt).toISOString().slice(0, 10),
      emitente: {
        cnpj: empresa?.cnpj ?? "",
        ie: empresa?.ie ?? null,
        im: empresa?.im ?? null,
        crt: empresa?.crt ?? 1,
        razaoSocial: empresa?.razaoSocial ?? "",
        nomeFantasia: empresa?.nomeFantasia ?? null,
        cnae: empresa?.cnae ?? null,
        uf: empresa?.uf ?? null,
        serie: empresa?.serie ?? 1,
        telefone: empresa?.telefone ?? null,
        email: empresa?.email ?? null,
        endereco: {
          logradouro: empresa?.logradouro ?? null,
          numero: empresa?.numero ?? null,
          complemento: empresa?.complemento ?? null,
          bairro: empresa?.bairro ?? null,
          cidade: empresa?.cidade ?? null,
          cep: empresa?.cep ?? null,
          codigoMunicipio: ibgeEmitente,
        },
      },
      destinatario: {
        nome: nota.pedido.clienteNome,
        documento: nota.pedido.clienteDocumento,
        email: nota.pedido.clienteEmail,
        endereco: {
          logradouro: endereco.logradouro ?? null,
          numero: endereco.numero ?? null,
          bairro: endereco.bairro ?? null,
          cidade: endereco.cidade ?? null,
          uf: ufDestino,
          cep: endereco.cep ?? null,
          codigoMunicipio: ibge,
        },
        tipoDocumento: tipoDocumento(nota.pedido.clienteDocumento),
      },
      itens: nota.pedido.itens.map((i) => ({
        sku: i.sku,
        nome: i.nome,
        ncm: i.ncm,
        cfop: i.cfop,
        cst: i.cstCsosn,
        unidade: i.unidade ?? "UN",
        quantidade: i.quantidade,
        valorUnitario: i.preco,
        valorTotal: i.total,
      })),
      frete,
      total: nota.pedido.total,
      observacoes: `Pedido ${nota.canal} ${nota.pedidoId}`,
      modelo: "55" as const,
      naturezaOperacao: "Venda de mercadoria",
      // 1 = interna, 2 = interestadual. Sem UF de destino, assume interna e o
      // emissor recusa com o motivo — melhor do que inventar.
      destinoOperacao: (ufDestino && ufEmitente && ufDestino.toUpperCase() !== ufEmitente.toUpperCase()
        ? "2"
        : "1") as "1" | "2",
      // venda online não é presencial
      indicadorPresenca: (nota.canal === "manual" ? "1" : "2") as "1" | "2",
      modalidadeFrete: frete > 0 ? "0" : "9",
      pagamento: { forma: nota.canal === "site" ? "17" : "99", valor: nota.pedido.total },
    };
  }));
}

/** CSV: uma linha por item, com os campos do pedido repetidos. */
export function pacoteParaCsv(pacote: NotaPacote[]): string {
  const cabecalho = [
    "pedido_id", "canal", "data", "emitente_cnpj", "emitente_ie", "emitente_uf", "serie",
    "destinatario_nome", "destinatario_documento", "dest_uf", "dest_cep",
    "sku", "nome", "ncm", "cfop", "cst", "unidade", "quantidade", "valor_unit", "valor_total",
    "frete", "total",
  ].join(";");

  const linhas: string[] = [cabecalho];
  const limpar = (v: unknown) => String(v ?? "").replace(/;/g, ",").replace(/\r?\n/g, " ");
  const numero = (v: number) => v.toFixed(2).replace(".", ",");

  for (const nota of pacote) {
    for (const item of nota.itens) {
      linhas.push(
        [
          nota.pedidoId,
          nota.canal,
          nota.vendaEm,
          nota.emitente.cnpj,
          limpar(nota.emitente.ie),
          limpar(nota.emitente.uf),
          nota.emitente.serie,
          limpar(nota.destinatario.nome),
          limpar(nota.destinatario.documento),
          limpar(nota.destinatario.endereco.uf),
          limpar(nota.destinatario.endereco.cep),
          limpar(item.sku),
          limpar(item.nome),
          limpar(item.ncm),
          limpar(item.cfop),
          limpar(item.cst),
          limpar(item.unidade),
          item.quantidade,
          numero(item.valorUnitario),
          numero(item.valorTotal),
          numero(nota.frete),
          numero(nota.total),
        ].join(";")
      );
    }
  }

  return linhas.join("\r\n");
}

/** Marca como exportada — o que saiu do lote não volta para a fila. */
export async function marcarExportadas(pedidoIds: string[]): Promise<number> {
  if (pedidoIds.length === 0) return 0;
  const { count } = await prisma.notaFiscal.updateMany({
    where: { pedidoId: { in: pedidoIds }, status: "pronta" },
    data: { status: "exportada", exportadaEm: new Date() },
  });
  return count;
}
