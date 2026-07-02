"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box, Container, Typography, Grid, Paper, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
} from "@mui/material";
import {
  Inventory2, ShoppingBag, People, TrendingUp, Add, Category, ViewCarousel,
} from "@mui/icons-material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import Ga4Dashboard from "@/components/admin/Ga4Dashboard";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress sx={{ color: "#E65100" }} />
        </Box>
      </AdminLayout>
    );
  }

  if (status === "unauthenticated" || !session?.user?.admin) {
    return (
      <AdminLayout>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Acesso restrito</Typography>
          <Button variant="contained" onClick={() => router.push("/admin/login")}
            sx={{ mt: 2, backgroundColor: "#E65100", textTransform: "none" }}>
            Ir para Login
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  const cards = [
    { label: "Produtos", value: String(stats?.produtos || 0), icon: <Inventory2 />, color: "#E65100", link: "/admin/produtos" },
    { label: "Estoque total", value: String(stats?.estoque || 0), icon: <TrendingUp />, color: "#1565c0", link: "/admin/produtos" },
    { label: "Usuários", value: String(stats?.usuarios || 0), icon: <People />, color: "#2e7d32", link: "/admin/produtos" },
    { label: "Banners ativos", value: String(stats?.banners || 0), icon: <ViewCarousel />, color: "#6a1b9a", link: "/admin/banners" },
  ];

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: "#1A1A1A" }}>
          Painel Admin
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", mb: 4 }}>
          Bem-vindo, {session?.user?.name}
        </Typography>

        {/* Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {cards.map((card) => (
            <Grid size={{ xs: 6, md: 3 }} key={card.label}>
              <Paper
                onClick={() => router.push(card.link)}
                sx={{ p: 3, borderRadius: 3, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", transition: "0.2s", "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.12)" } }}
              >
                <Box sx={{ color: card.color, fontSize: 40 }}>{card.icon}</Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>{card.value}</Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>{card.label}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* GA4 Analytics */}
        <Ga4Dashboard />

        {/* Gráfico */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Vendas (simulado)</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.vendasPorMes || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" stroke="#999" fontSize={13} />
              <YAxis stroke="#999" fontSize={13} />
              <Tooltip />
              <Legend />
              <Bar dataKey="valor" name="Vendas (R$)" fill="#E65100" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pedidos" name="Pedidos" fill="#1A1A1A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Últimos produtos */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Últimos Produtos</Typography>
            <Button size="small" onClick={() => router.push("/admin/produtos")}
              sx={{ textTransform: "none", color: "#E65100" }}>Ver todos</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Preço</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estoque</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(stats?.ultimosProdutos) && stats.ultimosProdutos.map((p: any) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.nome?.substring(0, 40)}</TableCell>
                    <TableCell>R$ {p.preco?.toFixed(2)}</TableCell>
                    <TableCell><Chip label={p.estoque} size="small" variant="outlined" /></TableCell>
                  </TableRow>
                ))}
                {(!stats?.ultimosProdutos || stats.ultimosProdutos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ textAlign: "center", color: "#999", py: 3 }}>
                      Nenhum produto cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pedidos recentes */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Pedidos Recentes</Typography>
          <Typography variant="body2" sx={{ color: "#999", py: 3, textAlign: "center" }}>
            Nenhum pedido registrado ainda. Quando houver pedidos, aparecerão aqui.
          </Typography>
        </Paper>

        {/* Ações rápidas */}
        <Typography variant="h6" sx={{ fontWeight: 600, mt: 4, mb: 2 }}>Ações Rápidas</Typography>
        <Grid container spacing={2}>
          {[
            { label: "Novo Produto", icon: <Add />, path: "/admin/produtos/novo", dashed: true },
            { label: "Gerenciar Produtos", icon: <Inventory2 />, path: "/admin/produtos", dashed: false },
            { label: "Categorias", icon: <Category />, path: "/admin/categorias", dashed: false },
            { label: "Banners", icon: <ViewCarousel />, path: "/admin/banners", dashed: false },
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.label}>
              <Paper
                onClick={() => router.push(item.path)}
                sx={{
                  p: 2.5, borderRadius: 3, textAlign: "center", cursor: "pointer",
                  border: item.dashed ? "2px dashed #ddd" : "2px solid #ddd",
                  transition: "0.2s",
                  "&:hover": { borderColor: "#E65100", bgcolor: "#fff5f0" },
                }}
              >
                <Box sx={{ color: "#E65100", fontSize: 32, mb: 1 }}>{item.icon}</Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </AdminLayout>
  );
}
