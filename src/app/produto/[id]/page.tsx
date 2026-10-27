import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lerPoliticaPreco, precoSiteDe } from "@/lib/politica-preco";
import prisma from "@/lib/prisma";
import ProdutoDetalheClient from "@/components/ProdutoDetalheClient";
import type { Produto, Categoria } from "@/types";

// ── Metadata dinâmica por produto ──────────────────────

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const produto = await prisma.produto.findUnique({
    where: { id: Number(id) },
  });

  if (!produto || !produto.ativo) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";
  const title = produto.nome;
  const description = produto.descricao
    ? produto.descricao.substring(0, 160)
    : "Peça para suspensão automotiva — Car Crew Garage";

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

  // Buscar produto do banco
  const [dbProduto, politicaPreco] = await Promise.all([
    prisma.produto.findUnique({
      where: { id: numericId },
      include: { categoria: true, precosCanal: true },
    }),
    lerPoliticaPreco(),
  ]);

  if (!dbProduto || !dbProduto.ativo) notFound();

  // Converter pra tipo Produto
  const produto: Produto = {
    id: dbProduto.id,
    nome: dbProduto.nome,
    descricao: dbProduto.descricao || "",
    // preço do site já com a política do canal (#preco); promoção do item fica
    // no descontoPercent
    preco: precoSiteDe(dbProduto, politicaPreco),
    descontoPercent: dbProduto.descontoPercent ?? 0,
    imgUrl: dbProduto.imgUrl || "/produtos/placeholder.svg",
    category: dbProduto.categorySlug as any,
    parcelamento: dbProduto.parcelamento || 12,
    veiculos: dbProduto.veiculos || [],
    // 2.7: a galeria já existia no client e nunca recebia as imagens extras —
    // o `imagens` do banco só era salvo pelo admin e ficava invisível na loja.
    galeria: dbProduto.imagens || [],
    peso: dbProduto.peso || undefined,
    altura: dbProduto.altura || undefined,
    largura: dbProduto.largura || undefined,
    profundidade: dbProduto.profundidade || undefined,
  };

  // Buscar categoria
  const categoria: Categoria | undefined = dbProduto.categoria
    ? {
        slug: dbProduto.categoria.slug as any,
        nome: dbProduto.categoria.nome,
        icone: dbProduto.categoria.icone,
      }
    : undefined;

  // Buscar produtos relacionados (mesma categoria)
  const relacionadosDb = await prisma.produto.findMany({
    where: {
      categorySlug: dbProduto.categorySlug,
      id: { not: numericId },
      ativo: true,
    },
    take: 3,
  });

  const relacionados: Produto[] = relacionadosDb.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao || "",
    preco: p.preco,
    imgUrl: p.imgUrl || "/produtos/placeholder.svg",
    category: p.categorySlug as any,
    parcelamento: p.parcelamento || 12,
    veiculos: p.veiculos || [],
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";
  const productUrl = `${siteUrl}/produto/${produto.id}`;
  const productImage = produto.imgUrl || `${siteUrl}/og-image.jpg`;
  const sobConsulta = !produto.preco || produto.preco <= 0;

  // JSON-LD — Product structured data (6.4)
  //
  // Antes: preço 0 quando o produto é "sob consulta" (o Google reprova
  // `price: 0`) e `InStock` fixo, mesmo com estoque zerado — ou seja, o dado
  // estruturado mentia para o buscador. Agora:
  // - sem preço, o bloco `offers` não existe (Product sem oferta é válido)
  // - disponibilidade segue o estoque real
  // - imagem sempre absoluta, como o schema exige
  const imagemAbsoluta = produto.imgUrl?.startsWith("http")
    ? produto.imgUrl
    : `${siteUrl}${produto.imgUrl || "/produtos/placeholder.svg"}`;

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    description: produto.descricao,
    image: [imagemAbsoluta],
    category: categoria?.nome || produto.category,
    sku: String(produto.id),
    brand: {
      "@type": "Brand",
      name: "Car Crew Garage",
    },
    url: productUrl,
    ...(sobConsulta
      ? {}
      : {
          offers: {
            "@type": "Offer",
            price: produto.preco.toFixed(2),
            priceCurrency: "BRL",
            availability:
              (dbProduto.estoque ?? 0) > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            url: productUrl,
            seller: {
              "@type": "Organization",
              name: "Car Crew Garage",
            },
          },
        }),
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
