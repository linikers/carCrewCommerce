import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import HomeClient from "@/components/HomeClient";
import { categorias as mockCategorias } from "@/lib/categorias";

export const metadata: Metadata = {
  title: {
    absolute: "Car Crew Garage — Suspensão Automotiva Custom em Maringá-PR",
  },
  description:
    "Loja e oficina de suspensão automotiva em Maringá: suspensão a ar, rebaixamento, suspensão esportiva, bolsas de ar, compressores, calços antirruído e amortecedores. Entrega para todo o Brasil.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let produtos: any[] = [];
  let categorias: any[] = [];
  let banners: any[] = [];

  try {
    const dbProdutos = await prisma.produto.findMany({
      where: { ativo: true },
      orderBy: { id: "asc" },
    });

    produtos = dbProdutos.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao || "",
      preco: p.preco,
      imgUrl: p.imgUrl || "/produtos/placeholder.svg",
      category: p.categorySlug,
      parcelamento: p.parcelamento || 12,
      estoque: p.estoque || 0,
      veiculos: p.veiculos || [],
      ativo: p.ativo,
      peso: p.peso || null,
      altura: p.altura || null,
      largura: p.largura || null,
      profundidade: p.profundidade || null,
    }));

    const dbCategorias = await prisma.categoria.findMany({
      orderBy: { ordem: "asc" },
    });
    const dbData = dbCategorias.map((c) => ({
      slug: c.slug,
      nome: c.nome,
      icone: c.icone || "🔧",
    }));
    const dbSlugs = new Set(dbData.map((c) => c.slug));
    categorias = [
      ...dbData,
      ...mockCategorias.filter((c) => !dbSlugs.has(c.slug)),
    ];

    banners = await prisma.banner.findMany({
      where: { ativo: true },
      orderBy: { ordem: "asc" },
    });
  } catch (error) {
    console.error("Erro ao buscar dados da home:", error);
  }

  return <HomeClient produtos={produtos} categorias={categorias} banners={banners} />;
}
