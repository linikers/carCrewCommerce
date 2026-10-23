"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import {
  Visibility,
  ShoppingBag,
  CheckCircle,
  LocalShipping,
  Cancel,
} from "@mui/icons-material";
import Header from "@/components/Header";
import AdminLayout from "@/components/admin/AdminLayout";
import { STATUS_PEDIDO, STATUS_COLOR, labelStatus } from "@/lib/pedido-status";

interface PedidoItem {
  nome: string;
  preco: number;
  quantidade: number;
}

interface Pedido {
  id: string;
  userId: string;
  items: PedidoItem[];
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string | null; email: string | null };
}

export default function AdminPedidos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [alterando, setAlterando] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
    if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      carregarPedidos();
    }
  }, [status, session]);

  async function carregarPedidos() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/pedidos");
      if (!res.ok) throw new Error("Erro ao carregar pedidos");
      const data = await res.json();
      setPedidos(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function alterarStatus(id: string, novoStatus: string) {
    if (alterando) return; // evita duplo clique mandando dois PATCH
    try {
      setError("");
      setAlterando(id);
      const res = await fetch("/api/admin/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: novoStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar status");
      }
      await carregarPedidos();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAlterando(null);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // O id é um cuid; mostrar 8 caracteres do começo não diz nada a ninguém.
  // Os 6 últimos são o que a pessoa usa para localizar o pedido.
  const idCurto = (id: string) => id.slice(-6).toUpperCase();

  const filtrados = pedidos.filter((p) => {
    if (filtro !== "todos" && p.status !== filtro) return false;
    if (busca.trim()) {
      const t = busca.trim().toLowerCase();
      const alvo = `${p.user?.name ?? ""} ${p.user?.email ?? ""} ${p.id}`.toLowerCase();
      if (!alvo.includes(t)) return false;
    }
    return true;
  });

  const somaFiltrada = filtrados.reduce((soma, p) => soma + p.total, 0);

  const statusValidos = [...STATUS_PEDIDO];

  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user?.admin) return null;

  return (
    <>
      <Header cartItemCount={0} />
      <AdminLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
                Pedidos
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
                {pedidos.length} pedido(s) · {formatPrice(somaFiltrada)} no filtro atual
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2, alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Buscar por cliente, e-mail ou código"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              sx={{ minWidth: 280, backgroundColor: "#fff" }}
            />
            {["todos", ...statusValidos].map((st) => {
              const qtd = st === "todos" ? pedidos.length : pedidos.filter((p) => p.status === st).length;
              return (
                <Chip
                  key={st}
                  label={`${st === "todos" ? "Todos" : st} (${qtd})`}
                  onClick={() => setFiltro(st)}
                  variant={filtro === st ? "filled" : "outlined"}
                  color={filtro === st ? "primary" : "default"}
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                />
              );
            })}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filtrados.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: "center" }}>
              <ShoppingBag sx={{ fontSize: 64, color: "#ccc", mb: 2 }} />
              <Typography variant="h6" sx={{ color: "#666" }}>
                {pedidos.length === 0 ? "Nenhum pedido ainda" : "Nenhum pedido neste filtro"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {pedidos.length === 0
                  ? "Os pedidos realizados no site aparecerão aqui"
                  : "Tente outro status ou limpe a busca"}
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflowX: "auto" }}>
              <Table sx={{ minWidth: 820 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#fafafa" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Pedido</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Itens</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrados.map((pedido) => (
                    <TableRow
                      key={pedido.id}
                      hover
                      sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600 }} title={pedido.id}>
                          #{idCurto(pedido.id)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {pedido.user?.name || "—"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#888" }}>
                          {pedido.user?.email || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(pedido.items as PedidoItem[]).length} item(ns)
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {formatPrice(pedido.total)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: "#666" }}>
                          {formatDate(pedido.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={labelStatus(pedido.status)}
                          color={STATUS_COLOR[pedido.status as keyof typeof STATUS_COLOR] ?? "default"}
                          size="small"
                          variant="filled"
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/admin/pedidos/${pedido.id}`)}
                            sx={{ color: "#BF360C" }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {(pedido.status === "pendente" || pedido.status === "aguardando_pagamento") && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              disabled={alterando === pedido.id}
                              onClick={() => alterarStatus(pedido.id, "pago")}
                              sx={{ fontSize: "0.7rem", py: 0.25, minWidth: 60 }}
                              startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                            >
                              Pago
                            </Button>
                          )}
                          {pedido.status === "pago" && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              disabled={alterando === pedido.id}
                              onClick={() => alterarStatus(pedido.id, "em_separacao")}
                              sx={{ fontSize: "0.7rem", py: 0.25, minWidth: 60 }}
                              startIcon={<LocalShipping sx={{ fontSize: 14 }} />}
                            >
                              Separar
                            </Button>
                          )}
                          {pedido.status === "em_separacao" && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              disabled={alterando === pedido.id}
                              onClick={() => alterarStatus(pedido.id, "enviado")}
                              sx={{ fontSize: "0.7rem", py: 0.25, minWidth: 60 }}
                              startIcon={<LocalShipping sx={{ fontSize: 14 }} />}
                            >
                              Enviar
                            </Button>
                          )}
                          {pedido.status === "enviado" && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              disabled={alterando === pedido.id}
                              onClick={() => alterarStatus(pedido.id, "entregue")}
                              sx={{ fontSize: "0.7rem", py: 0.25, minWidth: 60 }}
                              startIcon={<LocalShipping sx={{ fontSize: 14 }} />}
                            >
                              Entregue
                            </Button>
                          )}
                          {(pedido.status === "pendente" || pedido.status === "aguardando_pagamento" || pedido.status === "pago" || pedido.status === "em_separacao") && (
                            <IconButton
                              size="small"
                              disabled={alterando === pedido.id}
                              onClick={() => alterarStatus(pedido.id, "cancelado")}
                              sx={{ color: "#e57373" }}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Container>
      </AdminLayout>
    </>
  );
}
