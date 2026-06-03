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

const statusColors: Record<string, "warning" | "info" | "primary" | "success" | "default" | "error"> = {
  pendente: "warning",
  pago: "info",
  preparando: "primary",
  enviado: "primary",
  entregue: "success",
  cancelado: "error",
};

export default function AdminPedidos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    try {
      setError("");
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
                Gerencie os pedidos da loja
              </Typography>
            </Box>
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
          ) : pedidos.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: "center" }}>
              <ShoppingBag sx={{ fontSize: 64, color: "#ccc", mb: 2 }} />
              <Typography variant="h6" sx={{ color: "#666" }}>
                Nenhum pedido ainda
              </Typography>
              <Typography variant="body2" sx={{ color: "#999" }}>
                Os pedidos realizados no site aparecerão aqui
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <Table>
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
                  {pedidos.map((pedido) => (
                    <TableRow
                      key={pedido.id}
                      hover
                      sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                          #{pedido.id.slice(0, 8)}
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
                          label={pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                          color={statusColors[pedido.status] || "default"}
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
                            sx={{ color: "#E65100" }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {pedido.status === "pendente" && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
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
                              onClick={() => alterarStatus(pedido.id, "entregue")}
                              sx={{ fontSize: "0.7rem", py: 0.25, minWidth: 60 }}
                              startIcon={<LocalShipping sx={{ fontSize: 14 }} />}
                            >
                              Entregue
                            </Button>
                          )}
                          {(pedido.status === "pendente" || pedido.status === "pago") && (
                            <IconButton
                              size="small"
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
