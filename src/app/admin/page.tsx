"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box, Container, Typography, Grid, Paper, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert,
} from "@mui/material";
import {
  Inventory2, ShoppingBag, TrendingUp, ViewCarousel, WarningAmber,
} from "@mui/icons-material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import Ga4Dashboard from "@/components/admin/Ga4Dashboard";
import { formatBRL, formatDataCurta } from "@/lib/format";
import { Paid, Percent } from "@mui/icons-material";
import { STATUS_LABEL, STATUS_COLOR } from "@/lib/pedido-status";

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
      <AdminLayout title="Dashboard">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress sx={{ color: "#BF360C" }} />
        </Box>
      </AdminLayout>
    );
  }

  if (status === "unauthenticated" || !session?.user?.admin) {
    return (
      <AdminLayout title="Dashboard">
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Acesso restrito</Typography>
          <Button variant="contained" onClick={() => router.push("/admin/login")}
            sx={{ mt: 2, backgroundColor: "#BF360C", textTransform: "none" }}>
            Ir para Login
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  const cards = [
    { label: "Resultado do mês", value: formatBRL(stats?.resultado ?? 0), icon: <Paid />, color: (stats?.resultado ?? 0) < 0 ? "#b3261e" : "#0E7A3F", link: "/admin/relatorios" },
    { label: "Margem", value: `${Number(stats?.margemPercent ?? 0).toFixed(1).replace(".", ",")}%`, icon: <Percent />, color: (stats?.resultado ?? 0) < 0 ? "#b3261e" : "#0E7A3F", link: "/admin/relatorios" },
    { label: "Produtos ativos", value: String(stats?.produtos ?? 0), icon: <Inventory2 />, color: "#BF360C", link: "/admin/produtos" },
    { label: "Pedidos abertos", value: String(stats?.pedidosAbertos ?? 0), icon: <ShoppingBag />, color: "#8C2A09", link: "/admin/pedidos" },
    { label: "Vendas (6 meses)", value: formatBRL(stats?.totalVendas ?? 0), icon: <TrendingUp />, color: "#0E7A3F", link: "/admin/pedidos" },
    { label: "Banners ativos", value: String(stats?.banners ?? 0), icon: <ViewCarousel />, color: "#666", link: "/admin/banners" },
  ];

  const alertas = stats?.alertas || { semPreco: 0, esgotados: 0, estoqueBaixo: 0 };
  const temAlerta = alertas.semPreco > 0 || alertas.esgotados > 0 || alertas.estoqueBaixo > 0;

  const corStatus = (status: string) =>
    (STATUS_COLOR as Record<string, "warning" | "info" | "primary" | "success" | "error">)[status] || "warning";
  const rotuloStatus = (status: string) =>
    (STATUS_LABEL as Record<string, string>)[status] || status;

  const alertaCusto = Number(stats?.vendasSemCusto ?? 0);

  return (
    <AdminLayout title="Dashboard">
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
          {alertaCusto > 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert
                severity="warning"
                action={
                  <Button size="small" onClick={() => router.push("/admin/pedidos")} sx={{ textTransform: "none" }}>
                    Ver pedidos
                  </Button>
                }
              >
                {alertaCusto} venda(s) do mês sem custo de peça — o resultado acima não inclui essas
                vendas. Informe o custo para elas entrarem.
              </Alert>
            </Grid>
          )}
        </Grid>

        {/* Alertas de operação — 4.6 */}
        {temAlerta && (
          <Alert
            severity="warning"
            icon={<WarningAmber fontSize="inherit" />}
            sx={{ mb: 4, borderRadius: 2, alignItems: "center" }}
            action={
              <Button
                size="small"
                onClick={() => router.push("/admin/produtos")}
                sx={{ textTransform: "none", color: "#8C2A09" }}
              >
                Revisar produtos
              </Button>
            }
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Precisa de atenção antes de vender
            </Typography>
            <Typography variant="body2">
              {[
                alertas.semPreco > 0 ? `${alertas.semPreco} sem preço` : null,
                alertas.esgotados > 0 ? `${alertas.esgotados} esgotado(s)` : null,
                alertas.estoqueBaixo > 0 ? `${alertas.estoqueBaixo} com estoque baixo` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
          </Alert>
        )}

        {/* GA4 Analytics */}
        <Ga4Dashboard />

        {/* Gráfico */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Vendas (6 meses)</Typography>
          <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
            Soma dos pedidos reais, sem os cancelados.
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.vendasPorMes || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" stroke="#666" fontSize={13} />
              <YAxis stroke="#666" fontSize={13} />
              <Tooltip />
              <Legend />
              <Bar dataKey="valor" name="Vendas (R$)" fill="#BF360C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pedidos" name="Pedidos" fill="#1A1A1A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Últimos produtos */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Últimos Produtos</Typography>
            <Button size="small" onClick={() => router.push("/admin/produtos")}
              sx={{ textTransform: "none", color: "#BF360C" }}>Ver todos</Button>
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
                    <TableCell>{formatBRL(p.preco ?? 0)}</TableCell>
                    <TableCell><Chip label={p.estoque} size="small" variant="outlined" /></TableCell>
                  </TableRow>
                ))}
                {(!stats?.ultimosProdutos || stats.ultimosProdutos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ textAlign: "center", color: "#666", py: 3 }}>
                      Nenhum produto cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pedidos recentes — 4.2: era texto fixo dizendo "nenhum pedido" */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Pedidos Recentes</Typography>
            <Button size="small" onClick={() => router.push("/admin/pedidos")}
              sx={{ textTransform: "none", color: "#BF360C" }}>Ver todos</Button>
          </Box>
          {(!stats?.ultimosPedidos || stats.ultimosPedidos.length === 0) ? (
            <Typography variant="body2" sx={{ color: "#666", py: 3, textAlign: "center" }}>
              Nenhum pedido registrado ainda. Quando houver pedidos, aparecerão aqui.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Pedido</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.ultimosPedidos.map((p: any) => (
                    <TableRow
                      key={p.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => router.push(`/admin/pedidos/${p.id}`)}
                    >
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                        #{String(p.id).slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell>{p.cliente}</TableCell>
                      <TableCell>{formatDataCurta(p.criadoEm)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={rotuloStatus(p.status)} color={corStatus(p.status)} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatBRL(p.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

      </Container>
    </AdminLayout>
  );
}
