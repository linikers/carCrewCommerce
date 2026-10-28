import type { Metadata } from "next";
import { lerPoliticaPreco, precoSiteDe } from "@/lib/politica-preco";
import prisma from "@/lib/prisma";
import HomeClient, { type BannerData, type CategoriaData, type ProdutoData } from "@/components/HomeClient";
import { lerConfigConvite } from "@/lib/site-config";
import { categorias as mockCategorias } from "@/lib/categorias";

export const metadata: Metadata = {
  title: {
    absolute: "Car Crew Garage — Suspensão Automotiva Custom em Maringá-PR",
  },
  description:
    "Loja e oficina de suspensão automotiva em Maringá: suspensão a ar, rebaixados, suspensão esportiva, bolsas de ar, compressores, calços antirruído e amortecedores. Entrega para todo o Brasil.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function HomePage(props: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const { q, cat } = await props.searchParams;
  let produtos: ProdutoData[] = [];
  let categorias: CategoriaData[] = [];
  let banners: BannerData[] = [];

  try {
    const [dbProdutos, politicaPreco] = await Promise.all([
      prisma.produto.findMany({
        where: { ativo: true },
        orderBy: { id: "asc" },
        include: { precosCanal: true },
      }),
      lerPoliticaPreco(),
    ]);

    produtos = dbProdutos.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao || "",
      // preço do site (política do canal), igual à PDP — a home mostrava o
      // preço do marketplace e a página do produto outro (#163).
      preco: precoSiteDe(p, politicaPreco),
      descontoPercent: p.descontoPercent ?? 0,
      imgUrl: p.imgUrl || "/produtos/placeholder.svg",
      category: p.categorySlug,
      parcelamento: p.parcelamento || 12,
      estoque: p.estoque || 0,
      veiculos: p.veiculos || [],
      ativo: p.ativo,
      galeria: p.imagens || [],
      destaque: p.destaque,
      ordem: p.ordem,
      peso: p.peso || null,
      altura: p.altura || null,
      largura: p.largura || null,
      profundidade: p.profundidade || null,
    })) as ProdutoData[];

    const dbCategorias = await prisma.categoria.findMany({
      orderBy: { ordem: "asc" },
    });
    const dbData = dbCategorias.map((c) => ({
      slug: c.slug,
      nome: c.nome,
      icone: c.icone || "",
    }));
    const dbSlugs = new Set(dbData.map((c) => c.slug));
    categorias = [
      ...dbData,
      ...mockCategorias.filter((c) => !dbSlugs.has(c.slug)),
    ] as CategoriaData[];

    banners = (await prisma.banner.findMany({
      where: { ativo: true },
      orderBy: { ordem: "asc" },
    })) as BannerData[];
  } catch (error) {
    console.error("Erro ao buscar dados da home:", error);
  }

  const convite = await lerConfigConvite();

  return (
    <HomeClient
      produtos={produtos}
      categorias={categorias}
      banners={banners}
      convite={convite}
      initialQuery={q ?? ""}
      initialCategory={cat ?? null}
    />
  );
}
