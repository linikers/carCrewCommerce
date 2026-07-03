"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Breadcrumbs,
  Link as MuiLink,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  ShoppingCartOutlined,
  Pix,
  CreditCard,
  AccountBalance,
} from "@mui/icons-material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PixPayment from "@/components/PixPayment";
import { useCart } from "@/lib/CartContext";

interface FormData {
  nome: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
}

interface FreightOption {
  id: string;
  transportadora: string;
  modalidade: string;
  prazo: string;
  valor: number;
}

interface FreightResult {
  cepOrigem: string;
  cepDestino: string;
  pesoTotal: string;
  dimensoes: string;
  opcoes: FreightOption[];
  erro?: string;
}

interface PixData {
  qrCode: string;
  payload: string;
  chave: string;
  amount: number;
  expiration: string;
}

const initialForm: FormData = {
  nome: "",
  telefone: "",
  cep: "",
  endereco: "",
  numero: "",
  bairro: "",
  cidade: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [form, setForm] = useState<FormData>(initialForm);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "boleto">("pix");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // PIX states
  const [pixOpen, setPixOpen] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState("");

  // CEP states
  const [cepLoading, setCepLoading] = useState(false);

  // Freight states
  const [freightLoading, setFreightLoading] = useState(false);
  const [freightResult, setFreightResult] = useState<FreightResult | null>(null);
  const [selectedFreight, setSelectedFreight] = useState<FreightOption | null>(null);
  const [freightError, setFreightError] = useState("");

  const isEmpty = items.length === 0 && !submitted;

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // CEP inteligente — auto-preencher endereço via ViaCEP
  const handleCepBlur = async () => {
    const cepLimpo = form.cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) return;

      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
      }));

      handleCalculateFreight(cepLimpo);
    } catch {
      // ViaCEP offline
    } finally {
      setCepLoading(false);
    }
  };

  const handleCalculateFreight = useCallback(async (cep: string) => {
    if (cep.length !== 8) {
      setFreightError("CEP inválido");
      return;
    }

    setFreightLoading(true);
    setFreightError("");
    setSelectedFreight(null);

    try {
      const itens = items.map((item) => ({
        peso: item.produto.peso || 500,
        altura: item.produto.altura || 10,
        largura: item.produto.largura || 10,
        profundidade: item.produto.profundidade || 10,
        quantidade: item.quantidade,
      }));

      const response = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cepDestino: cep, itens }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || "Erro ao calcular frete");
      setFreightResult(data);
    } catch (error) {
      setFreightError(error instanceof Error ? error.message : "Erro ao calcular frete");
    } finally {
      setFreightLoading(false);
    }
  }, [items]);

  // Botão "Calcular Frete" — lê CEP do form
  const onFreightClick = () => {
    const cepLimpo = form.cep.replace(/\D/g, "");
    handleCalculateFreight(cepLimpo);
  };

  const handlePixPayment = useCallback(async () => {
    setPixLoading(true);
    setPixError("");
    setPixOpen(true);

    try {
      const response = await fetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total + (selectedFreight?.valor || 0),
          nome: form.nome || "CarCrew Cliente",
          cidade: form.cidade || "SaoPaulo",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao gerar PIX");
      setPixData(data);
    } catch (error) {
      setPixError(error instanceof Error ? error.message : "Erro ao gerar PIX");
      setPixOpen(false);
    } finally {
      setPixLoading(false);
    }
  }, [total, form.nome, form.cidade, selectedFreight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // previne duplo clique

    setSubmitting(true);
    setPixError("");

    try {
      const orderRes = await fetch("/api/pedidos/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, form, paymentMethod, total, freight: selectedFreight?.valor || 0 }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setPixError(orderData.error || "Erro ao criar pedido");
        setSubmitting(false);
        return;
      }

      setOrderId(orderData.pedidoId);

      if (paymentMethod === "pix") {
        await handlePixPayment();
        // Limpa carrinho após gerar PIX
        clearCart();
      } else {
        clearCart();
        setSubmitted(true);
        window.scrollTo(0, 0);
      }
    } catch {
      setPixError("Erro de conexão ao processar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  const formValido = form.nome && form.telefone && form.endereco && form.numero && form.bairro && form.cidade;

  const whatsappMsg = orderId
    ? encodeURIComponent(`Olá! Acabei de fazer o pedido #${orderId.slice(0, 8)} na Car Crew Garage. Valor: R$ ${(total + (selectedFreight?.valor || 0)).toFixed(2)}`)
    : "";

  // Estado vazio
  if (isEmpty) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <Container sx={{ flex: 1, py: 8, textAlign: "center" }}>
          <ShoppingCartOutlined sx={{ fontSize: 80, color: "#ddd", mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Carrinho vazio</Typography>
          <Typography variant="body1" sx={{ color: "#666", mb: 3 }}>Adicione produtos antes de finalizar a compra.</Typography>
          <Button variant="contained" onClick={() => router.push("/")}
            sx={{ backgroundColor: "#E65100", "&:hover": { backgroundColor: "#BF360C" }, textTransform: "none" }}>
            Ver Produtos
          </Button>
        </Container>
        <Footer />
      </Box>
    );
  }

  // Tela de confirmação
  if (submitted || (pixData && pixOpen)) {
    const pixTotal = total + (selectedFreight?.valor || 0);

    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <Container sx={{ flex: 1, py: 6, textAlign: "center", maxWidth: 600 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "#E65100", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
            <Typography variant="h3" sx={{ color: "#fff" }}>✓</Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {pixData ? "PIX Gerado!" : "Pedido Confirmado!"}
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", mb: 1 }}>
            {orderId && `Pedido #${orderId.slice(0, 8)}`}
          </Typography>
          <Typography variant="body2" sx={{ color: "#999", mb: 4 }}>
            {pixData
              ? "Escaneie o QR Code ou copie o código PIX. O pedido será confirmado após o pagamento."
              : "Recebemos seu pedido e entraremos em contato em breve."}
          </Typography>

          <Paper sx={{ p: 3, mb: 3, backgroundColor: "#f9f9f9", textAlign: "left" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Resumo do Pedido</Typography>
            {items.map((item) => (
              <Box key={item.produto.id} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">{item.produto.nome.substring(0, 40)} x{item.quantidade}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>R$ {(item.produto.preco * item.quantidade).toFixed(2)}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography variant="h6" sx={{ color: "#E65100", fontWeight: 700 }}>R$ {pixTotal.toFixed(2)}</Typography>
            </Box>
            {selectedFreight && (
              <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
                Frete: {selectedFreight.modalidade} ({selectedFreight.transportadora}) - R$ {selectedFreight.valor.toFixed(2)}
              </Typography>
            )}
          </Paper>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
            <Button variant="contained" onClick={() => router.push("/")}
              sx={{ backgroundColor: "#E65100", "&:hover": { backgroundColor: "#BF360C" }, textTransform: "none", px: 4 }}>
              Continuar Comprando
            </Button>
            {orderId && (
              <Button variant="outlined" target="_blank"
                href={`https://wa.me/5544998133182?text=${whatsappMsg}`}
                sx={{ borderColor: "#25D366", color: "#25D366", textTransform: "none", px: 4,
                  "&:hover": { borderColor: "#1da851", backgroundColor: "#f0faf3" } }}>
                💬 Avisar no WhatsApp
              </Button>
            )}
          </Box>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <Container maxWidth="lg" sx={{ mt: 3, mb: 6, flex: 1 }}>
        <Breadcrumbs sx={{ mb: 3, fontSize: "0.85rem" }}>
          <MuiLink component="button" onClick={() => router.push("/")} underline="hover" sx={{ color: "#666", fontSize: "0.85rem" }}>Home</MuiLink>
          <Typography variant="body2" sx={{ color: "#E65100", fontSize: "0.85rem" }}>Checkout</Typography>
        </Breadcrumbs>

        <Button startIcon={<ArrowBack />} onClick={() => router.back()}
          sx={{ textTransform: "none", color: "#666", mb: 2, "&:hover": { color: "#E65100" } }}>
          Voltar
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: "#1A1A1A" }}>Finalizar Compra</Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Dados do Cliente</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Nome completo" required value={form.nome}
                      onChange={(e) => updateField("nome", e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Telefone / WhatsApp" required placeholder="(44) 99999-9999"
                      value={form.telefone} onChange={(e) => updateField("telefone", e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="CEP" placeholder="00000-000" required value={form.cep}
                      onChange={(e) => updateField("cep", e.target.value)}
                      onBlur={handleCepBlur}
                      helperText={cepLoading ? "Buscando endereço..." : ""} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button fullWidth variant="outlined" onClick={onFreightClick}
                      disabled={freightLoading || form.cep.replace(/\D/g, "").length !== 8}
                      sx={{ height: "56px", borderColor: "#E65100", color: "#E65100", textTransform: "none",
                        "&:hover": { borderColor: "#BF360C", backgroundColor: "#fff5f0" } }}>
                      {freightLoading ? "Calculando..." : "Calcular Frete"}
                    </Button>
                  </Grid>

                  {freightError && (
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="error" sx={{ mt: 1 }}>{freightError}</Alert>
                    </Grid>
                  )}
                  {freightResult && (
                    <Grid size={{ xs: 12 }}>
                      <Paper sx={{ p: 2, mt: 1, backgroundColor: "#f9f9f9" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Opções de Frete</Typography>
                        <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                          Origem: {freightResult.cepOrigem} | Peso: {freightResult.pesoTotal}
                        </Typography>
                        <Grid container spacing={1}>
                          {freightResult.opcoes.map((opt) => (
                            <Grid size={{ xs: 12, sm: 4 }} key={opt.id}>
                              <Paper onClick={() => setSelectedFreight(opt)} sx={{ p: 1.5, textAlign: "center", cursor: "pointer",
                                border: selectedFreight?.id === opt.id ? "2px solid #E65100" : "2px solid transparent",
                                backgroundColor: selectedFreight?.id === opt.id ? "#fff5f0" : "#fff",
                                transition: "all 0.2s", "&:hover": { borderColor: "#E65100" } }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{opt.modalidade}</Typography>
                                <Typography variant="caption" sx={{ color: "#666" }}>{opt.transportadora} • {opt.prazo}</Typography>
                                <Typography variant="body2" sx={{ color: "#E65100", fontWeight: 700, mt: 0.5 }}>R$ {opt.valor.toFixed(2)}</Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField fullWidth label="Endereço" required value={form.endereco}
                      onChange={(e) => updateField("endereco", e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth label="Número" required value={form.numero}
                      onChange={(e) => updateField("numero", e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Bairro" required value={form.bairro}
                      onChange={(e) => updateField("bairro", e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Cidade" required value={form.cidade}
                      onChange={(e) => updateField("cidade", e.target.value)} />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Forma de Pagamento</Typography>
                <Grid container spacing={2}>
                  {([
                    { key: "pix", label: "PIX", icon: <Pix />, desc: "Pagamento instantâneo" },
                    { key: "card", label: "Cartão", icon: <CreditCard />, desc: "Em breve — indisponível", disabled: true },
                    { key: "boleto", label: "Boleto", icon: <AccountBalance />, desc: "Em breve — indisponível", disabled: true },
                  ] as const).map((opt: any) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={opt.key}>
                      <Paper onClick={() => { if (opt.disabled) return; setPaymentMethod(opt.key); }}
                        sx={{ p: 2, textAlign: "center", cursor: opt.disabled ? "not-allowed" : "pointer",
                          opacity: opt.disabled ? 0.45 : 1,
                          border: paymentMethod === opt.key ? "2px solid #E65100" : "2px solid transparent",
                          backgroundColor: paymentMethod === opt.key ? "#fff5f0" : "#fff",
                          transition: "all 0.2s", "&:hover": { borderColor: "#E65100" } }}>
                        <Box sx={{ color: "#E65100", mb: 1 }}>{opt.icon}</Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{opt.label}</Typography>
                        <Typography variant="caption" sx={{ color: "#999" }}>{opt.desc}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {pixError && <Alert severity="error" sx={{ mt: 2 }}>{pixError}</Alert>}

              <Button type="submit" fullWidth variant="contained" size="large"
                disabled={!formValido || submitting}
                sx={{ mt: 3, backgroundColor: "#E65100", "&:hover": { backgroundColor: "#BF360C" },
                  textTransform: "none", fontWeight: 600, py: 1.5, fontSize: "1.1rem",
                  "&.Mui-disabled": { backgroundColor: "#ccc", color: "#999" } }}>
                {submitting ? "Processando..." :
                  paymentMethod === "pix" ? "Gerar PIX para Pagamento" :
                  paymentMethod === "card" ? "Finalizar Compra" : "Gerar Boleto"}
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3, borderRadius: 3, position: "sticky", top: 100 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Resumo do Pedido</Typography>
                <List disablePadding>
                  {items.map((item) => (
                    <ListItem key={item.produto.id} disableGutters sx={{ gap: 1 }}>
                      <ListItemAvatar>
                        <Avatar variant="rounded" src={item.produto.imgUrl} sx={{ width: 56, height: 56, bgcolor: "#1A1A1A" }} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{item.produto.nome.substring(0, 50)}</Typography>}
                        secondary={`Qtd: ${item.quantidade}`} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>R$ {(item.produto.preco * item.quantidade).toFixed(2)}</Typography>
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body1">Subtotal</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>R$ {total.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" sx={{ color: "#666" }}>Frete</Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {selectedFreight ? `${selectedFreight.modalidade} - R$ ${selectedFreight.valor.toFixed(2)}` : "Selecione uma opção"}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
                  <Typography variant="h6" sx={{ color: "#E65100", fontWeight: 700 }}>R$ {(total + (selectedFreight?.valor || 0)).toFixed(2)}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </form>
      </Container>

      <Footer />

      <PixPayment open={pixOpen} onClose={() => setPixOpen(false)} pixData={pixData} loading={pixLoading} />
    </Box>
  );
}
