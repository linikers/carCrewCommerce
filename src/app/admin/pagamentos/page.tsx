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

interface MercadoPagoConfig {
  habilitado: boolean;
  ambiente: "producao" | "teste";
  publicKey: string | null;
  temAccessToken: boolean;
  temWebhookSecret: boolean;
  atualizadoEm: string | null;
  urlWebhook: string;
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

  // Mercado Pago: token e segredo nunca voltam do servidor; campo vazio mantém.
  const [mp, setMp] = useState<MercadoPagoConfig>({
    habilitado: false,
    ambiente: "producao",
    publicKey: "",
    temAccessToken: false,
    temWebhookSecret: false,
    atualizadoEm: null,
    urlWebhook: "/api/webhooks/mercadopago",
  });
  const [mpToken, setMpToken] = useState("");
  const [mpSegredo, setMpSegredo] = useState("");
  const [mpSalvando, setMpSalvando] = useState(false);
  const [mpTestando, setMpTestando] = useState(false);
  const [mpAviso, setMpAviso] = useState("");
  const [mpErro, setMpErro] = useState("");
  const [mpConta, setMpConta] = useState("");

  const [config, setConfig] = useState<PagamentoConfig>({
    pix: { habilitado: true, chaves: [] },
    boleto: { habilitado: false },
    cartao: { habilitado: false },
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/pagamentos").then((r) => r.json()),
      fetch("/api/admin/pagamentos/mercadopago").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([data, mercadoPago]) => {
        setConfig(data);
        if (mercadoPago) {
          setMp({
            habilitado: mercadoPago.habilitado === true,
            ambiente: mercadoPago.ambiente === "teste" ? "teste" : "producao",
            publicKey: mercadoPago.publicKey ?? "",
            temAccessToken: mercadoPago.temAccessToken === true,
            temWebhookSecret: mercadoPago.temWebhookSecret === true,
            atualizadoEm: mercadoPago.atualizadoEm ?? null,
            urlWebhook: mercadoPago.urlWebhook ?? "/api/webhooks/mercadopago",
          });
        }
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

  const updateChave = (
    id: string,
    field: keyof PixKey,
    value: PixKey[keyof PixKey]
  ) => {
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

  const salvarMercadoPago = async () => {
    setMpSalvando(true);
    setMpErro("");
    setMpAviso("");
    try {
      const res = await fetch("/api/admin/pagamentos/mercadopago", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habilitado: mp.habilitado,
          ambiente: mp.ambiente,
          publicKey: mp.publicKey,
          accessToken: mpToken,
          webhookSecret: mpSegredo,
        }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados?.error || "Falha ao salvar");

      setMp({
        habilitado: dados.habilitado === true,
        ambiente: dados.ambiente === "teste" ? "teste" : "producao",
        publicKey: dados.publicKey ?? "",
        temAccessToken: dados.temAccessToken === true,
        temWebhookSecret: dados.temWebhookSecret === true,
        atualizadoEm: dados.atualizadoEm ?? null,
        urlWebhook: dados.urlWebhook ?? mp.urlWebhook,
      });
      setMpToken("");
      setMpSegredo("");
      setMpAviso("Conta salva. Token e segredo ficam cifrados no banco.");
    } catch (e) {
      setMpErro(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setMpSalvando(false);
    }
  };

  const testarMercadoPago = async () => {
    setMpTestando(true);
    setMpErro("");
    setMpAviso("");
    setMpConta("");
    try {
      const res = await fetch("/api/admin/pagamentos/mercadopago", { method: "POST" });
      const dados = await res.json();
      if (!res.ok || !dados.ok) throw new Error(dados?.error || "Falha ao testar");
      const conta = dados.conta ?? {};
      setMpConta(
        `${conta.apelido || conta.email || "conta"} · id ${conta.id}` +
          (dados.ambiente ? ` · ${dados.ambiente}` : "")
      );
    } catch (e) {
      setMpErro(e instanceof Error ? e.message : "Falha ao testar");
    } finally {
      setMpTestando(false);
    }
  };

  if (status === "unauthenticated" || (status === "authenticated" && !session?.user?.admin)) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Container sx={{ flex: 1, py: 8, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Acesso restrito</Typography>
          <Button variant="contained" onClick={() => router.push("/admin/login")}
            sx={{ mt: 2, backgroundColor: "#BF360C", textTransform: "none" }}>
            Login Admin
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <AdminLayout title="Pagamentos">
      <Container maxWidth="md" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push("/admin")}
          sx={{ textTransform: "none", color: "#666", mb: 2, "&:hover": { color: "#BF360C" } }}>
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
              backgroundColor: "#BF360C",
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
            <CircularProgress sx={{ color: "#BF360C" }} />
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
                        <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
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

            {/* MERCADO PAGO */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Mercado Pago — PIX com confirmação
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      A cobrança nasce na sua conta e o pedido é marcado como pago pelo webhook
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      size="small"
                      label={mp.habilitado ? "Ligado" : "Desligado"}
                      color={mp.habilitado ? "success" : "default"}
                      variant="outlined"
                    />
                    <Switch
                      checked={mp.habilitado}
                      onChange={(e) => setMp({ ...mp, habilitado: e.target.checked })}
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Ambiente"
                      value={mp.ambiente}
                      onChange={(e) =>
                        setMp({ ...mp, ambiente: e.target.value as "producao" | "teste" })
                      }
                      helperText="Use teste até validar; produção cobra de verdade"
                    >
                      <MenuItem value="producao">Produção</MenuItem>
                      <MenuItem value="teste">Teste</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Public Key"
                      value={mp.publicKey ?? ""}
                      onChange={(e) => setMp({ ...mp, publicKey: e.target.value })}
                      placeholder="APP_USR-..."
                      helperText="Opcional — só para o checkout transparente no navegador"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="password"
                      label="Access Token"
                      value={mpToken}
                      onChange={(e) => setMpToken(e.target.value)}
                      placeholder={mp.temAccessToken ? "•••••••• (salvo)" : "APP_USR-..."}
                      helperText={
                        mp.temAccessToken
                          ? "Já existe um token salvo. Deixe vazio para manter."
                          : "Painel do Mercado Pago → Suas integrações → Credenciais"
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="password"
                      label="Segredo do webhook"
                      value={mpSegredo}
                      onChange={(e) => setMpSegredo(e.target.value)}
                      placeholder={mp.temWebhookSecret ? "•••••••• (salvo)" : "chave secreta"}
                      helperText={
                        mp.temWebhookSecret
                          ? "Já existe um segredo salvo. Deixe vazio para manter."
                          : "Sem ele o webhook recusa o evento — é o que impede alguém de marcar pedido como pago"
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="URL do webhook (cadastre no Mercado Pago)"
                      value={mp.urlWebhook}
                      slotProps={{ htmlInput: { readOnly: true } }}
                      helperText="Mercado Pago → Suas integrações → Webhooks → evento 'Pagamentos'"
                    />
                  </Grid>
                </Grid>

                {mpErro && <Alert severity="error" sx={{ mt: 2 }}>{mpErro}</Alert>}
                {mpAviso && <Alert severity="success" sx={{ mt: 2 }}>{mpAviso}</Alert>}
                {mpConta && <Alert severity="info" sx={{ mt: 2 }}>Conectado: {mpConta}</Alert>}
                {mp.habilitado && !mp.temAccessToken && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Ligado sem Access Token: o checkout continua no PIX de chave
                    estática até salvar a credencial.
                  </Alert>
                )}

                <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={salvarMercadoPago}
                    disabled={mpSalvando}
                    sx={{ backgroundColor: "#BF360C", textTransform: "none", "&:hover": { backgroundColor: "#8f2809" } }}
                  >
                    {mpSalvando ? "Salvando…" : "Salvar conta"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={testarMercadoPago}
                    disabled={mpTestando || !mp.temAccessToken}
                    sx={{ textTransform: "none" }}
                  >
                    {mpTestando ? "Testando…" : "Testar conexão"}
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* BOLETO */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 3, opacity: 0.6 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Boleto Bancário</Typography>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Em breve — depende da mesma conta do Mercado Pago
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
