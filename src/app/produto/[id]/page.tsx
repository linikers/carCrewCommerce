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
  const title = produto.nome;
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
          url: produto.imgUrl || `${siteUrl}/og-image.jpg`,
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
  const productUrl = `${siteUrl}/produto/${produto.id}`;
  const productImage = produto.imgUrl || `${siteUrl}/og-image.jpg`;
  const sobConsulta = !produto.preco || produto.preco <= 0;

  // JSON-LD — Product structured data
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    description: produto.descricao,
    image: produto.imgUrl ? [produto.imgUrl] : [productImage],
    category: categoria?.nome || produto.category,
    sku: String(produto.id),
    brand: {
      "@type": "Brand",
      name: "CarCrew",
    },
    url: productUrl,
    offers: {
      "@type": "Offer",
      price: sobConsulta ? "0" : produto.preco.toFixed(2),
      priceCurrency: "BRL",
      availability: sobConsulta
        ? "https://schema.org/InStoreOnly"
        : "https://schema.org/InStock",
      url: productUrl,
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      ).toISOString().split("T")[0],
      seller: {
        "@type": "Organization",
        name: "CarCrew Suspensões",
      },
    },
  };

  // JSON-LD — BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      ...(categoria
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: categoria.nome,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: categoria ? 3 : 2,
        name: produto.nome,
      },
    ],
  };

  return (
    <>
      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ProdutoDetalheClient
        produto={produto}
        categoria={categoria}
        relacionados={relacionados}
      />
    </>
  );
}
