"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Chip,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  Save,
  Add,
  Delete,
  QrCode,
  Visibility,
  VisibilityOff,
  ArrowBack,
} from "@mui/icons-material";
import Header from "@/components/Header";
import AdminLayout from "@/components/admin/AdminLayout";

interface PixKey {
  id: string;
  tipo: "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";
  chave: string;
  titular: string;
  banco: string;
  ativo: boolean;
  ordem: number;
}

interface PagamentoConfig {
  pix: {
    habilitado: boolean;
    chaves: PixKey[];
  };
  boleto: {
    habilitado: boolean;
  };
  cartao: {
    habilitado: boolean;
  };
}

const tiposChave = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "aleatoria", label: "Chave Aleatória" },
];

const bancos = [
  "Itaú Unibanco",
  "Bradesco",
  "Banco do Brasil",
  "Caixa Econômica",
  "Banco Inter",
  "Nubank",
  "Mercado Pago",
  "PagBank",
  "Stone",
  "Outro",
];

export default function AdminPagamentos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showChaves, setShowChaves] = useState<Record<string, boolean>>({});

  const [config, setConfig] = useState<PagamentoConfig>({
    pix: { habilitado: true, chaves: [] },
    boleto: { habilitado: false },
    cartao: { habilitado: false },
  });

  useEffect(() => {
    fetch("/api/admin/pagamentos")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const addChave = () => {
    const newKey: PixKey = {
      id: Date.now().toString(),
      tipo: "cpf",
      chave: "",
      titular: "",
      banco: "",
      ativo: true,
      ordem: config.pix.chaves.length,
    };
    setConfig({
      ...config,
      pix: {
        ...config.pix,
        chaves: [...config.pix.chaves, newKey],
      },
    });
  };

  const updateChave = (id: string, field: keyof PixKey, value: any) => {
    setConfig({
      ...config,
      pix: {
        ...config.pix,
        chaves: config.pix.chaves.map((k) =>
          k.id === id ? { ...k, [field]: value } : k
        ),
      },
    });
  };

  const removeChave = (id: string) => {
    setConfig({
      ...config,
      pix: {
        ...config.pix,
        chaves: config.pix.chaves.filter((k) => k.id !== id),
      },
    });
  };

  const toggleChaveVisibility = (id: string) => {
    setShowChaves((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/pagamentos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error("Erro ao salvar");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (status === "unauthenticated" || (status === "authenticated" && !session?.user?.admin)) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <Container sx={{ flex: 1, py: 8, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Acesso restrito</Typography>
          <Button variant="contained" onClick={() => router.push("/admin/login")}
            sx={{ mt: 2, backgroundColor: "#E65100", textTransform: "none" }}>
            Login Admin
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="md" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push("/admin")}
          sx={{ textTransform: "none", color: "#666", mb: 2, "&:hover": { color: "#E65100" } }}>
          Voltar
        </Button>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Pagamentos</Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Configure as formas de pagamento aceitas na loja
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              backgroundColor: "#E65100",
              "&:hover": { bgcolor: "#BF360C" },
              textTransform: "none",
            }}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 3 }}>Configurações salvas com sucesso!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#E65100" }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* PIX */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <QrCode sx={{ color: "#00b894", fontSize: 28 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>PIX</Typography>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        Pagamento instantâneo via QR Code
                      </Typography>
                    </Box>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.pix.habilitado}
                        onChange={(e) =>
                          setConfig({ ...config, pix: { ...config.pix, habilitado: e.target.checked } })
                        }
                        sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00b894" } }}
                      />
                    }
                    label={config.pix.habilitado ? "Ativo" : "Inativo"}
                  />
                </Box>

                {config.pix.habilitado && (
                  <>
                    <Divider sx={{ mb: 3 }} />

                    {config.pix.chaves.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4, bgcolor: "#f9f9f9", borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: "#999", mb: 2 }}>
                          Nenhuma chave PIX cadastrada
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={addChave}
                          sx={{ borderColor: "#00b894", color: "#00b894", textTransform: "none" }}
                        >
                          Adicionar Chave
                        </Button>
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Chaves PIX ({config.pix.chaves.length})
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={addChave}
                            size="small"
                            sx={{ borderColor: "#00b894", color: "#00b894", textTransform: "none" }}
                          >
                            Adicionar
                          </Button>
                        </Box>

                        {config.pix.chaves.map((key, idx) => (
                          <Paper
                            key={key.id}
                            sx={{
                              p: 2,
                              mb: 2,
                              border: "1px solid #eee",
                              borderRadius: 2,
                              opacity: key.ativo ? 1 : 0.6,
                            }}
                          >
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                              <Chip
                                label={`Chave ${idx + 1}`}
                                size="small"
                                sx={{ bgcolor: "#e8f5e9", color: "#2e7d32" }}
                              />
                              <Box>
                                <Tooltip title={key.ativo ? "Desativar" : "Ativar"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => updateChave(key.id, "ativo", !key.ativo)}
                                  >
                                    {key.ativo ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remover">
                                  <IconButton
                                    size="small"
                                    onClick={() => removeChave(key.id)}
                                    sx={{ color: "#e57373" }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>

                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                  fullWidth
                                  select
                                  size="small"
                                  label="Tipo de Chave"
                                  value={key.tipo}
                                  onChange={(e) => updateChave(key.id, "tipo", e.target.value)}
                                >
                                  {tiposChave.map((t) => (
                                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Chave PIX"
                                  value={key.chave}
                                  onChange={(e) => updateChave(key.id, "chave", e.target.value)}
                                  placeholder={
                                    key.tipo === "cpf" ? "000.000.000-00" :
                                    key.tipo === "email" ? "email@exemplo.com" :
                                    key.tipo === "telefone" ? "(00) 00000-0000" :
                                    "Chave"
                                  }
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Nome do Titular"
                                  value={key.titular}
                                  onChange={(e) => updateChave(key.id, "titular", e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  select
                                  size="small"
                                  label="Banco / Instituição"
                                  value={key.banco}
                                  onChange={(e) => updateChave(key.id, "banco", e.target.value)}
                                >
                                  {bancos.map((b) => (
                                    <MenuItem key={b} value={b}>{b}</MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                      </>
                    )}
                  </>
                )}
              </Paper>
            </Grid>

            {/* BOLETO */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 3, opacity: 0.6 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Boleto Bancário</Typography>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Em breve — aguardando definição de gateway
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={<Switch disabled />}
                    label="Em breve"
                  />
                </Box>
              </Paper>
            </Grid>

            {/* CARTÃO */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 3, opacity: 0.6 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Cartão de Crédito</Typography>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Em breve — aguardando definição de gateway
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={<Switch disabled />}
                    label="Em breve"
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </AdminLayout>
  );
}
