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
  Snackbar,
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
  const { items, total } = useCart();
  const [form, setForm] = useState<FormData>(initialForm);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "boleto">(
    "pix"
  );
  const [submitted, setSubmitted] = useState(false);

  // PIX states
  const [pixOpen, setPixOpen] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState("");

  const isEmpty = items.length === 0 && !submitted;

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
          amount: total,
          nome: form.nome || "CarCrew Cliente",
          cidade: form.cidade || "SaoPaulo",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar PIX");
      }

      setPixData(data);
    } catch (error) {
      setPixError(
        error instanceof Error ? error.message : "Erro ao gerar PIX"
      );
      setPixOpen(false);
    } finally {
      setPixLoading(false);
    }
  }, [total, form.nome, form.cidade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "pix") {
      // Gera PIX e mostra QR Code
      await handlePixPayment();
    } else {
      // Cartão ou Boleto — simula pedido
      await new Promise((r) => setTimeout(r, 500));
      setSubmitted(true);
      window.scrollTo(0, 0);
    }
  };

  const maxParcelas = 12;
  const valorParcela = total / maxParcelas;

  const formValido = form.nome && form.telefone && form.endereco && form.numero && form.bairro && form.cidade;

  // Estado vazio
  if (isEmpty) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <Container sx={{ flex: 1, py: 8, textAlign: "center" }}>
          <ShoppingCartOutlined sx={{ fontSize: 80, color: "#ddd", mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Carrinho vazio
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", mb: 3 }}>
            Adicione produtos antes de finalizar a compra.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push("/")}
            sx={{
              backgroundColor: "#E65100",
              "&:hover": { backgroundColor: "#BF360C" },
              textTransform: "none",
            }}
          >
            Ver Produtos
          </Button>
        </Container>
        <Footer />
      </Box>
    );
  }

  // Tela de confirmação (cartão/boleto)
  if (submitted) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <Container sx={{ flex: 1, py: 8, textAlign: "center", maxWidth: 600 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "#E65100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <Typography variant="h3" sx={{ color: "#fff" }}>
              ✓
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Pedido Confirmado!
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
            Recebemos seu pedido e entraremos em contato em breve para
            finalizar o pagamento.
          </Typography>
          <Paper
            sx={{
              p: 3,
              mb: 4,
              backgroundColor: "#f9f9f9",
              textAlign: "left",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Resumo do Pedido
            </Typography>
            {items.map((item) => (
              <Box
                key={item.produto.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography variant="body2">
                  {item.produto.nome.substring(0, 40)} x{item.quantidade}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Total
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#E65100", fontWeight: 700 }}
              >
                R$ {total.toFixed(2)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
              Pagamento via:{" "}
              {paymentMethod === "card" ? "Cartão" : "Boleto"}
            </Typography>
          </Paper>
          <Button
            variant="contained"
            onClick={() => router.push("/")}
            sx={{
              backgroundColor: "#E65100",
              "&:hover": { backgroundColor: "#BF360C" },
              textTransform: "none",
              px: 4,
            }}
          >
            Continuar Comprando
          </Button>
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
          <MuiLink
            component="button"
            onClick={() => router.push("/")}
            underline="hover"
            sx={{ color: "#666", fontSize: "0.85rem" }}
          >
            Home
          </MuiLink>
          <Typography
            variant="body2"
            sx={{ color: "#E65100", fontSize: "0.85rem" }}
          >
            Checkout
          </Typography>
        </Breadcrumbs>

        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{
            textTransform: "none",
            color: "#666",
            mb: 2,
            "&:hover": { color: "#E65100" },
          }}
        >
          Voltar
        </Button>

        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 4, color: "#1A1A1A" }}
        >
          Finalizar Compra
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Formulário */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Dados do Cliente
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Nome completo"
                      required
                      value={form.nome}
                      onChange={(e) => updateField("nome", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Telefone / WhatsApp"
                      required
                      placeholder="(44) 99999-9999"
                      value={form.telefone}
                      onChange={(e) => updateField("telefone", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="CEP"
                      placeholder="00000-000"
                      value={form.cep}
                      onChange={(e) => updateField("cep", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      fullWidth
                      label="Endereço"
                      required
                      value={form.endereco}
                      onChange={(e) => updateField("endereco", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Número"
                      required
                      value={form.numero}
                      onChange={(e) => updateField("numero", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Bairro"
                      required
                      value={form.bairro}
                      onChange={(e) => updateField("bairro", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Cidade"
                      required
                      value={form.cidade}
                      onChange={(e) => updateField("cidade", e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Forma de Pagamento */}
              <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Forma de Pagamento
                </Typography>

                <Grid container spacing={2}>
                  {[
                    {
                      key: "pix",
                      label: "PIX",
                      icon: <Pix />,
                      desc: "Pagamento instantâneo",
                    },
                    {
                      key: "card",
                      label: "Cartão",
                      icon: <CreditCard />,
                      desc: "Até 12x sem juros",
                    },
                    {
                      key: "boleto",
                      label: "Boleto",
                      icon: <AccountBalance />,
                      desc: "Vence em 3 dias",
                    },
                  ].map((opt) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={opt.key}>
                      <Paper
                        onClick={() =>
                          setPaymentMethod(
                            opt.key as typeof paymentMethod
                          )
                        }
                        sx={{
                          p: 2,
                          textAlign: "center",
                          cursor: "pointer",
                          border:
                            paymentMethod === opt.key
                              ? "2px solid #E65100"
                              : "2px solid transparent",
                          backgroundColor:
                            paymentMethod === opt.key ? "#fff5f0" : "#fff",
                          transition: "all 0.2s",
                          "&:hover": {
                            borderColor: "#E65100",
                          },
                        }}
                      >
                        <Box sx={{ color: "#E65100", mb: 1 }}>
                          {opt.icon}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                        >
                          {opt.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#999" }}>
                          {opt.desc}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {pixError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {pixError}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={!formValido}
                sx={{
                  mt: 3,
                  backgroundColor: "#E65100",
                  "&:hover": { backgroundColor: "#BF360C" },
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.5,
                  fontSize: "1.1rem",
                  "&.Mui-disabled": {
                    backgroundColor: "#ccc",
                    color: "#999",
                  },
                }}
              >
                {paymentMethod === "pix"
                  ? "Gerar PIX para Pagamento"
                  : paymentMethod === "card"
                  ? "Finalizar Compra"
                  : "Gerar Boleto"}
              </Button>
            </Grid>

            {/* Resumo do Pedido */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  position: "sticky",
                  top: 100,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Resumo do Pedido
                </Typography>

                <List disablePadding>
                  {items.map((item) => (
                    <ListItem
                      key={item.produto.id}
                      disableGutters
                      sx={{ gap: 1 }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          variant="rounded"
                          src={item.produto.imgUrl}
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: "#1A1A1A",
                          }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500 }}
                          >
                            {item.produto.nome.substring(0, 50)}
                          </Typography>
                        }
                        secondary={`Qtd: ${item.quantidade}`}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        R${" "}
                        {(
                          item.produto.preco * item.quantidade
                        ).toFixed(2)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body1">Subtotal</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    R$ {total.toFixed(2)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Frete
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Calcular no CEP
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Total
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#E65100", fontWeight: 700 }}
                  >
                    R$ {total.toFixed(2)}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#999", display: "block", mt: 1 }}
                >
                  ou {maxParcelas}x de R$ {valorParcela.toFixed(2)} sem juros
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </form>
      </Container>

      <Footer />

      {/* Modal PIX */}
      <PixPayment
        open={pixOpen}
        onClose={() => setPixOpen(false)}
        pixData={pixData}
        loading={pixLoading}
      />
    </Box>
  );
}
