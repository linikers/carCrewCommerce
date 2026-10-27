"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
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

interface ProdutoSaldo {
  id: number;
  sku: string | null;
  nome: string;
  estoque: number;
  ativo: boolean;
}

interface Movimento {
  id: string;
  tipo: string;
  quantidade: number;
  saldoDepois: number;
  motivo: string;
  origem: string;
  criadoEm: string;
  produto: { nome: string; sku: string | null };
}

const TIPO_COR: Record<string, "success" | "error" | "warning" | "default"> = {
  entrada: "success",
  saida: "error",
  ajuste: "warning",
  estorno: "default",
};

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function EstoqueAdmin() {
  const [produtos, setProdutos] = useState<ProdutoSaldo[]>([]);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [busca, setBusca] = useState("");

  const [form, setForm] = useState({
    produtoId: "",
    tipo: "entrada" as "entrada" | "saida" | "ajuste",
    quantidade: "1",
    motivo: "",
  });

  const carregar = async () => {
    const res = await fetch("/api/admin/estoque");
    if (!res.ok) {
      setErro("Não foi possível carregar o estoque");
      setCarregando(false);
      return;
    }
    const d = await res.json();
    setProdutos(d.produtos);
    setMovimentos(d.movimentos);
    setCarregando(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return produtos;
    return produtos.filter(
      (p) => p.nome.toLowerCase().includes(t) || (p.sku || "").toLowerCase().includes(t)
    );
  }, [produtos, busca]);

  const registrar = async () => {
    setSalvando(true);
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/admin/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: Number(form.produtoId),
          tipo: form.tipo,
          quantidade: Number(form.quantidade),
          motivo: form.motivo,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao registrar");
      setOk("Movimento registrado.");
      setForm({ ...form, quantidade: "1", motivo: "" });
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao registrar");
    } finally {
      setSalvando(false);
    }
  };

  // o rótulo é "SKUs com saldo" — antes somava unidades, não SKUs
  const totalPecas = produtos.filter((p) => p.estoque > 0).length;
  const unidades = produtos.reduce((s, p) => s + Math.max(0, p.estoque), 0);
  const zerados = produtos.filter((p) => p.estoque <= 0).length;

  if (carregando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>{erro}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk("")}>{ok}</Alert>}

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Paper sx={{ p: 2, borderRadius: 3, flex: "1 1 160px" }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#777", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            SKUs com saldo
          </Typography>
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800 }}>{totalPecas}</Typography>
          <Typography sx={{ fontSize: "0.7rem", color: "#999" }}>{unidades} unidade(s)</Typography>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3, flex: "1 1 160px" }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#777", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            SKUs sem saldo
          </Typography>
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: zerados > 0 ? "#BF360C" : "#1A1A1A" }}>
            {zerados}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3, flex: "1 1 160px" }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#777", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Movimentações
          </Typography>
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800 }}>{movimentos.length}</Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Registrar movimento</Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
          O saldo não é mais digitado: cada entrada e saída fica registrada com motivo e data.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" }, gap: 2 }}>
          <TextField
            select
            size="small"
            label="Peça"
            value={form.produtoId}
            onChange={(e) => setForm({ ...form, produtoId: e.target.value })}
          >
            {produtos.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>
                {p.sku ? `${p.sku} · ` : ""}{p.nome} (saldo {p.estoque})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}
          >
            <MenuItem value="entrada">Entrada</MenuItem>
            <MenuItem value="saida">Saída</MenuItem>
            <MenuItem value="ajuste">Ajuste de conferência</MenuItem>
          </TextField>

          <TextField
            size="small"
            type="number"
            label="Quantidade"
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
          <TextField
            size="small"
            label="Motivo (obrigatório)"
            placeholder="Compra do fornecedor, conferência do balcão…"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            sx={{ flex: 1, minWidth: 240 }}
          />
          {(() => {
            const selecionado = produtos.find((p) => String(p.id) === form.produtoId);
            if (!selecionado) return null;
            const qtd = Math.abs(Number(form.quantidade) || 0);
            const delta = form.tipo === "saida" ? -qtd : qtd;
            const depois = selecionado.estoque + delta;
            return (
              <Typography sx={{ fontSize: "0.8rem", color: depois < 0 ? "#b3261e" : "#555", alignSelf: "center" }}>
                Saldo atual <strong>{selecionado.estoque}</strong> → ficará{" "}
                <strong>{depois}</strong>
              </Typography>
            );
          })()}
          <Button
            variant="contained"
            disabled={salvando || !form.produtoId || !form.motivo.trim()}
            onClick={registrar}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
          >
            {salvando ? "Registrando…" : "Registrar"}
          </Button>
        </Box>
        {(!form.produtoId || !form.motivo.trim()) && (
          <Typography sx={{ fontSize: "0.72rem", color: "#8a8a8a", mt: 1 }}>
            Para registrar: escolha a peça e escreva o motivo.
          </Typography>
        )}
      </Paper>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1.5, flexWrap: "wrap" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Saldo por peça
        </Typography>
        <TextField
          size="small"
          placeholder="Buscar por nome ou SKU"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ ml: "auto", width: { xs: "100%", sm: 260 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Peça</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Saldo após</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrados.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{p.sku || "—"}</TableCell>
                <TableCell sx={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.nome}
                </TableCell>
                <TableCell align="right">
                  <Chip
                    size="small"
                    label={p.estoque}
                    color={p.estoque > 2 ? "default" : p.estoque > 0 ? "warning" : "error"}
                    variant={p.estoque > 2 ? "outlined" : "filled"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ fontSize: "0.72rem", color: "#888", mt: -3, mb: 4 }}>
        Saldo: <Box component="span" sx={{ color: "#2e7d32", fontWeight: 700 }}>verde ≥ 3</Box> ·{" "}
        <Box component="span" sx={{ color: "#B26A00", fontWeight: 700 }}>laranja 1–2</Box> ·{" "}
        <Box component="span" sx={{ color: "#b3261e", fontWeight: 700 }}>vermelho 0</Box>
        {" "}— {filtrados.length} SKU(s) listado(s).
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Últimos movimentos
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 600 }}>Quando</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Peça</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Qtd</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Saldo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Motivo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movimentos.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell sx={{ fontSize: "0.75rem", color: "#666", whiteSpace: "nowrap" }}>
                  {dataCurta(m.criadoEm)}
                </TableCell>
                <TableCell sx={{ fontSize: "0.8rem" }}>
                  <Box sx={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#888" }}>
                    {m.produto.sku || "—"}
                  </Box>
                  {m.produto.nome.slice(0, 40)}
                </TableCell>
                <TableCell>
                  <Chip size="small" label={m.tipo} color={TIPO_COR[m.tipo] ?? "default"} variant="outlined" />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: m.tipo === "saida" ? "#b3261e" : "#0E7A3F" }}>
                  {m.tipo === "saida" ? "-" : "+"}{Math.abs(m.quantidade)}
                </TableCell>
                <TableCell align="right">{m.saldoDepois}</TableCell>
                <TableCell sx={{ fontSize: "0.75rem", color: "#555", maxWidth: 320 }}>
                  {m.motivo}
                  <Box component="span" sx={{ color: "#aaa" }}> · {m.origem}</Box>
                </TableCell>
              </TableRow>
            ))}
            {movimentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ color: "#777", py: 3, textAlign: "center" }}>
                  Nenhum movimento ainda. O primeiro será o saldo inicial das peças.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
