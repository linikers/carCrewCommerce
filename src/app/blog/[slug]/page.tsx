import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Box, Container, Divider, Paper, Typography, Button } from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { POSTS, postPorSlug } from "@/lib/blog";
import { formatData } from "@/lib/format";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = postPorSlug(slug);
  if (!post) return {};

  return {
    title: `${post.titulo} | Car Crew Garage`,
    description: post.resumo,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.titulo,
      description: post.resumo,
      url: `${siteUrl}/blog/${slug}`,
      type: "article",
      publishedTime: post.publicadoEm,
      modifiedTime: post.atualizadoEm,
    },
  };
}

export default async function PostPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = postPorSlug(slug);
  if (!post) notFound();

  const artigo = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.resumo,
    datePublished: post.publicadoEm,
    dateModified: post.atualizadoEm,
    inLanguage: "pt-BR",
    mainEntityOfPage: `${siteUrl}/blog/${slug}`,
    author: { "@type": "Organization", name: "Car Crew Garage" },
    publisher: {
      "@type": "Organization",
      name: "Car Crew Garage",
      url: siteUrl,
    },
  };

  const relacionados = POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(artigo) }} />

      <Header />

      <Container maxWidth="md" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        {/* 720 px: acima disso a linha passa de 90 caracteres e cansa a leitura */}
        <Box sx={{ maxWidth: 720 }}>
        <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 1.5 }}>
          <Box component="a" href="/blog" sx={{ color: "inherit", textDecoration: "none", "&:hover": { color: "primary.main" } }}>
            Blog
          </Box>
        </Typography>

        <Typography component="h1" variant="h4" sx={{ fontWeight: 800, color: "#1A1A1A", mb: 1, lineHeight: 1.25 }}>
          {post.titulo}
        </Typography>
        <Typography variant="caption" sx={{ color: "#999", display: "block", mb: 3 }}>
          {formatData(post.publicadoEm)}
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 500, color: "#555", mb: 3, lineHeight: 1.6 }}>
          {post.resumo}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {post.blocos.map((bloco, i) => {
          if (bloco.tipo === "h2") {
            return (
              <Typography key={i} component="h2" variant="h5" sx={{ fontWeight: 700, color: "#1A1A1A", mt: 4, mb: 1.5 }}>
                {bloco.texto}
              </Typography>
            );
          }
          if (bloco.tipo === "lista") {
            return (
              <Box component="ul" key={i} sx={{ pl: 3, my: 2 }}>
                {bloco.itens.map((item, j) => (
                  <Typography component="li" key={j} variant="body1" sx={{ color: "#444", lineHeight: 1.8, mb: 0.75 }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            );
          }
          return (
            <Typography key={i} variant="body1" sx={{ color: "#444", lineHeight: 1.85, mb: 2 }}>
              {bloco.texto}
            </Typography>
          );
        })}

        <Paper sx={{ p: 3, borderRadius: 3, mt: 4, backgroundColor: "#fafafa", border: "1px solid #eee" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1A1A1A", mb: 1 }}>
            Continue por aqui
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            {post.links.map((l) => (
              <Button
                key={l.href}
                href={l.href}
                variant="outlined"
                size="small"
                sx={{ textTransform: "none", borderColor: "primary.main", color: "primary.main" }}
              >
                {l.label}
              </Button>
            ))}
          </Box>
        </Paper>

        <Typography component="h2" variant="h6" sx={{ fontWeight: 700, color: "#1A1A1A", mt: 5, mb: 2 }}>
          Outros assuntos
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {relacionados.map((r) => (
            <Box
              key={r.slug}
              component="a"
              href={`/blog/${r.slug}`}
              sx={{ color: "#333", textDecoration: "none", fontSize: "0.95rem", "&:hover": { color: "primary.main" } }}
            >
              → {r.titulo}
            </Box>
          ))}
        </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
