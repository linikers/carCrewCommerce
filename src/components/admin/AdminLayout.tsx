"use client";

import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile toggle */}
      <IconButton
        onClick={() => setSidebarOpen(true)}
        sx={{
          position: "fixed",
          top: 8,
          left: 8,
          zIndex: 1200,
          display: { md: "none" },
          color: "#1A1A1A",
          backgroundColor: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          "&:hover": { backgroundColor: "#f5f5f5" },
        }}
      >
        <MenuIcon />
      </IconButton>

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
