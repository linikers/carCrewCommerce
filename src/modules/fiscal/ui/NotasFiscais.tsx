"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
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
  // chave de API do emissor
  const [chave, setChave] = useState<{ prefixo: string; criadaEm: string; ultimoUso: string | null } | null>(null);
  const [chaveNova, setChaveNova] = useState("");
  // retorno digitado (quando quem emite é uma pessoa)
  const [retornoDe, setRetornoDe] = useState<Nota | null>(null);
  const [retorno, setRetorno] = useState({ status: "autorizada", numero: "", serie: "", chaveNfe: "", motivo: "" });

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
      const rc = await fetch("/api/admin/fiscal/chave");
      if (rc.ok) setChave((await rc.json()).chave ?? null);
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

  const criarChaveApi = async () => {
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/admin/fiscal/chave", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível criar a chave");
      setChaveNova(d.chave);
      setChave({ prefixo: d.prefixo, criadaEm: new Date().toISOString(), ultimoUso: null });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar a chave");
    }
  };

  const revogarChaveApi = async () => {
    if (!confirm("Revogar a chave? O emissor para de conseguir devolver o retorno.")) return;
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/admin/fiscal/chave", { method: "DELETE" });
      if (!res.ok) throw new Error("Não foi possível revogar");
      setChave(null);
      setChaveNova("");
      setOk("Chave revogada.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao revogar");
    }
  };

  const registrarRetorno = async () => {
    if (!retornoDe) return;
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/admin/fiscal/retorno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId: retornoDe.pedidoId,
          status: retorno.status,
          numero: retorno.numero,
          serie: retorno.serie,
          chave: retorno.chaveNfe,
          motivo: retorno.motivo,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível registrar");
      setRetornoDe(null);
      setRetorno({ status: "autorizada", numero: "", serie: "", chaveNfe: "", motivo: "" });
      setOk(d.jaEstava ? "Este retorno já estava registrado." : "Retorno registrado na nota.");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar");
    }
  };

  const reabrir = async (pedidoId: string) => {
    setErro("");
    try {
      const res = await fetch("/api/admin/fiscal/retorno", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId }),
      });
      if (!res.ok) throw new Error("Não foi possível reabrir");
      setOk("Nota voltou para o lote.");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao reabrir");
    }
  };

  const exportar = async (formato: "json" | "csv") => {
    setErro("");
    setOk("");
    try {
      const q = new URLSearchParams({ de, ate, formato });
      const res = await fetch(`/api/admin/fiscal/exportar?${q.toString()}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Não foi possível exportar");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notas-${de}-a-${ate}.${formato}`;
      a.click();
      URL.revokeObjectURL(url);
      setOk(`Lote exportado em ${formato.toUpperCase()}. As notas saíram da fila como "exportada".`);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao exportar");
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

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>Chave de API do emissor</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "#666" }}>
            {chave
              ? `Criada em ${formatDataCurta(chave.criadaEm)} · prefixo ${chave.prefixo}… · último uso ${
                  chave.ultimoUso ? formatDataCurta(chave.ultimoUso) : "nunca"
                }`
              : "Nenhuma chave criada. O emissor devolve o retorno por API usando esta chave; sem ela, registre o retorno na mão pela linha do pedido."}
          </Typography>
        </Box>
        <Button size="small" variant="outlined" onClick={criarChaveApi} sx={{ textTransform: "none" }}>
          {chave ? "Gerar nova" : "Criar chave"}
        </Button>
        {chave && (
          <Button size="small" onClick={revogarChaveApi} sx={{ textTransform: "none", color: "#b3261e" }}>
            Revogar
          </Button>
        )}
      </Paper>

      {chaveNova && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setChaveNova("")}>
          Chave criada — copie agora, ela não é exibida de novo:
          <Box component="code" sx={{ display: "block", mt: 1, fontSize: "0.8rem", wordBreak: "break-all" }}>
            {chaveNova}
          </Box>
        </Alert>
      )}

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
        <Grid size={{ xs: 12, sm: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => exportar("json")}
            sx={{ textTransform: "none", height: 40 }}>
            Exportar JSON
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => exportar("csv")}
            sx={{ textTransform: "none", height: 40 }}>
            Exportar CSV
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
                <TableCell sx={{ fontWeight: 600 }}>Retorno</TableCell>
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
                  <TableCell>
                    <Button size="small" onClick={() => { setRetornoDe(n); setRetorno({ status: "autorizada", numero: "", serie: "", chaveNfe: "", motivo: "" }); }}
                      sx={{ textTransform: "none", color: "#BF360C", fontWeight: 700, minWidth: 0, fontSize: "0.72rem" }}>
                      Registrar
                    </Button>
                    {n.status === "rejeitada" && (
                      <Button size="small" onClick={() => reabrir(n.pedidoId)}
                        sx={{ textTransform: "none", color: "#666", minWidth: 0, fontSize: "0.72rem" }}>
                        Reabrir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={retornoDe !== null} onClose={() => setRetornoDe(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Retorno da nota</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.78rem", color: "#666", mb: 2 }}>
            Pedido {retornoDe?.pedidoId.slice(-8)} · {retornoDe?.pedido.clienteNome ?? "sem nome"}
          </Typography>
          <TextField select fullWidth size="small" label="Situação" value={retorno.status}
            onChange={(e) => setRetorno({ ...retorno, status: e.target.value })} sx={{ mb: 2 }}>
            <MenuItem value="autorizada">Autorizada</MenuItem>
            <MenuItem value="rejeitada">Rejeitada</MenuItem>
            <MenuItem value="cancelada">Cancelada</MenuItem>
          </TextField>
          {retorno.status === "autorizada" ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField size="small" label="Número" value={retorno.numero}
                onChange={(e) => setRetorno({ ...retorno, numero: e.target.value })} />
              <TextField size="small" label="Série" value={retorno.serie}
                onChange={(e) => setRetorno({ ...retorno, serie: e.target.value })} />
              <TextField size="small" label="Chave de acesso" value={retorno.chaveNfe}
                onChange={(e) => setRetorno({ ...retorno, chaveNfe: e.target.value })}
                sx={{ gridColumn: "1 / -1" }} />
            </Box>
          ) : (
            <TextField fullWidth size="small" label="Motivo" value={retorno.motivo}
              helperText="A nota continua na fila depois de reabrir"
              onChange={(e) => setRetorno({ ...retorno, motivo: e.target.value })} />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRetornoDe(null)} sx={{ textTransform: "none" }}>Cancelar</Button>
          <Button variant="contained" onClick={registrarRetorno}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}>
            Salvar retorno
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
