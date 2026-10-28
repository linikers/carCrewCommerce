import type { ReactNode } from "react";
import { Container, Typography, Box, Grid, Paper, Button } from "@mui/material";
import { CheckCircle, WhatsApp } from "@mui/icons-material";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatBRL } from "@/lib/format";
import BotaoEditarPagina from "@/components/BotaoEditarPagina";

export interface CategoriaProduto {
  id: number;
  nome: string;
  preco: number;
  imgUrl: string;
  parcelamento: number;
}

interface CategoriaLandingProps {
  h1: string;
  intro: string[];
  produtos: CategoriaProduto[];
  beneficios: { icon: ReactNode; title: string; desc: string }[];
  servicos: string[];
  ctaTitle: string;
  ctaDesc: string;
  whatsMessage: string;
  /** Só para admin logado: atalho para editar o texto desta página. */
  editarHref?: string;
}

export default function CategoriaLanding({
  h1,
  intro,
  produtos,
  beneficios,
  servicos,
  ctaTitle,
  ctaDesc,
  whatsMessage,
  editarHref,
}: CategoriaLandingProps) {
  const whatsUrl = `https://wa.me/5544998133182?text=${encodeURIComponent(whatsMessage)}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      {/* Hero */}
      <Box sx={{ backgroundColor: "#1A1A1A", color: "#fff", py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.9rem", md: "2.75rem" },
              lineHeight: 1.2,
              mb: 2,
              color: "#fff",
            }}
          >
            {h1}
          </Typography>
          {intro.map((p, i) => (
            <Typography
              key={i}
              variant="body1"
              sx={{ color: "#ccc", maxWidth: 800, mb: i === intro.length - 1 ? 0 : 2, fontSize: "1.05rem", lineHeight: 1.8 }}
            >
              {p}
            </Typography>
          ))}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ flex: 1, py: 6 }}>
        {/* Produtos */}
        <Box id="produtos" sx={{ mb: 8 }}>
          <Typography variant="h2" component="h2" sx={{ fontWeight: 700, mb: 1, color: "#1A1A1A", fontSize: "1.75rem" }}>
            Produtos
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
            Confira nossa seleção de peças com entrega para todo o Brasil
          </Typography>

          {produtos.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6, color: "#999" }}>
              <Typography variant="h6">Em breve</Typography>
              <Typography variant="body2">
                Estamos atualizando o catálogo. Fale conosco no WhatsApp!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {produtos.map((p) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={p.id}>
                  <Link href={`/produto/${p.id}`} style={{ textDecoration: "none" }}>
                    <Paper
                      sx={{
                        borderRadius: 3,
                        overflow: "hidden",
                        transition: "transform 0.2s",
                        cursor: "pointer",
                        height: "100%",
                        "&:hover": { transform: "translateY(-4px)" },
                      }}
                    >
                      <Box
                        component="img"
                        src={p.imgUrl}
                        alt={p.nome}
                        loading="lazy"
                        sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                      />
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1A1A", mb: 1, minHeight: 40 }}>
                          {p.nome}
                        </Typography>
                        {p.preco > 0 ? (
                          <>
                            <Typography variant="h6" sx={{ color: "#E65100", fontWeight: 700 }}>
                              {formatBRL(p.preco)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#999" }}>
                              Pagamento via PIX
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="h6" sx={{ color: "#E65100", fontWeight: 700 }}>
                            Sob Consulta
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Link>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Benefícios */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h2" component="h2" sx={{ fontWeight: 700, mb: 1, color: "#1A1A1A", fontSize: "1.75rem" }}>
            Por que escolher a Car Crew Garage?
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", mb: 4, fontSize: "1.05rem" }}>
            Mais de uma década preparando veículos em Maringá e região
          </Typography>
          <Grid container spacing={3}>
            {beneficios.map((b, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <Paper sx={{ p: 3, borderRadius: 3, height: "100%", textAlign: "center", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                  <Box sx={{ mb: 2 }}>{b.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#1A1A1A" }}>
                    {b.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666", lineHeight: 1.7 }}>
                    {b.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Serviços */}
        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, mb: 8, backgroundColor: "#1A1A1A", color: "#fff" }}>
          <Typography variant="h2" component="h2" sx={{ fontWeight: 700, mb: 1, color: "#fff", fontSize: "1.75rem" }}>
            Serviços
          </Typography>
          <Typography variant="body1" sx={{ color: "#ccc", mb: 4 }}>
            Tudo o que seu carro precisa, com instalação especializada em Maringá-PR
          </Typography>
          <Grid container spacing={2}>
            {servicos.map((s, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CheckCircle sx={{ color: "#E65100", fontSize: 24 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {s}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* CTA WhatsApp */}
        <Paper
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            textAlign: "center",
            backgroundColor: "#BF360C",
            color: "#fff",
          }}
        >
          <Typography variant="h2" component="h2" sx={{ fontWeight: 800, mb: 1, color: "#fff", fontSize: { xs: "1.4rem", md: "1.9rem" } }}>
            {ctaTitle}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: "rgba(255,255,255,0.9)", maxWidth: 560, mx: "auto" }}>
            {ctaDesc}
          </Typography>
          <Button
            href={whatsUrl}
            target="_blank"
            variant="contained"
            size="large"
            startIcon={<WhatsApp />}
            sx={{
              backgroundColor: "#25D366",
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              px: 4,
              py: 1.5,
              "&:hover": { backgroundColor: "#1eb958" },
            }}
          >
            Chamar no WhatsApp
          </Button>
        </Paper>
      </Container>

      <Footer />
      {editarHref && <BotaoEditarPagina href={editarHref} />}
    </Box>
  );
}
