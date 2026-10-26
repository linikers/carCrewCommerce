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
import AdminLayout from "@/components/admin/AdminLayout";
import { labelStatus, STATUS_COLOR } from "@/lib/pedido-status";
import { formatBRL } from "@/lib/format";
import { formatarDocumento } from "@/lib/documento";

interface PedidoItem {
  nome: string;
  preco: number;
  quantidade: number;
  /** só existe no item novo (#72); pedido antigo não tem */
  sku?: string | null;
  imgUrl?: string | null;
}

interface Pedido {
  id: string;
  userId: string;
  items?: PedidoItem[];
  itens?: {
    id: string;
    nome: string;
    sku: string | null;
    preco: number;
    quantidade: number;
    total: number;
  }[];
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  frete?: number | null;
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  clienteEmail?: string | null;
  clienteDocumento?: string | null;
  enderecoEntrega?: {
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    bairro?: string | null;
    cidade?: string | null;
  } | null;
  user?: { id: string; name: string | null; email: string | null };
}

const MAPA_STATUS: Record<string, string> = {
  pendente: "aguardando_pagamento",
  preparando: "em_separacao",
  confirmado: "pago",
};

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
    // acompanha o vocabulário de src/lib/pedido-status.ts
    const map: Record<string, { status: string; label: string; color: "info" | "success"; icon: React.ReactNode }> = {
      pendente: { status: "pago", label: "Marcar como Pago", color: "info", icon: <CheckCircle /> },
      aguardando_pagamento: { status: "pago", label: "Marcar como Pago", color: "info", icon: <CheckCircle /> },
      pago: { status: "em_separacao", label: "Separar para envio", color: "info", icon: <LocalShipping /> },
      em_separacao: { status: "enviado", label: "Marcar como Enviado", color: "info", icon: <LocalShipping /> },
      enviado: { status: "entregue", label: "Marcar como Entregue", color: "success", icon: <LocalShipping /> },
    };
    return map[pedido.status] || null;
  };

  return (
    <>
      <AdminLayout title="Pedido">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push("/admin/pedidos")}
            sx={{ mb: 2, color: "#BF360C" }}
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
                      Pedido #{pedido.id.slice(-6).toUpperCase()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
                      Criado em {formatDate(pedido.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Chip
                      label={labelStatus(pedido.status)}
                      color={STATUS_COLOR[pedido.status as keyof typeof STATUS_COLOR] ?? "default"}
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
                      {pedido.clienteNome || pedido.user?.name || "—"}
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
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      Telefone
                    </Typography>
                    <Typography variant="body1">
                      {pedido.clienteTelefone || "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      E-mail do pedido
                    </Typography>
                    <Typography variant="body1">
                      {pedido.clienteEmail || "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      CPF / CNPJ
                    </Typography>
                    <Typography variant="body1">
                      {pedido.clienteDocumento
                        ? formatarDocumento(pedido.clienteDocumento)
                        : "—"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Entrega — 6.1 */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1A1A1A" }}>
                  Entrega
                </Typography>
                {pedido.enderecoEntrega ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    <Box sx={{ flex: "2 1 320px" }}>
                      <Typography variant="caption" sx={{ color: "#888" }}>Endereço</Typography>
                      <Typography variant="body1">
                        {[
                          pedido.enderecoEntrega.logradouro,
                          pedido.enderecoEntrega.numero,
                          pedido.enderecoEntrega.bairro,
                          pedido.enderecoEntrega.cidade,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: "1 1 120px" }}>
                      <Typography variant="caption" sx={{ color: "#888" }}>CEP</Typography>
                      <Typography variant="body1">{pedido.enderecoEntrega.cep || "—"}</Typography>
                    </Box>
                    <Box sx={{ flex: "1 1 120px" }}>
                      <Typography variant="caption" sx={{ color: "#888" }}>Frete</Typography>
                      <Typography variant="body1">{formatBRL(pedido.frete ?? 0)}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Este pedido não tem endereço registrado (anterior à correção do checkout).
                  </Typography>
                )}
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
                        <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Qtd</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Preço</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* #72: item relacional; pedido antigo ainda vem do JSON */}
                      {(pedido.itens?.length
                        ? pedido.itens.map((i) => ({
                            nome: i.nome,
                            sku: i.sku,
                            quantidade: i.quantidade,
                            preco: i.preco,
                          }))
                        : (pedido.items as PedidoItem[]) || []
                      ).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.nome}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#888" }}>
                            {item.sku || "—"}
                          </TableCell>
                          <TableCell align="center">{item.quantidade}</TableCell>
                          <TableCell align="right">{formatBRL(item.preco)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatBRL(item.preco * item.quantidade)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                  {pedido.frete ? (
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Frete: {formatBRL(pedido.frete)}
                    </Typography>
                  ) : null}
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#BF360C" }}>
                    Total: {formatBRL(pedido.total)}
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
                  {(pedido.status === "pendente" || pedido.status === "aguardando_pagamento" || pedido.status === "pago" || pedido.status === "em_separacao") && (
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
