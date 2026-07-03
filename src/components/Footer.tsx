"use client";

import {
  Box,
  Container,
  Typography,
  IconButton,
  Divider,
  Link,
} from "@mui/material";
import {
  WhatsApp,
  Instagram,
  Facebook,
} from "@mui/icons-material";
import NextLink from "next/link";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#1A1A1A",
        color: "#ffffff",
        mt: "auto",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          {/* Logo + Descrição */}
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 30%" } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#E65100",
                mb: 1,
              }}
            >
              Car Crew Garage
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaaaaa", mb: 2 }}>
              Especialistas em peças para suspensão automotiva.
              Amortecedores, molas, calços, ponta de eixo e muito mais.
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <IconButton
                href="https://wa.me/5544998133182"
                target="_blank"
                sx={{ color: "#25D366" }}
              >
                <WhatsApp />
              </IconButton>
              <IconButton
                href="https://www.instagram.com/carcrewgarage_/"
                target="_blank"
                sx={{ color: "#ffffff" }}
              >
                <Instagram />
              </IconButton>
              <IconButton
                href="https://www.facebook.com/CarCrewG"
                target="_blank"
                sx={{ color: "#ffffff" }}
              >
                <Facebook />
              </IconButton>
            </Box>
          </Box>

          {/* Links rápidos */}
          <Box sx={{ flex: { xs: "1 1 calc(50% - 16px)", md: "0 1 auto" }, minWidth: 140 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 2, color: "#E65100" }}
            >
              Categorias
            </Typography>
            {[
              "Amortecedores",
              "Calço Antirruído",
              "Ponta de Eixo",
              "Bolsa de Ar",
              "Molas",
            ].map((item) => (
              <Typography
                key={item}
                variant="body2"
                sx={{
                  color: "#aaaaaa",
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": { color: "#E65100" },
                }}
              >
                {item}
              </Typography>
            ))}
          </Box>

          {/* Institucional */}
          <Box sx={{ flex: { xs: "1 1 calc(50% - 16px)", md: "0 1 auto" }, minWidth: 140 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 2, color: "#E65100" }}
            >
              Institucional
            </Typography>
            {[
              { label: "Sobre Nós", href: "/sobre" },
              { label: "FAQ", href: "/faq" },
              { label: "Suspensão Off-Road", href: "/off-road" },
              { label: "Política de Privacidade", href: "/privacidade" },
              { label: "Trocas e Devoluções", href: "/trocas" },
              { label: "Fale Conosco", href: "https://wa.me/5544998133182" },
            ].map((item) => (
              <Typography
                key={item.label}
                variant="body2"
                component={NextLink}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                sx={{
                  color: "#aaaaaa",
                  mb: 1,
                  cursor: "pointer",
                  display: "block",
                  textDecoration: "none",
                  "&:hover": { color: "#E65100" },
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Box>

          {/* Atendimento */}
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 25%" } }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 2, color: "#E65100" }}
            >
              Atendimento
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaaaaa", mb: 1 }}>
              📞 (44) 99813-3182
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaaaaa", mb: 1 }}>
              ✉️ carcrewgarage@gmail.com
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaaaaa", mb: 1 }}>
              🕐 Seg–Sex: 08h–18h | Sáb: 09h–11h
            </Typography>
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <WhatsApp sx={{ color: "#25D366", fontSize: 28 }} />
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#25D366" }}
                >
                  Fale conosco no WhatsApp
                </Typography>
                <Typography variant="caption" sx={{ color: "#aaaaaa" }}>
                  Respondemos em até 5 minutos
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      <Box sx={{ py: 3, textAlign: "center" }}>
        <Typography variant="body2" sx={{ color: "#777777" }}>
          © {new Date().getFullYear()} Car Crew Garage. Todos os direitos
          reservados.
        </Typography>
      </Box>
    </Box>
  );
}
