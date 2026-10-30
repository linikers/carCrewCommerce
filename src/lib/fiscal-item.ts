import prisma from "@/lib/prisma";

/**
 * Dado fiscal do item da venda (interface do emissor).
 *
 * O CFOP depende do destino: 5xxx dentro do estado, 6xxx fora. O produto guarda
 * os dois; o item guarda o que valia **no momento da venda** — mudar o cadastro
 * depois não reescreve nota antiga.
 */

export interface ProdutoFiscal {
  ncm?: string | null;
  cfop?: string | null;
  cfopInterno?: string | null;
  cfopExterno?: string | null;
  cstCsosn?: string | null;
  unidade?: string | null;
}

export function cfopDaVenda(
  produto: ProdutoFiscal,
  ufDestino?: string | null,
  ufEmitente?: string | null
): string | null {
  const interno = produto.cfopInterno ?? produto.cfop ?? null;
  const externo = produto.cfopExterno ?? null;

  if (ufDestino && ufEmitente && ufDestino.toUpperCase() !== ufEmitente.toUpperCase() && externo) {
    return externo;
  }
  return interno;
}

/** UF do emitente, para escolher o CFOP. Falha de banco não derruba a venda. */
export async function ufDoEmitente(): Promise<string | null> {
  try {
    const empresa = await prisma.empresaFiscal.findFirst({ select: { uf: true } });
    return empresa?.uf ?? null;
  } catch {
    return null;
  }
}

/** Snapshot fiscal que vai para `pedido_itens`. */
export function snapshotFiscal(
  produto: ProdutoFiscal,
  ufDestino?: string | null,
  ufEmitente?: string | null
) {
  return {
    ncm: produto.ncm ?? null,
    cfop: cfopDaVenda(produto, ufDestino, ufEmitente),
    cstCsosn: produto.cstCsosn ?? null,
    unidade: produto.unidade ?? "UN",
  };
}
