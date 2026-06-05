import type { Metadata } from "next";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ProdutoDetalheClient from "@/components/ProdutoDetalheClient";
import type { Produto, Categoria } from "@/types";

// ── Helpers ────────────────────────────────────────────

function loadJSON<T>(relativePath: string): T[] {
  try {
    const filePath = path.join(process.cwd(), relativePath);
    if (!existsSync(filePath)) return [];
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

function findProduto(id: number): Produto | undefined {
  return (loadJSON<Produto>("src/data/produtos.json") as any[]).find(
    (p: any) => p.id === id && p.ativo !== false
  );
}

// ── Metadata dinâmica por produto ──────────────────────

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const produto = findProduto(Number(id));
  if (!produto) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";
  const title = `${produto.nome} | CarCrew Suspensões`;
  const description = produto.descricao
    ? produto.descricao.substring(0, 160)
    : "Peça para suspensão automotiva — CarCrew Suspensões";

  return {
    title,
    description,
    alternates: {
      canonical: `/produto/${produto.id}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/produto/${produto.id}`,
      type: "website",
      images: [
        {
          url: `${siteUrl}${produto.imgUrl?.startsWith("http") ? "" : ""}${produto.imgUrl || "/og-image.jpg"}`,
          width: 800,
          height: 800,
          alt: produto.nome,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [produto.imgUrl || "/og-image.jpg"],
    },
  };
}

// ── Página ──────────────────────────────────────────────

export default async function ProdutoPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const numericId = Number(id);
  const produtos = loadJSON<Produto>("src/data/produtos.json") as Produto[];
  const categorias = loadJSON<Categoria>("src/data/categorias.json") as Categoria[];

  const produto = produtos.find((p) => p.id === numericId && (p as any).ativo !== false);
  if (!produto) notFound();

  const categoria = categorias.find((c) => c.slug === produto.category);
  const relacionados = produtos
    .filter((p) => p.category === produto.category && p.id !== numericId && (p as any).ativo !== false)
    .slice(0, 3);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";

  // JSON-LD — Product structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    description: produto.descricao,
    image: produto.imgUrl ? [produto.imgUrl] : [],
    category: categoria?.nome || produto.category,
    url: `${siteUrl}/produto/${produto.id}`,
    offers: {
      "@type": "Offer",
      price: produto.preco,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/produto/${produto.id}`,
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      ).toISOString().split("T")[0],
    },
  };

  return (
    <>
      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProdutoDetalheClient
        produto={produto}
        categoria={categoria}
        relacionados={relacionados}
      />
    </>
  );
}
