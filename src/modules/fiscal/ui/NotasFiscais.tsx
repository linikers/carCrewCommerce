"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
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
import { formatBRL, formatDataCurta } from "@/lib/format";

/**
 * Fila de notas fiscais (interface do emissor).
 *
 * O site não emite: ele junta os pedidos, diz o que falta em cada um e entrega
 * o pacote para o emissor do cliente. Esta tela é a fila.
 */

interface Nota {
  id: string;
  pedidoId: string;
  canal: string;
  status: string;
  motivo: string | null;
  numero: string | null;
  serie: string | null;
  chave: string | null;
  criadoEm: string;
  pedido: { total: number; clienteNome: string | null; clienteDocumento: string | null; createdAt: string };
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Faltando dado",
  pronta: "Pronta para o lote",
  exportada: "Exportada",
  autorizada: "Autorizada",
  rejeitada: "Rejeitada",
  cancelada: "Cancelada",
};

const STATUS_COR: Record<string, "default" | "warning" | "info" | "success" | "error"> = {
  pendente: "warning",
  pronta: "info",
  exportada: "info",
  autorizada: "success",
  rejeitada: "error",
  cancelada: "default",
};

const CANAL_LABEL: Record<string, string> = {
  site: "Site",
  mercado_livre: "Mercado Livre",
  shopee: "Shopee",
  manual: "Manual",
};

function inicioDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function NotasFiscais() {
  const [de, setDe] = useState(inicioDoMes());
  const [ate, setAte] = useState(new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState<Nota[]>([]);
  const [contagem, setContagem] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const q = new URLSearchParams({ de, ate });
      const res = await fetch(`/api/admin/fiscal/notas?${q.toString()}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível carregar a fila");
      setNotas(Array.isArray(d.notas) ? d.notas : []);
      setContagem(d.contagem ?? {});
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
      setNotas([]);
    } finally {
      setCarregando(false);
    }
  }, [de, ate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  const gerar = async () => {
    setGerando(true);
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/admin/fiscal/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ de, ate }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível gerar a fila");
      setOk(d.mensagem);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar");
    } finally {
      setGerando(false);
    }
  };

  const total = Object.values(contagem).reduce((s, n) => s + n, 0);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        O site <strong>não emite</strong> nota: ele junta os pedidos, mostra o que falta em cada um
        e entrega o pacote de dados para o <strong>seu emissor</strong>. Quem assina e transmite é
        ele — o certificado não é usado aqui.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 2.5 }}>
          <TextField fullWidth size="small" label="De" type="date" value={de}
            slotProps={{ inputLabel: { shrink: true } }} onChange={(e) => setDe(e.target.value)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 2.5 }}>
          <TextField fullWidth size="small" label="Até" type="date" value={ate}
            slotProps={{ inputLabel: { shrink: true } }} onChange={(e) => setAte(e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Button fullWidth variant="contained" onClick={gerar} disabled={gerando}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700, height: 40 }}>
            {gerando ? "Gerando…" : "Gerar fila do período"}
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <Button fullWidth variant="outlined" onClick={carregar}
            sx={{ textTransform: "none", borderColor: "#BF360C", color: "#BF360C", height: 40 }}>
            Atualizar
          </Button>
        </Grid>
      </Grid>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk("")}>{ok}</Alert>}

      {total > 0 && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {Object.entries(contagem).map(([status, n]) => (
            <Chip key={status} label={`${STATUS_LABEL[status] ?? status}: ${n}`}
              color={STATUS_COR[status] ?? "default"} variant="outlined" size="small" />
          ))}
        </Box>
      )}

      {carregando ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#BF360C" }} />
        </Box>
      ) : notas.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Fila vazia no período</Typography>
          <Typography sx={{ color: "#666", fontSize: "0.85rem", mt: 1 }}>
            Clique em <strong>Gerar fila do período</strong>. Entram os pedidos pagos do canal cuja
            política de emissão está ligada em <strong>Fiscal</strong>.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: { xs: 320, sm: 720 } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 600 }}>Pedido</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Canal</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Situação</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>O que falta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notas.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell sx={{ fontSize: "0.72rem", fontFamily: "monospace" }}>
                    {n.pedidoId.slice(-8)}
                    <Box component="span" sx={{ display: "block", color: "#888", fontFamily: "inherit" }}>
                      {formatDataCurta(n.pedido.createdAt)}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" }, maxWidth: 180 }}>
                    <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.pedido.clienteNome ?? "Sem nome"}
                    </Box>
                    <Box sx={{ color: "#888", fontSize: "0.68rem" }}>{n.pedido.clienteDocumento ?? "sem documento"}</Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" } }}>
                    {CANAL_LABEL[n.canal] ?? n.canal}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatBRL(n.pedido.total)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={STATUS_LABEL[n.status] ?? n.status}
                      color={STATUS_COR[n.status] ?? "default"} variant="outlined"
                      sx={{ height: 20, fontSize: "0.62rem" }} />
                    {n.numero && (
                      <Box sx={{ fontSize: "0.62rem", color: "#666", mt: 0.5 }}>nº {n.numero}</Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.72rem", color: n.motivo ? "#8a5200" : "#0E7A3F", maxWidth: 260 }}>
                    {n.motivo ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
