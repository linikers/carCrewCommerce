import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Dados da empresa em um lugar só (#os-pdf).
 *
 * Fonte única do que leva o nome da loja: PDF da OS, orçamento, nota fiscal.
 * A tela `/admin/empresa` é a única que escreve aqui.
 */
export interface RedesSociais {
  site?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
}

export interface DadosEmpresa {
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  ie: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  telefone: string | null;
  email: string | null;
  logo: string | null;
  redesSociais: RedesSociais | null;
}

export async function lerEmpresa(): Promise<DadosEmpresa | null> {
  try {
    const empresa = await prisma.empresaFiscal.findUnique({ where: { id: "unica" } });
    if (!empresa) return null;

    return {
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpj: empresa.cnpj,
      ie: empresa.ie,
      logradouro: empresa.logradouro,
      numero: empresa.numero,
      complemento: empresa.complemento,
      bairro: empresa.bairro,
      cidade: empresa.cidade,
      uf: empresa.uf,
      cep: empresa.cep,
      telefone: empresa.telefone,
      email: empresa.email,
      logo: empresa.logo,
      redesSociais: (empresa.redesSociais as RedesSociais | null) ?? null,
    };
  } catch (erro) {
    console.error("[empresa] não consegui ler os dados:", erro);
    return null;
  }
}

/** Grava os dados da empresa (fonte única). */
export async function salvarEmpresa(dados: Partial<DadosEmpresa> & { razaoSocial: string }) {
  const antes = await prisma.empresaFiscal.findUnique({ where: { id: "unica" } });

  // o Json do Prisma exige um tipo próprio; os campos opcionais vão como undefined
  const { redesSociais, ...campos } = dados;

  const registro = await prisma.empresaFiscal.upsert({
    where: { id: "unica" },
    create: {
      id: "unica",
      ...campos,
      razaoSocial: dados.razaoSocial,
      logo: dados.logo ?? null,
      redesSociais: (redesSociais ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    update: {
      ...campos,
      ...(redesSociais !== undefined
        ? { redesSociais: redesSociais as Prisma.InputJsonValue }
        : {}),
    },
  });

  return { antes, registro };
}
