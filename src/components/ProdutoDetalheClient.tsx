"use client";

import { calcularPreco } from "@/lib/preco";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound, useRouter } from "next/navigation";
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Divider,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Snackbar,
  Alert,
  Slide,
  TextField,
} from "@mui/material";
import {
  WhatsApp,
  ShoppingCartOutlined,
  ArrowBack,
  LocalShipping,
  Security,
  CreditCard,
} from "@mui/icons-material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { useCart } from "@/lib/CartContext";
import { isCloudinaryUrl, detailUrl, thumbUrl, extractPublicId } from "@/lib/cloudinary";
import type { Produto, Categoria, ItemCarrinho } from "@/types";
import { formatBRL } from "@/lib/format";
import { track, trackItem, trackWhatsApp } from "@/lib/analytics";

interface ProdutoDetalheClientProps {
  produto: Produto;
  categoria: Categoria | undefined;
  relacionados: Produto[];
}

export default function ProdutoDetalheClient({
  produto,
  categoria,
  relacionados,
}: ProdutoDetalheClientProps) {
  const router = useRouter();
  const { addToCart, items, removeFromCart, clearCart, totalItens } = useCart();

  const [quantidade, setQuantidade] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackProduto, setSnackProduto] = useState("");

  if (!produto) {
    notFound();
  }

  const parcelas = produto.parcelamento || 12;
  const preco = calcularPreco(produto.preco, produto.descontoPercent);
  const valorParcela = preco.por / parcelas;
  const sobConsulta = produto.preco <= 0;

  // view_item — mede quais peças recebem visita
  useEffect(() => {
    if (produto) trackItem("view_item", produto);
  }, [produto]);

  const handleAddToCart = () => {
    trackItem("add_to_cart", produto, quantidade);
    // addToCart no contexto sempre adiciona 1, então chamamos N vezes
    for (let i = 0; i < quantidade; i++) {
      addToCart(produto);
    }
    setSnackProduto(produto.nome);
    setSnackOpen(true);
  };

  const allImages = [produto.imgUrl, ...(produto.galeria || [])];

  const waLink = `https://wa.me/5544998133182?text=${encodeURIComponent(
    sobConsulta
      ? `Olá! Quero um orçamento para: ${produto.nome}`
      : `Olá! Tenho interesse em: ${produto.nome} (${formatBRL(preco.por)})`
  )}`;

  // 2.5: a página dizia "frete no checkout" e o checkout é que pedia o CEP.
  // Aqui o visitante descobre o frete antes de sair da página do produto.
  const [cep, setCep] = useState("");
  const [opcoesFrete, setOpcoesFrete] = useState<
    {
      id?: string;
      transportadora: string;
      modalidade?: string;
      prazo: string;
      valor: number;
      estimado?: boolean;
    }[]
  >([]);
  const [freteErro, setFreteErro] = useState("");
  const [freteAviso, setFreteAviso] = useState("");
  const [freteBusy, setFreteBusy] = useState(false);

  const calcularFrete = async () => {
    const limpo = cep.replace(/\D/g, "");
    if (limpo.length !== 8) {
      setFreteErro("Digite um CEP com 8 dígitos");
      return;
    }
    setFreteBusy(true);
    setFreteErro("");
    setOpcoesFrete([]);
    try {
      const res = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cepDestino: limpo,
          itens: [
            {
              peso: produto.peso || 500,
              altura: produto.altura || 10,
              largura: produto.largura || 10,
              profundidade: produto.profundidade || 10,
              quantidade,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Não foi possível calcular agora");
      setOpcoesFrete((data.opcoes || []).slice(0, 3));
      setFreteAviso(data.aviso || "");
      if (!data.opcoes?.length) setFreteErro("Sem opção de entrega para este CEP");
    } catch (e) {
      setFreteErro(e instanceof Error ? e.message : "Não foi possível calcular agora");
    } finally {
      setFreteBusy(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", pb: { xs: 9, md: 0 } }}>
      <Header onCartOpen={() => setCartOpen(true)} cartItemCount={totalItens} />

      <Container maxWidth="lg" sx={{ mt: 3, mb: 6, flex: 1 }}>
        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 3, fontSize: "0.85rem" }}>
          <MuiLink
            component="button"
            onClick={() => router.push("/")}
            underline="hover"
            sx={{ color: "#666", fontSize: "0.85rem" }}
          >
            Home
          </MuiLink>
          {categoria && (
            <MuiLink
              component={Link}
              href={`/?cat=${categoria.slug}`}
              underline="hover"
              sx={{ color: "#666", fontSize: "0.85rem" }}
            >
              {categoria.nome}
            </MuiLink>
          )}
          <Typography variant="body2" sx={{ color: "primary.main", fontSize: "0.85rem" }}>
            {produto.nome.substring(0, 40)}...
          </Typography>
        </Breadcrumbs>

        {/* Botão voltar */}
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBack />}
          sx={{
            textTransform: "none",
            color: "#666",
            mb: 2,
            "&:hover": { color: "primary.main" },
          }}
        >
          Ver todas as peças
        </Button>

        <Grid container spacing={4}>
          {/* Imagem & Galeria */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {/* Imagem principal */}
              <Paper
                sx={{
                  p: { xs: 2, md: 4 },
                  backgroundColor: "#ffffff",
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 350,
                  border: "1px solid #eee",
                  position: "relative",
                  aspectRatio: "1/1",
                }}
              >
                <Box
                  component="img"
                  fetchPriority="high"
                  src={
                    isCloudinaryUrl(allImages[selectedImg])
                      ? detailUrl(extractPublicId(allImages[selectedImg]))
                      : allImages[selectedImg]
                  }
                  alt={produto.nome}
                  sx={{
                    maxWidth: "100%",
                    maxHeight: 400,
                    objectFit: "contain",
                    transition: "opacity 0.2s ease",
                  }}
                />
              </Paper>

              {/* Miniaturas */}
              {allImages.length > 1 && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {allImages.map((url, idx) => (
                    <Paper
                      key={idx}
                      onClick={() => setSelectedImg(idx)}
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 2,
                        overflow: "hidden",
                        cursor: "pointer",
                        border: selectedImg === idx ? "2px solid #E65100" : "2px solid transparent",
                        opacity: selectedImg === idx ? 1 : 0.6,
                        transition: "all 0.2s ease",
                        "&:hover": { opacity: 1 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#fff",
                      }}
                    >
                      <Box
                        component="img"
                        loading="lazy"
                        src={
                          isCloudinaryUrl(url)
                            ? thumbUrl(extractPublicId(url))
                            : url
                        }
                        alt=""
                        sx={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                          p: 0.5,
                        }}
                      />
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            {categoria && (
              <Chip
                label={categoria.nome}
                size="small"
                sx={{
                  backgroundColor: "#E65100",
                  color: "#fff",
                  fontWeight: 500,
                  mb: 1,
                  fontSize: "0.75rem",
                }}
              />
            )}

            <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mb: 2, color: "#1A1A1A" }}>
              {produto.nome}
            </Typography>

            <Typography variant="body1" sx={{ color: "#666", mb: 3, lineHeight: 1.7 }}>
              {produto.descricao}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Typography
              component="p"
              variant="h3"
              sx={{
                color: "primary.main",
                fontWeight: 700,
                fontSize: { xs: "1.8rem", md: "2.2rem" },
                mb: 1,
              }}
            >
              {sobConsulta ? (
                "Sob Consulta"
              ) : preco.temDesconto ? (
                <Box component="span" sx={{ display: "inline-flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
                  <Box component="span" sx={{ color: "#9a9a9a", fontSize: "1rem", fontWeight: 500, textDecoration: "line-through" }}>
                    {formatBRL(preco.de)}
                  </Box>
                  {formatBRL(preco.por)}
                  <Box component="span" sx={{ backgroundColor: "#0E7A3F", color: "#fff", fontSize: "0.7rem", fontWeight: 700, px: 1, py: 0.3, borderRadius: 1 }}>
                    -{preco.percentual}% à vista
                  </Box>
                </Box>
              ) : (
                formatBRL(preco.por)
              )}
            </Typography>

            {!sobConsulta && (
              <Typography variant="body1" sx={{ color: "#666", mb: 3 }}>
                Pagamento via PIX
              </Typography>
            )}

            {/* Aplicação veicular — dado que já existe no banco */}
            {produto.veiculos && produto.veiculos.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Aplicação
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {produto.veiculos.map((v) => (
                    <Chip key={v} label={v} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Quantidade */}
            <Box
              sx={{
                display: sobConsulta ? "none" : "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Quantidade:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Button
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                  sx={{ minWidth: 40, height: 40, color: "#666", fontSize: "1.2rem" }}
                >
                  −
                </Button>
                <Typography sx={{ minWidth: 40, textAlign: "center", fontWeight: 600 }}>
                  {quantidade}
                </Typography>
                <Button
                  onClick={() => setQuantidade(quantidade + 1)}
                  sx={{ minWidth: 40, height: 40, color: "#666", fontSize: "1.2rem" }}
                >
                  +
                </Button>
              </Box>
            </Box>

            {/* Botões */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<ShoppingCartOutlined />}
              onClick={handleAddToCart}
              sx={{
                display: sobConsulta ? "none" : "inline-flex",
                backgroundColor: "#BF360C",
                "&:hover": { backgroundColor: "#8C2A09" },
                textTransform: "none",
                fontWeight: 600,
                py: 1.5,
                mb: 1.5,
                fontSize: "1rem",
              }}
            >
              Adicionar ao Carrinho
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<WhatsApp />}
              href={waLink}
              target="_blank"
              onClick={() => trackWhatsApp(sobConsulta ? "pdp_orcamento" : "pdp_duvidas", produto.nome)}
              sx={{
                borderColor: "#0E7A3F",
                color: "#0E7A3F",
                textTransform: "none",
                fontWeight: 500,
                py: 1.5,
                "&:hover": {
                  borderColor: "#1ebe5c",
                  backgroundColor: "rgba(37,211,102,0.04)",
                },
              }}
            >
              {sobConsulta ? "Solicitar orçamento no WhatsApp" : "Dúvidas? Fale no WhatsApp"}
            </Button>

            <Box
              sx={{
                mt: 4,
                p: 2,
                backgroundColor: "#f9f9f9",
                borderRadius: 2,
              }}
            >
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <LocalShipping sx={{ color: "primary.main", fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: "#555", fontWeight: 600 }}>
                    Calcular frete e prazo
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") calcularFrete();
                    }}
                    slotProps={{ htmlInput: { inputMode: "numeric", "aria-label": "CEP para calcular o frete" } }}
                    sx={{ flex: 1, backgroundColor: "#fff" }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={calcularFrete}
                    disabled={freteBusy}
                    sx={{ textTransform: "none", borderColor: "primary.main", color: "primary.main", whiteSpace: "nowrap" }}
                  >
                    {freteBusy ? "Calculando…" : "Calcular"}
                  </Button>
                </Box>
                {freteErro && (
                  <Typography variant="caption" sx={{ color: "#b3261e", display: "block", mt: 0.75 }}>
                    {freteErro}
                  </Typography>
                )}
                {opcoesFrete.map((o, i) => (
                  <Box
                    key={i}
                    sx={{ display: "flex", justifyContent: "space-between", gap: 1, mt: 0.75, fontSize: "0.8rem", color: "#444" }}
                  >
                    <Typography variant="caption" sx={{ color: "#444" }}>
                      {o.transportadora} {o.modalidade ? `· ${o.modalidade}` : ""} — {o.prazo}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
                      {o.valor === 0 ? "Grátis" : formatBRL(o.valor)}
                    </Typography>
                  </Box>
                ))}
                {(freteAviso || opcoesFrete.some((o) => o.estimado)) && (
                  <Typography variant="caption" sx={{ color: "#888", display: "block", mt: 1 }}>
                    {freteAviso ||
                      "Valor estimado. O frete final é confirmado no fechamento do pedido."}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <CreditCard sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#555" }}>
                  Pagamento via PIX
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Security sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#555" }}>
                  Atendimento direto no WhatsApp
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Produtos relacionados */}
        {relacionados.length > 0 && (
          <>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 6, mb: 3, color: "#1A1A1A" }}>
              Produtos Relacionados
            </Typography>
            <Grid container spacing={3}>
              {relacionados.map((rel) => (
                <Grid key={rel.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <ProductCardInline produto={rel} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      <Footer />

      {/* Snackbar de feedback */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        slots={{ transition: Slide }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSnackOpen(false)}
          sx={{
            backgroundColor: "#2e7d32",
            fontWeight: 500,
            fontSize: "0.9rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          ✓ {snackProduto} adicionado ao carrinho
        </Alert>
      </Snackbar>

      {/* Carrinho drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        total={items.reduce((sum, item) => sum + item.produto.preco * item.quantidade, 0)}
        onAdd={(item) => addToCart(item.produto)}
        onRemove={removeFromCart}
        onClear={clearCart}
      />

      {/* 2.3 — no celular o botão de comprar ficava 1,3 tela abaixo do preço.
          Barra fixa com preço e ação, só no mobile. */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          alignItems: "center",
          gap: 1,
          px: 1.75,
          pt: 1,
          pb: "max(10px, env(safe-area-inset-bottom))",
          backgroundColor: "#fff",
          borderTop: "1px solid #ececec",
          boxShadow: "0 -4px 18px rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: "#777", display: "block", lineHeight: 1.2 }}>
            {sobConsulta ? "Venda sob consulta" : "À vista no PIX"}
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "#1A1A1A", lineHeight: 1.3 }} noWrap>
            {sobConsulta ? "Orçamento" : formatBRL(produto.preco)}
          </Typography>
        </Box>
        {sobConsulta ? (
          <Button
            variant="contained"
            href={waLink}
            target="_blank"
            startIcon={<WhatsApp />}
            sx={{ backgroundColor: "#0E7A3F", "&:hover": { backgroundColor: "#0a5c2f" }, textTransform: "none", fontWeight: 700, px: 2, flexShrink: 0 }}
          >
            Pedir orçamento
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleAddToCart}
            startIcon={<ShoppingCartOutlined />}
            sx={{ backgroundColor: "#BF360C", "&:hover": { backgroundColor: "#8C2A09" }, textTransform: "none", fontWeight: 700, px: 2, flexShrink: 0 }}
          >
            Comprar
          </Button>
        )}
      </Box>
    </Box>
  );
}

function ProductCardInline({ produto }: { produto: Produto }) {
  const router = useRouter();
  return (
    <Paper
      onClick={() => router.push(`/produto/${produto.id}`)}
      sx={{
        p: 2,
        borderRadius: 3,
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
      }}
    >
      <Box
        component="img"
        src={
          isCloudinaryUrl(produto.imgUrl)
            ? thumbUrl(extractPublicId(produto.imgUrl))
            : produto.imgUrl
        }
        alt={produto.nome}
        loading="lazy"
        width="300"
        height="150"
        sx={{
          width: "100%",
          height: 150,
          objectFit: "contain",
          backgroundColor: "#ffffff",
          borderRadius: 2,
          mb: 1,
          border: "1px solid #eee",
          aspectRatio: "2/1",
        }}
      />
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {produto.nome.substring(0, 50)}...
      </Typography>
      <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700 }}>
        {produto.preco <= 0 ? "Sob Consulta" : `${formatBRL(produto.preco)}`}
      </Typography>
    </Paper>
  );
}
