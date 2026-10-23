"use client";

import { useEffect, useState } from "react";
import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  /** Título da tela — vai para a barra do mobile e para o título da aba. */
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <IconButton edge="start" onClick={() => setSidebarOpen(true)} sx={{ color: "#1A1A1A" }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {title || "Painel Admin"}
          </Typography>
        </Toolbar>
      </AppBar>

      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Box
        sx={{
          flex: 1,
          ml: { md: "250px" },
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
