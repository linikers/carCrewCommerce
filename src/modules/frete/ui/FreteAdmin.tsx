"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  LocalShipping,
  Save,
  Link,
  CheckCircle,
} from "@mui/icons-material";

function AdminFreteContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [originCep, setOriginCep] = useState("");
  const [packageWeight, setPackageWeight] = useState(0.5);
  const [packageHeight, setPackageHeight] = useState(2);
  const [packageWidth, setPackageWidth] = useState(16);
  const [packageLength, setPackageLength] = useState(18);
  const [markupPercent, setMarkupPercent] = useState(0);
  const [sandbox, setSandbox] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);

  // Retorno do OAuth: a mensagem é derivada da URL (sem setState no efeito,
  // que dispara render em cascata) e a URL é limpa uma vez.
  const mensagemRetorno = (() => {
    const err = searchParams.get("error");
    const suc = searchParams.get("success");
    if (err === "authorization_denied") return { tipo: "erro" as const, texto: "Autorização negada pelo Melhor Envio" };
    if (err === "token_exchange_failed") return { tipo: "erro" as const, texto: "Erro ao trocar código pelo token" };
    if (err === "server_error") return { tipo: "erro" as const, texto: "Erro interno ao autenticar" };
    if (suc === "authorized") return { tipo: "ok" as const, texto: "Melhor Envio autorizado com sucesso!" };
    return null;
  })();

  useEffect(() => {
    if (searchParams.get("error") || searchParams.get("success")) {
      router.replace("/admin/frete");
    }
  }, [searchParams, router]);

  async function carregarConfig() {
    // Nada de setState antes do primeiro await: chamado de dentro de um
    // efeito, isso dispara render em cascata (regra react-hooks). O spinner já
    // começa ligado no estado inicial.
    try {
      const res = await fetch("/api/admin/frete/config");
      if (!res.ok) throw new Error("Erro ao carregar configuração");
      const data = await res.json();

      setError("");
      setOriginCep(data.originCep || "");
      setPackageWeight(data.packageWeight || 0.5);
      setPackageHeight(data.packageHeight || 2);
      setPackageWidth(data.packageWidth || 16);
      setPackageLength(data.packageLength || 18);
      setMarkupPercent(data.markupPercent || 0);
      setSandbox(data.sandbox !== false);
      setHasToken(data.hasToken || false);
      setTokenExpiresAt(data.tokenExpiresAt || null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
    if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      // carregar-config no mount é o padrão da tela; a regra nova do
      // react-hooks marca qualquer setState alcançável a partir do efeito.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      carregarConfig();
    }
  }, [status, session]);

  async function salvar() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/admin/frete/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originCep: originCep.replace(/\D/g, ""),
          packageWeight: Number(packageWeight),
          packageHeight: Number(packageHeight),
          packageWidth: Number(packageWidth),
          packageLength: Number(packageLength),
          markupPercent: Number(markupPercent),
          sandbox,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");
      setSuccess("Configurações salvas!");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function iniciarOAuth() {
    try {
      setError("");
      setSuccess("");

      // Salva clientId/clientSecret antes de autorizar
      const clientId = prompt("Cole o Client ID do Melhor Envio:");
      if (!clientId) return;
      const clientSecret = prompt("Cole o Client Secret do Melhor Envio:");
      if (!clientSecret) return;

      const saveRes = await fetch("/api/admin/frete/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      });

      if (!saveRes.ok) throw new Error("Erro ao salvar credenciais");

      // Redireciona pro OAuth
      window.location.href = "/api/admin/frete/auth";
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user?.admin) return null;

  return (
    <>
      <>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
                Configurar Frete
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
                Integração com Melhor Envio
              </Typography>
            </Box>
          </Box>

          {mensagemRetorno && (
            <Alert severity={mensagemRetorno.tipo === "ok" ? "success" : "error"} sx={{ mb: 2 }}>
              {mensagemRetorno.texto}
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Seção: Autenticação */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Link sx={{ color: "#BF360C" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#1A1A1A" }}>
                    Autenticação Melhor Envio
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                  {hasToken
                    ? "Conectado ao Melhor Envio"
                    : "Autorize o Car Crew Garage a acessar sua conta do Melhor Envio"}
                </Typography>

                {hasToken && tokenExpiresAt && (
                  <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 2 }}>
                    Token expira em: {new Date(tokenExpiresAt).toLocaleDateString("pt-BR")}
                  </Typography>
                )}

                <Button
                  variant={hasToken ? "outlined" : "contained"}
                  startIcon={hasToken ? <CheckCircle /> : <Link />}
                  onClick={iniciarOAuth}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: hasToken ? "transparent" : "#BF360C",
                    color: hasToken ? "#BF360C" : "#fff",
                    borderColor: "#BF360C",
                    "&:hover": hasToken ? { backgroundColor: "rgba(230,81,0,0.08)" } : { backgroundColor: "#BF360C" },
                  }}
                >
                  {hasToken ? "Reconectar ao Melhor Envio" : "Conectar ao Melhor Envio"}
                </Button>
              </Paper>

              {/* Seção: Origem */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <LocalShipping sx={{ color: "#BF360C" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#1A1A1A" }}>
                    Origem da Loja
                  </Typography>
                </Box>

                <TextField
                  label="CEP de Origem"
                  value={originCep}
                  onChange={(e) => setOriginCep(e.target.value)}
                  placeholder="00000-000"
                  size="small"
                  sx={{ maxWidth: 300 }}
                  slotProps={{ htmlInput: { maxLength: 9 } }}
                />
              </Paper>

              {/* Seção: Embalagem Padrão */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1A1A1A" }}>
                  Embalagem Padrão
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                  Dimensões usadas no cálculo de frete quando o produto não tem medidas cadastradas
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <TextField
                    label="Peso (kg)"
                    type="number"
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(Number(e.target.value))}
                    size="small"
                    slotProps={{ htmlInput: { step: 0.1, min: 0.1 } }}
                    sx={{ maxWidth: 150 }}
                  />
                  <TextField
                    label="Altura (cm)"
                    type="number"
                    value={packageHeight}
                    onChange={(e) => setPackageHeight(Number(e.target.value))}
                    size="small"
                    slotProps={{ htmlInput: { min: 1 } }}
                    sx={{ maxWidth: 150 }}
                  />
                  <TextField
                    label="Largura (cm)"
                    type="number"
                    value={packageWidth}
                    onChange={(e) => setPackageWidth(Number(e.target.value))}
                    size="small"
                    slotProps={{ htmlInput: { min: 1 } }}
                    sx={{ maxWidth: 150 }}
                  />
                  <TextField
                    label="Comprimento (cm)"
                    type="number"
                    value={packageLength}
                    onChange={(e) => setPackageLength(Number(e.target.value))}
                    size="small"
                    slotProps={{ htmlInput: { min: 1 } }}
                    sx={{ maxWidth: 150 }}
                  />
                </Box>
              </Paper>

              {/* Seção: Margem e Ambiente */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1A1A1A" }}>
                  Ajustes
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}>
                  <TextField
                    type="number"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(Number(e.target.value))}
                    size="small"
                    slotProps={{
                      htmlInput: { min: 0, max: 100 },
                    }}
                    label="Margem de lucro (%)"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={sandbox}
                        onChange={(e) => setSandbox(e.target.checked)}
                        sx={{
                          "& .MuiSwitch-thumb": { backgroundColor: sandbox ? "#BF360C" : "#ccc" },
                          "& .MuiSwitch-track": { backgroundColor: sandbox ? "rgba(230,81,0,0.3)" : "#eee" },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Modo Sandbox (testes)
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#888" }}>
                          {sandbox
                            ? "Usando ambiente de testes — fretes não são reais"
                            : "Usando ambiente de produção — fretes reais"}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Paper>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={salvar}
                  disabled={saving}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: "#BF360C",
                    "&:hover": { backgroundColor: "#BF360C" },
                  }}
                >
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </Box>
            </>
          )}
        </Container>
      </>
    </>
  );
}

export default function AdminFrete() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <AdminFreteContent />
    </Suspense>
  );
}
