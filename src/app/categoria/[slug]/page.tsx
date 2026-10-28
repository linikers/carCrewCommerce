import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lerPoliticaPreco, precoSiteDe } from "@/lib/politica-preco";
import prisma from "@/lib/prisma";
import { Container, Box, Typography, Paper, Button } from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { lerConteudoCategoriaPublico } from "@/lib/categorias-conteudo-admin";
import ProdutoGrade from "@/components/ProdutoGrade";
import type { Produto } from "@/types";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";

/** Sem acento e minúsculo: "amortecedor" acha "Amortecedor" e "amorteçedor". */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function carregarCategoria(slug: string, busca = "") {
  const categoria = await prisma.categoria.findUnique({ where: { slug } });
  if (!categoria) return null;

  const politicaPreco = await lerPoliticaPreco();
  const brutos = await prisma.produto.findMany({
    where: { categorySlug: slug, ativo: true },
    orderBy: [{ destaque: "desc" }, { ordem: "asc" }, { id: "asc" }],
    include: { precosCanal: true },
  });

  // A grade mostrava `preco` cru (preço do marketplace), enquanto a página do
  // produto aplicava a política do canal: o mesmo item aparecia por R$ 599 na
  // categoria e R$ 497,17 na PDP.
  const termo = normalizar(busca.trim());
  const produtos: Produto[] = brutos
    .filter((p) => {
      if (!termo) return true;
      return [p.nome, p.sku ?? "", p.descricao ?? ""].some((campo) =>
        normalizar(campo).includes(termo)
      );
    })
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao || "",
      preco: precoSiteDe(p, politicaPreco),
      descontoPercent: p.descontoPercent ?? 0,
      imgUrl: p.imgUrl || "/produtos/placeholder.svg",
      category: p.categorySlug as Produto["category"],
      parcelamento: p.parcelamento || 12,
      veiculos: p.veiculos || [],
    }));

  return { categoria, produtos };
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const dados = await carregarCategoria(slug);
  if (!dados) return {};

  // Texto do painel (/admin/categorias → Conteúdo), com o código como padrão.
  const conteudo = await lerConteudoCategoriaPublico(slug, dados.categoria.nome);
  // O layout aplica o template `%s | Car Crew Garage`; somar a marca aqui
  // gerava "Componentes | Car Crew Garage | Car Crew Garage" (#163).
  const titulo = conteudo.titulo;
  const descricao = conteudo.intro.slice(0, 158);

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: `/categoria/${slug}` },
    openGraph: {
      title: titulo,
      description: descricao,
      url: `${siteUrl}/categoria/${slug}`,
      type: "website",
    },
  };
}

export default async function CategoriaPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await props.params;
  const { q } = await props.searchParams;
  const busca = (q ?? "").trim();
  const dados = await carregarCategoria(slug, busca);
  if (!dados) notFound();

  const { categoria, produtos } = dados;
  const conteudo = await lerConteudoCategoriaPublico(slug, categoria.nome);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: categoria.nome,
        item: `${siteUrl}/categoria/${slug}`,
      },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: conteudo.titulo,
    numberOfItems: produtos.length,
    itemListElement: produtos.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/produto/${p.id}`,
      name: p.nome,
    })),
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

      <Header initialQuery={busca} key={`header-${busca}`} />

      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        {/* 14 px e #666 (5,7:1) — em 12 px/#888 ficava em 3,5:1, abaixo de AA */}
        <Box
          component="nav"
          aria-label="Você está em"
          sx={{ display: "flex", gap: 0.75, alignItems: "center", mb: 1 }}
        >
          <Box
            component="a"
            href="/"
            sx={{ color: "#666", fontSize: "0.875rem", textDecoration: "none", "&:hover": { color: "primary.main", textDecoration: "underline" } }}
          >
            Home
          </Box>
          <Typography component="span" sx={{ color: "#bbb", fontSize: "0.875rem" }}>/</Typography>
          <Typography
            component="span"
            aria-current="page"
            sx={{ color: "#666", fontSize: "0.875rem", fontWeight: 600 }}
          >
            {categoria.nome}
          </Typography>
        </Box>

        <Typography component="h1" variant="h4" sx={{ fontWeight: 800, color: "#1A1A1A", mb: 2 }}>
          {conteudo.titulo}
        </Typography>

        <Typography variant="body1" sx={{ color: "#555", maxWidth: 700, lineHeight: 1.75, mb: 2 }}>
          {conteudo.intro}
        </Typography>

        <Paper sx={{ p: 2.5, borderRadius: 3, backgroundColor: "#fafafa", border: "1px solid #eee", maxWidth: 700, mb: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1A1A", mb: 0.5 }}>
            Antes de comprar
          </Typography>
          <Typography variant="body2" sx={{ color: "#555", lineHeight: 1.7 }}>
            {conteudo.atencao}
          </Typography>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 2, gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#1A1A1A" }}>
              {busca
                ? `${produtos.length} ${produtos.length === 1 ? "resultado" : "resultados"} para “${busca}” em ${categoria.nome}`
                : `${produtos.length} ${produtos.length === 1 ? "peça" : "peças"}`}
            </Typography>
            {busca && (
              <Box
                component="a"
                href={`/busca?q=${encodeURIComponent(busca)}`}
                sx={{ fontSize: "0.85rem", color: "primary.main", fontWeight: 600, textDecoration: "none" }}
              >
                Buscar “{busca}” em todo o site →
              </Box>
            )}
          </Box>
          {conteudo.landing && (
            <Button href={conteudo.landing.href} sx={{ textTransform: "none", color: "primary.main", fontWeight: 600 }}>
              {conteudo.landing.label} →
            </Button>
          )}
        </Box>

        {produtos.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#666", py: 4 }}>
            {busca ? (
              <>
                Nada encontrado para “{busca}” em {categoria.nome}.{" "}
                <Box component="a" href={`/busca?q=${encodeURIComponent(busca)}`} sx={{ color: "primary.main", fontWeight: 600 }}>
                  Buscar em todo o site
                </Box>
                .
              </>
            ) : (
              "Sem peça nesta categoria no momento. Fale com a gente no WhatsApp que buscamos para você."
            )}
          </Typography>
        ) : (
          <ProdutoGrade produtos={produtos} />
        )}
      </Container>

      <Footer />
    </Box>
  );
}
