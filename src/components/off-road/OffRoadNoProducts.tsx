"use client";

import { useEmpresa } from "@/components/EmpresaProvider";
import { linkWhatsApp } from "@/lib/empresa-contato";

import { Box, Button, Paper, Typography } from "@mui/material";
import { WhatsApp } from "@mui/icons-material";
import Link from "next/link";

export default function OffRoadNoProducts() {
  const contato = useEmpresa();
  return (
    <Paper
      sx={{
        p: 5,
        textAlign: "center",
        borderRadius: 3,
        mb: 4,
        backgroundColor: "#f9f9f9",
      }}
    >
      <Typography variant="h6" sx={{ color: "#666", mb: 2 }}>
        Catálogo off-road em construção
      </Typography>
      <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
        Estamos preparando uma seleção especial de peças para off-road. Entre em contato para orçamentos personalizados.
      </Typography>
      <Button
        variant="contained"
        startIcon={<WhatsApp />}
        href={linkWhatsApp(
          contato.telefone,
          `Olá! Quero ver produtos off-road da ${contato.nome}.`
        )}
        target="_blank"
        sx={{
          backgroundColor: "#25D366",
          "&:hover": { backgroundColor: "#1da851" },
          textTransform: "none",
          fontWeight: 600,
        }}
      >
        Falar com Especialista
      </Button>
    </Paper>
  );
}
