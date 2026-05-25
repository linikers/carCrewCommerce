"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Inventory2,
  ShoppingBag,
  People,
  TrendingUp,
  Logout,
  Add,
  Category,
} from "@mui/icons-material";
import Header from "@/components/Header";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "#E65100" }} />
      </Box>
    );
  }

  if (status === "unauthenticated" || !session?.user?.admin) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Acesso restrito</Typography>
        <Typography variant="body1" sx={{ color: "#666" }}>Faça login como administrador.</Typography>
        <Button variant="contained" onClick={() => router.push("/admin/login")}
          sx={{ backgroundColor: "#E65100", textTransform: "none" }}>
          Ir para Login
        </Button>
      </Box>
    );
  }

  const stats = [
    { label: "Produtos", value: "9", icon: <Inventory2 />, color: "#E65100" },
    { label: "Pedidos", value: "0", icon: <ShoppingBag />, color: "#1A1A1A" },
    { label: "Clientes", value: "1", icon: <People />, color: "#2e7d32" },
    { label: "Vendas (mês)", value: "R$ 0", icon: <TrendingUp />, color: "#1565c0" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
              Painel Admin
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Bem-vindo, {session?.user?.name}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Logout />}
            onClick={() => router.push("/")}
            sx={{ textTransform: "none", color: "#666", borderColor: "#ddd" }}
          >
            Sair do Admin
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box sx={{ color: stat.color, fontSize: 40 }}>{stat.icon}</Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Ações rápidas */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Ações Rápidas
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              onClick={() => router.push("/admin/produtos")}
              sx={{
                p: 3,
                borderRadius: 3,
                textAlign: "center",
                cursor: "pointer",
                border: "2px solid #ddd",
                transition: "all 0.2s",
                "&:hover": { borderColor: "#E65100", bgcolor: "#fff5f0" },
              }}
            >
              <Inventory2 sx={{ fontSize: 40, color: "#1A1A1A", mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Gerenciar Produtos
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Listar, editar e excluir produtos
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              onClick={() => router.push("/admin/categorias")}
              sx={{
                p: 3,
                borderRadius: 3,
                textAlign: "center",
                cursor: "pointer",
                border: "2px solid #ddd",
                transition: "all 0.2s",
                "&:hover": { borderColor: "#E65100", bgcolor: "#fff5f0" },
              }}
            >
              <Category sx={{ fontSize: 40, color: "#1A1A1A", mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Categorias
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Gerenciar categorias de produtos
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              onClick={() => router.push("/admin/produtos")}
              sx={{
                p: 3,
                borderRadius: 3,
                textAlign: "center",
                cursor: "pointer",
                border: "2px solid #ddd",
                transition: "all 0.2s",
                "&:hover": { borderColor: "#E65100", bgcolor: "#fff5f0" },
              }}
            >
              <Inventory2 sx={{ fontSize: 40, color: "#1A1A1A", mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Gerenciar Produtos
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Listar, editar e excluir produtos
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
