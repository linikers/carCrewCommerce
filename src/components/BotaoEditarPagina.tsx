"use client";

import { Box, Button } from "@mui/material";
import { Edit } from "@mui/icons-material";
import Link from "next/link";

/**
 * Atalho de edição na própria página, visível só para quem está logado no
 * painel. A página passa `editarHref` apenas quando a sessão é de admin —
 * visitante nunca recebe o link no HTML.
 */
export default function BotaoEditarPagina({ href }: { href: string }) {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: { xs: 16, md: 24 },
        left: { xs: 16, md: 24 },
        zIndex: 1300,
      }}
    >
      <Button
        component={Link}
        href={href}
        variant="contained"
        size="small"
        startIcon={<Edit />}
        sx={{
          backgroundColor: "#1A1A1A",
          color: "#fff",
          textTransform: "none",
          fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          "&:hover": { backgroundColor: "#333" },
        }}
      >
        Editar esta página
      </Button>
    </Box>
  );
}
