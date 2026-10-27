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
  Divider,
  IconButton,
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
import { ArrowBack, DeleteOutlined, Add, Edit } from "@mui/icons-material";
import { formatBRL, formatDataCurta } from "@/lib/format";
import {
  STATUS_OS,
  STATUS_OS_COR,
  STATUS_OS_LABEL,
  type StatusOS,
} from "@/modules/os/dominio/os";

interface Item {
  id: string;
  tipo: string;
  descricao: string;
  quantidade: number;
  valorUnit: number;
  total: number;
}

interface Ordem {
  id: string;
  clienteNome: string;
  clienteTelefone: string | null;
  clienteEmail: string | null;
  veiculo: string;
  placa: string | null;
  km: number | null;
  descricaoProblema: string;
  observacoes: string | null;
  status: string;
  totalPecas: number;
  totalServicos: number;
  total: number;
  prazo: string | null;
  criadoEm: string;
  itens: Item[];
}

export default function OSDetalhe({ id }: { id: string }) {
  const router = useRouter();
  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // edição dos dados da OS (cliente, veículo, data de abertura)
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    clienteNome: "",
    clienteTelefone: "",
    veiculo: "",
    placa: "",
    km: "",
    descricaoProblema: "",
    observacoes: "",
    prazo: "",
    dataAbertura: "",
  });
  const [ok, setOk] = useState("");
  const [item, setItem] = useState({ tipo: "servico", descricao: "", quantidade: "1", valorUnit: "" });
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    const res = await fetch(`/api/admin/os/${id}`);
    if (!res.ok) {
      setErro("OS não encontrada");
      setCarregando(false);
      return;
    }
    setOrdem(await res.json());
    setCarregando(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const acao = async (corpo: Record<string, unknown>, mensagem: string) => {
    setSalvando(true);
    setErro("");
    setOk("");
    try {
      const res = await fetch(`/api/admin/os/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao salvar");
      setOk(mensagem);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  const abrirEdicao = () => {
    if (!ordem) return;
    setForm({
      clienteNome: ordem.clienteNome,
      clienteTelefone: ordem.clienteTelefone || "",
      veiculo: ordem.veiculo,
      placa: ordem.placa || "",
      km: ordem.km ? String(ordem.km) : "",
      descricaoProblema: ordem.descricaoProblema,
      observacoes: ordem.observacoes || "",
      prazo: ordem.prazo ? String(ordem.prazo).slice(0, 10) : "",
      dataAbertura: String(ordem.criadoEm).slice(0, 10),
    });
    setEditando(true);
  };

  const salvarEdicao = async () => {
    await acao(
      {
        acao: "editar",
        dados: {
          clienteNome: form.clienteNome,
          clienteTelefone: form.clienteTelefone || null,
          veiculo: form.veiculo,
          placa: form.placa || null,
          km: form.km ? Number(form.km) : null,
          descricaoProblema: form.descricaoProblema,
          observacoes: form.observacoes || null,
          prazo: form.prazo || null,
          dataAbertura: form.dataAbertura || null,
        },
      },
      "Dados da OS atualizados."
    );
    setEditando(false);
  };

  const adicionar = async () => {
    await acao(
      {
        acao: "item",
        item: {
          tipo: item.tipo,
          descricao: item.descricao,
          quantidade: Number(item.quantidade),
          valorUnit: Number(String(item.valorUnit).replace(",", ".")),
        },
      },
      "Item adicionado."
    );
    setItem({ tipo: item.tipo, descricao: "", quantidade: "1", valorUnit: "" });
  };

  if (carregando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!ordem) return <Alert severity="error">OS não encontrada.</Alert>;

  const statusAtual = ordem.status as StatusOS;
  const fechada = ["entregue", "cancelada"].includes(ordem.status);

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => router.push("/admin/os")} sx={{ textTransform: "none", mb: 2, color: "#555" }}>
        Ordens
      </Button>

      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>{erro}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk("")}>{ok}</Alert>}

      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{ordem.clienteNome}</Typography>
              <Chip size="small" label={STATUS_OS_LABEL[statusAtual]} color={STATUS_OS_COR[statusAtual]} variant="outlined" />
            </Box>
            <Typography sx={{ fontSize: "0.85rem", color: "#555", mt: 0.5 }}>
              {ordem.veiculo}{ordem.placa ? ` · ${ordem.placa}` : ""}{ordem.km ? ` · ${ordem.km} km` : ""}
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "#888" }}>
              {ordem.clienteTelefone || "sem telefone"} · aberta em {formatDataCurta(ordem.criadoEm)}
              {ordem.prazo ? ` · prazo ${formatDataCurta(ordem.prazo)}` : ""}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={abrirEdicao}
            sx={{ textTransform: "none", height: 40 }}
          >
            Editar dados
          </Button>

          <TextField
            size="small"
            select
            label="Mudar status"
            value=""
            sx={{ minWidth: 200 }}
            disabled={salvando || fechada}
            onChange={(e) => acao({ acao: "status", status: e.target.value }, "Status atualizado.")}
          >
            {STATUS_OS.filter((s) => s !== statusAtual).map((s) => (
              <MenuItem key={s} value={s}>{STATUS_OS_LABEL[s]}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontSize: "0.72rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Problema relatado
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "#333", mb: 1 }}>{ordem.descricaoProblema}</Typography>

        {ordem.observacoes && (
          <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>
            <strong>Observações:</strong> {ordem.observacoes}
          </Typography>
        )}
      </Paper>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Peças e serviços</Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "#888", ml: "auto" }}>
          Peças {formatBRL(ordem.totalPecas)} · Serviços {formatBRL(ordem.totalServicos)}
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Qtd</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Unitário</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {ordem.itens.map((i) => (
              <TableRow key={i.id} hover>
                <TableCell>
                  <Chip size="small" label={i.tipo} variant="outlined" sx={{ fontSize: "0.65rem" }} />
                </TableCell>
                <TableCell sx={{ fontSize: "0.85rem" }}>{i.descricao}</TableCell>
                <TableCell align="right">{i.quantidade}</TableCell>
                <TableCell align="right">{formatBRL(i.valorUnit)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{formatBRL(i.total)}</TableCell>
                <TableCell align="right">
                  {!fechada && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        // remover item é destrutivo: confirma antes
                        if (confirm(`Remover "${i.descricao}" da OS?`)) {
                          acao({ acao: "removerItem", itemId: i.id }, "Item removido.");
                        }
                      }}
                      sx={{ color: "#b3261e" }}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {ordem.itens.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 3, textAlign: "center", color: "#666" }}>
                  Nenhum item ainda — adicione a peça ou o serviço abaixo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {fechada && (
        <Alert
          severity={ordem.status === "entregue" ? "info" : "warning"}
          sx={{ mb: 2, fontSize: "0.82rem" }}
          action={
            ordem.status === "entregue" ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => acao({ acao: "status", status: "concluida" }, "OS reaberta.")}
                sx={{ textTransform: "none" }}
              >
                Reabrir
              </Button>
            ) : undefined
          }
        >
          {ordem.status === "entregue"
            ? "OS entregue: peças e serviços estão travados. Reabra para corrigir e feche de novo."
            : "OS cancelada: não dá para incluir itens (o estoque já foi devolvido). Abra uma nova OS."}
        </Alert>
      )}

      {!fechada && (
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "120px 1fr 90px 130px auto" }, gap: 1.5, alignItems: "center" }}>
            <TextField
              size="small"
              select
              label="Tipo"
              value={item.tipo}
              onChange={(e) => setItem({ ...item, tipo: e.target.value })}
            >
              <MenuItem value="servico">Serviço</MenuItem>
              <MenuItem value="peca">Peça</MenuItem>
            </TextField>
            <TextField size="small" label="Descrição" value={item.descricao} onChange={(e) => setItem({ ...item, descricao: e.target.value })} />
            <TextField size="small" type="number" label="Qtd" value={item.quantidade} onChange={(e) => setItem({ ...item, quantidade: e.target.value })} />
            <TextField size="small" label="Valor unitário" placeholder="0,00" value={item.valorUnit} onChange={(e) => setItem({ ...item, valorUnit: e.target.value })} />
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={adicionar}
              disabled={salvando || !item.descricao || !item.valorUnit}
              sx={{ textTransform: "none", height: 40 }}
            >
              Adicionar
            </Button>
          </Box>
        </Paper>
      )}

      <Dialog open={editando} onClose={() => setEditando(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Editar dados da OS</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mt: 1 }}>
            <TextField size="small" label="Cliente" value={form.clienteNome}
              onChange={(e) => setForm({ ...form, clienteNome: e.target.value })} />
            <TextField size="small" label="Telefone" value={form.clienteTelefone}
              onChange={(e) => setForm({ ...form, clienteTelefone: e.target.value })} />
            <TextField size="small" label="Veículo" value={form.veiculo}
              onChange={(e) => setForm({ ...form, veiculo: e.target.value })} />
            <TextField size="small" label="Placa" value={form.placa}
              onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} />
            <TextField size="small" type="number" label="KM" value={form.km}
              onChange={(e) => setForm({ ...form, km: e.target.value })} />
            <TextField size="small" type="date" label="Data de abertura" value={form.dataAbertura}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(e) => setForm({ ...form, dataAbertura: e.target.value })} />
            <TextField size="small" type="date" label="Prazo" value={form.prazo}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
          </Box>
          <TextField size="small" fullWidth multiline minRows={2} label="Problema relatado" sx={{ mt: 1.5 }}
            value={form.descricaoProblema}
            onChange={(e) => setForm({ ...form, descricaoProblema: e.target.value })} />
          <TextField size="small" fullWidth multiline minRows={2} label="Observações" sx={{ mt: 1.5 }}
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditando(false)} sx={{ textTransform: "none" }}>Cancelar</Button>
          <Button variant="contained" onClick={salvarEdicao} disabled={salvando || !form.clienteNome || !form.veiculo}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 3 }}>
        <Typography sx={{ fontSize: "0.85rem", color: "#666" }}>Total da OS</Typography>
        <Typography sx={{ fontSize: "1.1rem", fontWeight: 800 }}>{formatBRL(ordem.total)}</Typography>
      </Box>
    </Box>
  );
}
