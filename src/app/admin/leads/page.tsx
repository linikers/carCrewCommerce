"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Alert,
  Box,
  Button,
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
  FormControlLabel,
  Switch,
} from "@mui/material";
import { MarkEmailRead } from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatData } from "@/lib/format";

interface Lead {
  id: number;
  email: string;
  telefone: string | null;
  origem: string;
  criadoEm: string;
}

export default function AdminLeads() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [resumo, setResumo] = useState({ total: 0, ultimos7: 0 });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  // Convite da home: liga/desliga sem deploy
  const [convite, setConvite] = useState({ ativo: true, atrasoSegundos: 30 });
  const [salvandoConvite, setSalvandoConvite] = useState(false);
  const [conviteOk, setConviteOk] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/config/convite")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setConvite({ ativo: Boolean(d.ativo), atrasoSegundos: Number(d.atrasoSegundos) || 30 });
      })
      .catch(() => {});

    fetch("/api/admin/leads")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || "Falha ao carregar");
        setLeads(d.leads || []);
        setResumo(d.resumo || { total: 0, ultimos7: 0 });
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar"))
      .finally(() => setLoading(false));
  }, [status, router]);

  const filtrados = leads.filter((l) => {
    if (!busca.trim()) return true;
    const t = busca.trim().toLowerCase();
    return l.email.toLowerCase().includes(t) || (l.telefone || "").includes(t);
  });

  const salvarConvite = async (novo: { ativo: boolean; atrasoSegundos: number }) => {
    setSalvandoConvite(true);
    setConviteOk("");
    try {
      const res = await fetch("/api/admin/config/convite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novo),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao salvar");
      setConvite({ ativo: d.ativo, atrasoSegundos: d.atrasoSegundos });
      setConviteOk(novo.ativo ? "Convite ligado." : "Convite desligado.");
      setTimeout(() => setConviteOk(""), 2500);
    } catch (e) {
      setConviteOk(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvandoConvite(false);
    }
  };

  const exportar = () => {
    const linhas = [
      ["Email", "Telefone", "Origem", "Data"],
      ...filtrados.map((l) => [
        l.email,
        l.telefone || "",
        l.origem,
        new Date(l.criadoEm).toLocaleDateString("pt-BR"),
      ]),
    ];
    const csv = linhas.map((c) => c.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading" || !session?.user?.admin) {
    return (
      <AdminLayout title="Leads">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress sx={{ color: "#BF360C" }} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Leads">
      <Container maxWidth="lg" sx={{ py: { xs: 9, md: 4 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Leads</Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              {resumo.total} na lista · {resumo.ultimos7} nos últimos 7 dias
            </Typography>
          </Box>
          {filtrados.length > 0 && (
            <Button variant="outlined" onClick={exportar} sx={{ textTransform: "none" }}>
              Exportar CSV
            </Button>
          )}
        </Box>

        {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>{erro}</Alert>}

        {/* Controle do convite (popup) — o dono liga e desliga quando quiser */}
        <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Convite na home
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Popup que pede o e-mail depois de {convite.atrasoSegundos}s de navegação (1x por sessão).
            </Typography>
          </Box>

          <TextField
            size="small"
            type="number"
            label="Atraso (s)"
            value={convite.atrasoSegundos}
            disabled={salvandoConvite || !convite.ativo}
            onChange={(e) =>
              setConvite({ ...convite, atrasoSegundos: Number(e.target.value) || 30 })
            }
            onBlur={() => salvarConvite(convite)}
            slotProps={{ htmlInput: { min: 5, max: 300, step: 5 } }}
            sx={{ width: 120 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={convite.ativo}
                disabled={salvandoConvite}
                onChange={(e) => salvarConvite({ ...convite, ativo: e.target.checked })}
                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#BF360C" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#BF360C" } }}
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{convite.ativo ? "Ligado" : "Desligado"}</Typography>}
          />

          {conviteOk && (
            <Typography variant="caption" sx={{ color: "#0E7A3F", fontWeight: 600 }}>
              {conviteOk}
            </Typography>
          )}
        </Paper>

        <TextField
          fullWidth
          placeholder="Buscar por e-mail ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ mb: 3 }}
        />

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#BF360C" }} />
          </Box>
        ) : filtrados.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
            <MarkEmailRead sx={{ fontSize: 40, color: "#ccc", mb: 1 }} />
            <Typography variant="h6" sx={{ color: "#666" }}>
              {busca ? "Nenhum lead encontrado" : "Nenhum lead capturado ainda"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
              {busca
                ? "Tente outro e-mail ou telefone."
                : "O formulário do rodapé e o convite da home gravam aqui."}
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600 }}>E-mail</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>WhatsApp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Origem</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrados.map((l) => (
                  <TableRow key={l.id} hover>
                    <TableCell>{l.email}</TableCell>
                    <TableCell>{l.telefone || "—"}</TableCell>
                    <TableCell sx={{ color: "#666" }}>{l.origem}</TableCell>
                    <TableCell>{formatData(l.criadoEm)}</TableCell>
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
