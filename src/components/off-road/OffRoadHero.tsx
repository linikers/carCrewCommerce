"use client";

import { Box, Button, Container, Typography, Chip } from "@mui/material";
import { WhatsApp } from "@mui/icons-material";
import Link from "next/link";

export default function OffRoadHero() {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: 400, md: 550 },
        background: "linear-gradient(135deg, #1A1A1A 0%, #2c1810 50%, #E65100 100%)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        py: 6,
      }}
    >
      <Box
        component="img"
        src="/banners/banner-offroad.png"
        alt="Suspensão Off-Road Car Crew Garage"
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          width: { xs: "100%", md: "65%" },
          height: "100%",
          objectFit: "cover",
          opacity: { xs: 0.3, md: 0.85 },
        }}
      />
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ maxWidth: { md: "45%" } }}>
          <Chip
            label="MAIS QUE UM CAMINHO, UM ESTILO DE VIDA"
            sx={{
              backgroundColor: "#E65100",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.85rem",
              mb: 3,
              py: 2.5,
              px: 1,
              letterSpacing: "0.05em",
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2.5rem", md: "4rem" },
              lineHeight: 1.1,
              mb: 2,
              textShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          >
            POR QUE
            <br />
            <Box component="span" sx={{ color: "#E65100" }}>OFF-ROAD?</Box>
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              mb: 4,
              color: "#eee",
              fontSize: { xs: "1rem", md: "1.25rem" },
            }}
          >
            Prepare sua picape para qualquer terreno. Lift kits 4x4, suspensão off-road e acessórios para trilha em Maringá/PR.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={<WhatsApp />}
              href="https://wa.me/5544998133182?text=Olá! Quero fazer um orçamento para suspensão off-road."
              target="_blank"
              sx={{
                backgroundColor: "#25D366",
                "&:hover": { backgroundColor: "#1da851" },
                textTransform: "none",
                fontWeight: 700,
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
              }}
            >
              Orçamento Grátis
            </Button>
            <Button
              component={Link}
              href="#produtos-offroad"
              variant="outlined"
              sx={{
                color: "#fff",
                borderColor: "#fff",
                textTransform: "none",
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "#E65100" },
              }}
            >
              Ver Produtos
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
