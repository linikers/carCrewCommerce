"use client";

import { useEmpresa } from "@/components/EmpresaProvider";
import { linkWhatsApp } from "@/lib/empresa-contato";

import { Box, Button, Container, Typography, Chip } from "@mui/material";
import { WhatsApp } from "@mui/icons-material";
import Link from "next/link";

export interface OffRoadHeroProps {
  selo?: string;
  titulo?: string;
  tituloDestaque?: string;
  texto?: string;
  whatsMensagem?: string;
}

/**
 * Texto padrão do hero. O painel (/admin/lp/off-road) sobrescreve por prop —
 * sem prop, a página fica exatamente como sempre foi.
 *
 * O WhatsApp usa o telefone de "Minha empresa": o número estava escrito aqui
 * e mudava de lugar em cada componente.
 */
export default function OffRoadHero({
  selo = "MAIS QUE UM CAMINHO, UM ESTILO DE VIDA",
  titulo = "POR QUE",
  tituloDestaque = "OFF-ROAD?",
  texto = "Prepare sua picape para qualquer terreno. Lift kits 4x4, suspensão off-road e acessórios para trilha em Maringá/PR.",
  whatsMensagem = "Olá! Quero fazer um orçamento para suspensão off-road.",
}: OffRoadHeroProps) {
  const contato = useEmpresa();
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: 400, md: 550 },
        backgroundColor: "#1A1A1A",
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
        {/* Painel escuro semi-transparente atrás do texto pra garantir legibilidade */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            left: 0,
            top: -60,
            width: "42%",
            height: "calc(100% + 120px)",
            background: "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)",
            pointerEvents: "none",
          }}
        />
        <Box sx={{ position: "relative", maxWidth: { xs: "100%", md: "38%" } }}>
          <Chip
            label={selo}
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
            component="h1"
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2.5rem", md: "4rem" },
              lineHeight: 1.1,
              mb: 2,
              textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <Box component="span" sx={{ color: "#fff" }}>{titulo}</Box>
            <br />
            <Box component="span" sx={{ color: "#FF7722" }}>{tituloDestaque}</Box>
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              mb: 4,
              color: "#fff",
              fontSize: { xs: "1rem", md: "1.25rem" },
              textShadow: "0 1px 4px rgba(0,0,0,0.7)",
            }}
          >
            {texto}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={<WhatsApp />}
              href={linkWhatsApp(contato.telefone, whatsMensagem)}
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
