"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import {
  ArrowBack,
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
  imgUrl?: string | null;
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

const statusColors: Record<string, "warning" | "info" | "primary" | "success" | "error"> = {
  pendente: "warning",
  pago: "info",
  preparando: "primary",
  enviado: "primary",
  entregue: "success",
  cancelado: "error",
};

export default function PedidoDetalhe() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
    if (authStatus === "authenticated" && !session?.user?.admin) {
      router.push("/");
      return;
    }
    if (authStatus === "authenticated" && id) {
      carregarPedido();
    }
  }, [authStatus, session, id]);

  async function carregarPedido() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/pedidos/${id}`);
      if (!res.ok) throw new Error("Pedido não encontrado");
      const data = await res.json();
      setPedido(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function alterarStatus(novoStatus: string) {
    if (!pedido) return;
    try {
      setUpdating(true);
      setError("");
      const res = await fetch("/api/admin/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pedido.id, status: novoStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar");
      }
      await carregarPedido();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdating(false);
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (authStatus === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user?.admin) return null;

  const proximoStatus = (): { status: string; label: string; color: "info" | "success"; icon: React.ReactNode } | null => {
    if (!pedido) return null;
    const map: Record<string, { status: string; label: string; color: "info" | "success"; icon: React.ReactNode }> = {
      pendente: { status: "pago", label: "Marcar como Pago", color: "info", icon: <CheckCircle /> },
      pago: { status: "enviado", label: "Marcar como Enviado", color: "info", icon: <LocalShipping /> },
      enviado: { status: "entregue", label: "Marcar como Entregue", color: "success", icon: <LocalShipping /> },
    };
    return map[pedido.status] || null;
  };

  return (
    <>
      <Header cartItemCount={0} />
      <AdminLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push("/admin/pedidos")}
            sx={{ mb: 2, color: "#E65100" }}
          >
            Voltar para Pedidos
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : !pedido ? (
            <Alert severity="warning">Pedido não encontrado</Alert>
          ) : (
            <>
              {/* Cabeçalho */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
                      Pedido #{pedido.id.slice(0, 8)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
                      Criado em {formatDate(pedido.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Chip
                      label={pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                      color={statusColors[pedido.status] || "default"}
                      sx={{ fontWeight: 600, fontSize: "0.85rem", py: 1 }}
                    />
                  </Box>
                </Box>
              </Paper>

              {/* Cliente */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1A1A1A" }}>
                  Cliente
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      Nome
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {pedido.user?.name || "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {pedido.user?.email || "—"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Itens */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1A1A1A" }}>
                  Itens do Pedido
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Qtd</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Preço</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(pedido.items as PedidoItem[]).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.nome}</TableCell>
                          <TableCell align="center">{item.quantidade}</TableCell>
                          <TableCell align="right">{formatPrice(item.preco)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatPrice(item.preco * item.quantidade)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#E65100" }}>
                    Total: {formatPrice(pedido.total)}
                  </Typography>
                </Box>
              </Paper>

              {/* Ações */}
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1A1A1A" }}>
                  Ações
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {proximoStatus() && (
                    <Button
                      variant="contained"
                      color={proximoStatus()!.color}
                      startIcon={proximoStatus()!.icon}
                      onClick={() => alterarStatus(proximoStatus()!.status)}
                      disabled={updating}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      {proximoStatus()!.label}
                    </Button>
                  )}
                  {(pedido.status === "pendente" || pedido.status === "pago") && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => alterarStatus("cancelado")}
                      disabled={updating}
                      sx={{ textTransform: "none" }}
                    >
                      Cancelar Pedido
                    </Button>
                  )}
                </Box>
              </Paper>
            </>
          )}
        </Container>
      </AdminLayout>
    </>
  );
}
