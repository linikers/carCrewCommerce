import type { Metadata } from "next";
import { Container, Box, Typography, Paper } from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { POSTS } from "@/lib/blog";
import { formatData } from "@/lib/format";

export const metadata: Metadata = {
  title: "Blog — suspensão automotiva sem enrolação",
  description:
    "Rebaixamento, suspensão a ar, lift e manutenção: conteúdo técnico para decidir antes de comprar a peça.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = [...POSTS].sort((a, b) => (a.publicadoEm < b.publicadoEm ? 1 : -1));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 800, color: "#1A1A1A", mb: 1 }}>
          Blog
        </Typography>
        <Typography variant="body1" sx={{ color: "#555", mb: 4, maxWidth: 720 }}>
          O que a gente aprende montando suspensão, escrito para quem está decidindo o que
          comprar — sem promessa de ganho fácil.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))" },
          }}
        >
          {posts.map((post) => (
            <Paper
              key={post.slug}
              component="a"
              href={`/blog/${post.slug}`}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #eee",
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                transition: "border-color .15s ease, box-shadow .15s ease",
                "&:hover": { borderColor: "primary.main", boxShadow: "0 6px 18px rgba(0,0,0,0.06)" },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1A1A", lineHeight: 1.35 }}>
                {post.titulo}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", lineHeight: 1.6 }}>
                {post.resumo}
              </Typography>
              <Typography variant="caption" sx={{ color: "#999", mt: "auto", pt: 1 }}>
                {formatData(post.publicadoEm)}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}
