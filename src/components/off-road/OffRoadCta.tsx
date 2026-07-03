"use client";

import { Box, Button, Paper, Typography } from "@mui/material";
import { WhatsApp } from "@mui/icons-material";
import Link from "next/link";

export default function OffRoadCta() {
  return (
    <Paper
      sx={{
        p: { xs: 4, md: 6 },
        borderRadius: 3,
        textAlign: "center",
        backgroundColor: "#E65100",
        color: "#fff",
        mt: 6,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
        Pronto pra encarar qualquer terreno?
      </Typography>
      <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.9)", mb: 4, fontSize: "1.1rem" }}>
        Solicite um orçamento personalizado. Atendemos Maringá/PR e enviamos para todo o Brasil.
      </Typography>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={<WhatsApp />}
          href="https://wa.me/5544998133182"
          target="_blank"
          sx={{
            backgroundColor: "#fff",
            color: "#E65100",
            "&:hover": { backgroundColor: "#f5f5f5" },
            textTransform: "none",
            fontWeight: 700,
            px: 5,
            py: 1.5,
            fontSize: "1.1rem",
          }}
        >
          Falar no WhatsApp
        </Button>
        <Button
          component={Link}
          href="/"
          variant="outlined"
          sx={{
            color: "#fff",
            borderColor: "#fff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "#fff" },
            textTransform: "none",
            fontWeight: 600,
            px: 5,
            py: 1.5,
          }}
        >
          Ver Loja Completa
        </Button>
      </Box>
    </Paper>
  );
}
