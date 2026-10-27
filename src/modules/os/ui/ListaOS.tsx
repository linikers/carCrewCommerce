"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { Add, Build } from "@mui/icons-material";
import { formatBRL, formatDataCurta } from "@/lib/format";
import {
  STATUS_OS_COR,
  STATUS_OS_LABEL,
  type StatusOS,
} from "@/modules/os/dominio/os";

interface Ordem {
  id: string;
  clienteNome: string;
  clienteTelefone: string | null;
  veiculo: string;
  placa: string | null;
  status: string;
  total: number;
  prazo: string | null;
  criadoEm: string;
  itens: { id: string }[];
}

const VAZIA = {
  clienteNome: "",
  clienteTelefone: "",
  veiculo: "",
  placa: "",
  km: "",
  descricaoProblema: "",
  prazo: "",
};

export default function ListaOS() {
  const router = useRouter();
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("ativas");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIA);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    const params = new URLSearchParams();
    if (filtro !== "ativas" && filtro !== "todas") params.set("status", filtro);
    if (busca.trim()) params.set("busca", busca.trim());

    const res = await fetch(`/api/admin/os?${params.toString()}`);
    if (!res.ok) {
      setErro("Não foi possível carregar as ordens");
      setCarregando(false);
      return;
    }
    let lista: Ordem[] = await res.json();

    if (filtro === "ativas") {
      lista = lista.filter((o) => !["entregue", "cancelada"].includes(o.status));
    }

    setOrdens(lista);
    setCarregando(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  const criar = async () => {
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          km: form.km ? Number(form.km) : null,
          prazo: form.prazo || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao abrir a OS");
      setAberto(false);
      setForm(VAZIA);
      router.push(`/admin/os/${d.ordem.id}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao abrir a OS");
    } finally {
      setSalvando(false);
    }
  };

  const abertas = ordens.filter((o) => !["entregue", "cancelada"].includes(o.status)).length;

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

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            Ordens de serviço
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>
            {abertas} em andamento · {ordens.length} no filtro atual
          </Typography>
        </Box>

        <TextField
          size="small"
          select
          label="Filtro"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          sx={{ minWidth: 170, ml: { md: "auto" } }}
        >
          <MenuItem value="ativas">Em andamento</MenuItem>
          <MenuItem value="todas">Todas</MenuItem>
          <MenuItem value="orcamento">Orçamento enviado</MenuItem>
          <MenuItem value="execucao">Em execução</MenuItem>
          <MenuItem value="concluida">Concluídas</MenuItem>
          <MenuItem value="entregue">Entregues</MenuItem>
        </TextField>

        <TextField
          size="small"
          placeholder="Buscar cliente, placa ou veículo"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && carregar()}
          sx={{ width: { xs: "100%", sm: 260 } }}
        />

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAberto(true)}
          sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
        >
          Nova OS
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Veículo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Itens</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Prazo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordens.map((o) => (
              <TableRow
                key={o.id}
                hover
                onClick={() => router.push(`/admin/os/${o.id}`)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{o.clienteNome}</Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: "#888" }}>
                    {o.clienteTelefone || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: "0.85rem" }}>{o.veiculo}</Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: "#888", fontFamily: "monospace" }}>
                    {o.placa || "sem placa"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={STATUS_OS_LABEL[o.status as StatusOS] ?? o.status}
                    color={STATUS_OS_COR[o.status as StatusOS] ?? "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">{o.itens.length}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatBRL(o.total)}
                </TableCell>
                <TableCell sx={{ fontSize: "0.78rem", color: "#666" }}>
                  {o.prazo ? formatDataCurta(o.prazo) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {ordens.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 5, textAlign: "center", color: "#666" }}>
                  <Build sx={{ fontSize: 28, color: "#ccc", display: "block", mx: "auto", mb: 1 }} />
                  Nenhuma ordem {filtro === "ativas" ? "em andamento" : "nesse filtro"}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={aberto} onClose={() => setAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Abrir ordem de serviço</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mt: 1 }}>
            <TextField size="small" label="Cliente" value={form.clienteNome} onChange={(e) => setForm({ ...form, clienteNome: e.target.value })} />
            <TextField size="small" label="Telefone" value={form.clienteTelefone} onChange={(e) => setForm({ ...form, clienteTelefone: e.target.value })} />
            <TextField size="small" label="Veículo (modelo/ano)" value={form.veiculo} placeholder="Gol G5 2012" onChange={(e) => setForm({ ...form, veiculo: e.target.value })} />
            <TextField size="small" label="Placa" value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} />
            <TextField size="small" type="number" label="KM" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} />
            <TextField size="small" type="date" label="Prazo" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField
              size="small"
              label="Problema relatado"
              multiline
              rows={3}
              value={form.descricaoProblema}
              onChange={(e) => setForm({ ...form, descricaoProblema: e.target.value })}
              sx={{ gridColumn: { sm: "1 / -1" } }}
              helperText="O que o cliente disse — é o que o mecânico lê na bancada"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAberto(false)} sx={{ textTransform: "none" }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={criar}
            disabled={salvando || !form.clienteNome || !form.veiculo || !form.descricaoProblema}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
          >
            {salvando ? "Abrindo…" : "Abrir OS"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
