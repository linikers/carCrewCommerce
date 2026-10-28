"use client";

import Link from "next/link";
import { Container, Typography, Button, Box, Stack } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEmpresa } from "@/components/EmpresaProvider";
import { linkWhatsApp } from "@/lib/empresa-contato";

const atalhos = [
  { label: "Suspensão a ar", href: "/suspensao-a-ar" },
  { label: "Rebaixados", href: "/rebaixamento" },
  { label: "Suspensão esportiva", href: "/suspensao-esportiva" },
  { label: "Off-road", href: "/off-road" },
];

/**
 * 404 com a marca da loja.
 * Antes o Next devolvia a tela padrão ("This page could not be found"), sem
 * cabeçalho, sem busca e sem saída — quem chegava por link antigo de produto
 * removido simplesmente saía do site.
 */
export default function NotFound() {
  const contato = useEmpresa();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container maxWidth="sm" sx={{ flex: 1, py: { xs: 8, md: 12 }, textAlign: "center" }}>
        <Typography
          component="p"
          sx={{ fontSize: "4rem", fontWeight: 900, color: "#E65100", lineHeight: 1 }}
        >
          404
        </Typography>

        <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mt: 2, mb: 1.5 }}>
          Essa peça saiu de linha
        </Typography>

        <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
          A página que você procurou não existe mais ou mudou de endereço. Veja as linhas que
          trabalhamos ou fale com a gente que a gente acha a peça pra você.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 4, justifyContent: "center" }}>
          {atalhos.map((a) => (
            <Button
              key={a.href}
              component={Link}
              href={a.href}
              variant="outlined"
              sx={{ textTransform: "none", borderColor: "#d0d0d0", color: "#1A1A1A" }}
            >
              {a.label}
            </Button>
          ))}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "center" }}>
          <Button
            component={Link}
            href="/"
            variant="contained"
            sx={{
              backgroundColor: "#BF360C",
              "&:hover": { backgroundColor: "#8C2A09" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Voltar para a home
          </Button>
          <Button
            href={linkWhatsApp(
              contato.telefone,
              "Olá! Preciso de ajuda para encontrar uma peça"
            )}
            target="_blank"
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            sx={{ textTransform: "none", borderColor: "#0E7A3F", color: "#0E7A3F" }}
          >
            Falar no WhatsApp
          </Button>
        </Stack>
      </Container>
      <Footer />
    </Box>
  );
}
