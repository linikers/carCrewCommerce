import type { Metadata } from "next";
import { calcularPreco } from "@/lib/preco";
import { notFound } from "next/navigation";
import { lerPoliticaPreco, precoSiteDe } from "@/lib/politica-preco";
import prisma from "@/lib/prisma";
import { Container, Box, Typography, Paper, Button, Divider } from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { lerConteudoCategoriaPublico } from "@/lib/categorias-conteudo-admin";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";

async function carregarCategoria(slug: string) {
  const categoria = await prisma.categoria.findUnique({ where: { slug } });
  if (!categoria) return null;

  const politicaPreco = await lerPoliticaPreco();
  const produtos = await prisma.produto.findMany({
    where: { categorySlug: slug, ativo: true },
    orderBy: [{ destaque: "desc" }, { ordem: "asc" }, { id: "asc" }],
    include: { precosCanal: true },
  });

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
  const titulo = `${conteudo.titulo} | Car Crew Garage`;
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

export default async function CategoriaPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const dados = await carregarCategoria(slug);
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

      <Header />

      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 1 }}>
          <Box component="a" href="/" sx={{ color: "inherit", textDecoration: "none", "&:hover": { color: "primary.main" } }}>
            Home
          </Box>{" "}
          / {categoria.nome}
        </Typography>

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
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#1A1A1A" }}>
            {produtos.length} {produtos.length === 1 ? "peça" : "peças"}
          </Typography>
          {conteudo.landing && (
            <Button href={conteudo.landing.href} sx={{ textTransform: "none", color: "primary.main", fontWeight: 600 }}>
              {conteudo.landing.label} →
            </Button>
          )}
        </Box>

        {produtos.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#666", py: 4 }}>
            Sem peça nesta categoria no momento. Fale com a gente no WhatsApp que buscamos para você.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2.5,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))" },
            }}
          >
            {produtos.map((p) => {
              const semPreco = !p.preco || p.preco <= 0;
              const precoCat = calcularPreco(p.preco, p.descontoPercent);
              return (
                <Paper
                  key={p.id}
                  component="a"
                  href={`/produto/${p.id}`}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    textDecoration: "none",
                    color: "inherit",
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid #eee",
                    transition: "box-shadow .15s ease, border-color .15s ease",
                    "&:hover": { borderColor: "primary.main", boxShadow: "0 6px 18px rgba(0,0,0,0.06)" },
                  }}
                >
                  {/* Caixa fixa 4:3: a foto do anúncio pode ser vertical (141×500) ou
                      panorâmica. Sem position/absolute o `height: 100%` cai na
                      proporção natural do arquivo e o card estica até 1226 px. */}
                  <Box sx={{ position: "relative", aspectRatio: "4 / 3", backgroundColor: "#f7f7f7", overflow: "hidden" }}>
                    <Box
                      component="img"
                      src={p.imgUrl || "/produtos/placeholder.svg"}
                      alt={p.nome}
                      loading="lazy"
                      sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        p: 2,
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 0.5, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1A1A", lineHeight: 1.35 }}>
                      {p.nome}
                    </Typography>
                    <Box sx={{ mt: "auto", pt: 1 }}>
                      <Divider sx={{ mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: semPreco ? "#8a8a8a" : "#1A1A1A" }}>
                        {semPreco ? (
                          "Sob consulta"
                        ) : precoCat.temDesconto ? (
                          <Box component="span">
                            <Box component="span" sx={{ color: "#9a9a9a", textDecoration: "line-through", fontSize: "0.8rem", mr: 0.75 }}>
                              {formatBRL(precoCat.de)}
                            </Box>
                            {formatBRL(precoCat.por)}
                            <Box component="span" sx={{ backgroundColor: "#0E7A3F", color: "#fff", fontSize: "0.6rem", fontWeight: 700, px: 0.6, py: 0.2, borderRadius: 1, ml: 0.75 }}>
                              -{precoCat.percentual}%
                            </Box>
                          </Box>
                        ) : (
                          formatBRL(precoCat.por)
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Container>

      <Footer />
    </Box>
  );
}
