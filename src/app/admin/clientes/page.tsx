"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { People } from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatBRL } from "@/lib/format";

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  pedidos: number;
  total: number;
  ultimoPedido: string;
}

interface Resposta {
  clientes: Cliente[];
  resumo: { total: number; receita: number; recorrentes: number };
}

export default function AdminClientes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dados, setDados] = useState<Resposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/clientes")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || "Falha ao carregar clientes");
        setDados(d);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar clientes"))
      .finally(() => setLoading(false));
  }, [status, router]);

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const clientes = (dados?.clientes || []).filter((c) => {
    if (!busca.trim()) return true;
    const t = busca.trim().toLowerCase();
    return (
      c.nome.toLowerCase().includes(t) ||
      (c.email || "").toLowerCase().includes(t) ||
      (c.telefone || "").includes(t)
    );
  });

  const exportarCSV = () => {
    const linhas = [
      ["Nome", "Email", "Telefone", "Pedidos", "Total gasto", "Ultimo pedido"],
      ...clientes.map((c) => [
        c.nome,
        c.email || "",
        c.telefone || "",
        String(c.pedidos),
        c.total.toFixed(2).replace(".", ","),
        formatarData(c.ultimoPedido),
      ]),
    ];
    const csv = linhas.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading" || !session?.user?.admin) {
    return (
      <AdminLayout>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress sx={{ color: "#BF360C" }} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 9, md: 4 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Clientes</Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              {dados?.resumo.total ?? 0} cliente(s) · {formatBRL(dados?.resumo.receita ?? 0)} em compras ·{" "}
              {dados?.resumo.recorrentes ?? 0} recorrente(s)
            </Typography>
          </Box>
          {clientes.length > 0 && (
            <Button variant="outlined" onClick={exportarCSV} sx={{ textTransform: "none" }}>
              Exportar CSV
            </Button>
          )}
        </Box>

        {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>{erro}</Alert>}

        <TextField
          fullWidth
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ mb: 3 }}
        />

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#BF360C" }} />
          </Box>
        ) : clientes.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
            <People sx={{ fontSize: 40, color: "#ccc", mb: 1 }} />
            <Typography variant="h6" sx={{ color: "#666" }}>
              {busca ? "Nenhum cliente encontrado" : "Nenhuma compra registrada ainda"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
              {busca
                ? "Tente outro nome, e-mail ou telefone."
                : "Quando o primeiro pedido entrar, o cliente aparece aqui."}
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contato</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Pedidos</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Último pedido</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total gasto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientes.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.nome}</Typography>
                      {c.pedidos > 1 && (
                        <Chip label="recorrente" size="small" sx={{ mt: 0.5, height: 18, fontSize: 10 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#555" }}>{c.email || "—"}</Typography>
                      <Typography variant="caption" sx={{ color: "#888" }}>{c.telefone || ""}</Typography>
                    </TableCell>
                    <TableCell align="center">{c.pedidos}</TableCell>
                    <TableCell>{formatarData(c.ultimoPedido)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatBRL(c.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </AdminLayout>
  );
}
