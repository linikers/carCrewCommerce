"use client";

import { useEffect, useState } from "react";
import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import { Menu as MenuIcon, Search as SearchIcon } from "@mui/icons-material";
import BuscaGlobal from "./BuscaGlobal";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  /** Título da tela — vai para a barra do mobile e para o título da aba. */
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [buscaMobile, setBuscaMobile] = useState(false);

  // 5.7: todas as abas do admin tinham o mesmo título do documento.
  useEffect(() => {
    document.title = title ? `${title} · Car Crew Garage` : "Painel · Car Crew Garage";
  }, [title]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* 5.4: o botão flutuante cobria o título das telas. Agora existe uma
          barra no mobile, com o botão à esquerda e o nome da tela ao lado. */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { md: "none" },
          backgroundColor: "#fff",
          borderBottom: "1px solid #eee",
          color: "#1A1A1A",
        }}
      >
        <Toolbar variant="dense" sx={{ gap: 1, minHeight: 56 }}>
          <IconButton aria-label="Abrir menu" edge="start" onClick={() => setSidebarOpen(true)} sx={{ width: 44, height: 44, color: "#1A1A1A" }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {title || "Painel Admin"}
          </Typography>
          <IconButton
            sx={{ ml: "auto", color: "#1A1A1A" }}
            aria-label="Buscar no painel"
            onClick={() => setBuscaMobile((v) => !v)}
          >
            <SearchIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Box
        sx={{
          flex: 1,
          // Sem `minWidth: 0` o flex item não encolhe: o conteúdo mantém a
          // largura mínima (458 px em tela de 390) e o `overflow-x: hidden` do
          // body corta os campos pela direita — era o menu "mal dá pra ver" no
          // celular. Com 0 ele respeita o viewport.
          minWidth: 0,
          width: "100%",
          ml: { md: "250px" },
          pt: { xs: "56px", md: 0 }, // espaço da barra fixa do mobile
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* 5.5: breadcrumb só existia em 2 das 9 telas. Agora toda tela do
            painel tem o caminho, discreto, acima do conteúdo. */}
        {title && (
          <Box
            component="nav"
            aria-label="Você está em"
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 0.75,
              px: 4,
              pt: 1.5,
              pb: 0,
            }}
          >
            <Box
              component="a"
              href="/admin"
              sx={{
                color: "#8a8a8a",
                fontSize: "0.75rem",
                textDecoration: "none",
                "&:hover": { color: "primary.main", textDecoration: "underline" },
              }}
            >
              Painel
            </Box>
            <Typography component="span" sx={{ color: "#c4c4c4", fontSize: "0.75rem" }}>
              /
            </Typography>
            <Typography component="span" sx={{ color: "#444", fontSize: "0.75rem", fontWeight: 600 }}>
              {title}
            </Typography>

            {/* busca única do painel: peça, SKU, pedido ou cliente */}
            <Box sx={{ ml: "auto", mr: 4, flexShrink: 0 }}>
              <BuscaGlobal />
            </Box>
          </Box>
        )}

        {buscaMobile && (
          <Box sx={{ display: { md: "none" }, px: 2, pt: 1.5 }}>
            <BuscaGlobal autoFoco />
          </Box>
        )}

        {children}
      </Box>
    </Box>
  );
}
