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
    };
  };
  itens: ItemPacote[];
  frete: number;
  total: number;
  observacoes: string;
}

interface Endereco {
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

  return notas.map((nota) => {
    const endereco = (nota.pedido.enderecoEntrega ?? {}) as Endereco;
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
          uf: endereco.uf ?? null,
          cep: endereco.cep ?? null,
        },
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
      frete: nota.pedido.frete ?? 0,
      total: nota.pedido.total,
      observacoes: `Pedido ${nota.canal} ${nota.pedidoId}`,
    };
  });
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
