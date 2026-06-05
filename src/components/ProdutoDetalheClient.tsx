"use client";

import { useState } from "react";
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
  const { addToCart, items, removeFromCart, clearCart } = useCart();

  const [quantidade, setQuantidade] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackProduto, setSnackProduto] = useState("");

  if (!produto) {
    notFound();
  }

  const parcelas = produto.parcelamento || 12;
  const valorParcela = produto.preco / parcelas;
  const sobConsulta = produto.preco <= 0;

  const handleAddToCart = () => {
    // addToCart no contexto sempre adiciona 1, então chamamos N vezes
    for (let i = 0; i < quantidade; i++) {
      addToCart(produto);
    }
    setSnackProduto(produto.nome);
    setSnackOpen(true);
  };

  const allImages = [produto.imgUrl, ...(produto.galeria || [])];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header onCartOpen={() => setCartOpen(true)} cartItemCount={items.length} />

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
              component="button"
              underline="hover"
              sx={{ color: "#666", fontSize: "0.85rem" }}
            >
              {categoria.nome}
            </MuiLink>
          )}
          <Typography variant="body2" sx={{ color: "#E65100", fontSize: "0.85rem" }}>
            {produto.nome.substring(0, 40)}...
          </Typography>
        </Breadcrumbs>

        {/* Botão voltar */}
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
                }}
              >
                <Box
                  component="img"
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

            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: "#1A1A1A" }}>
              {produto.nome}
            </Typography>

            <Typography variant="body1" sx={{ color: "#666", mb: 3, lineHeight: 1.7 }}>
              {produto.descricao}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Typography
              variant="h3"
              sx={{
                color: "#E65100",
                fontWeight: 700,
                fontSize: { xs: "1.8rem", md: "2.2rem" },
                mb: 1,
              }}
            >
              {sobConsulta ? "Sob Consulta" : `R$ ${produto.preco.toFixed(2)}`}
            </Typography>

            {!sobConsulta && (
              <Typography variant="body1" sx={{ color: "#666", mb: 3 }}>
                ou{" "}
                <Box component="span" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
                  {parcelas}x de R$ {valorParcela.toFixed(2)}
                </Box>{" "}
                sem juros
              </Typography>
            )}

            {/* Quantidade */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
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
                backgroundColor: "#E65100",
                "&:hover": { backgroundColor: "#BF360C" },
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
              href={`https://wa.me/5544998133182?text=Olá! Tenho interesse em: ${produto.nome}${sobConsulta ? "" : ` (R$ ${produto.preco.toFixed(2)})`}`}
              target="_blank"
              sx={{
                borderColor: "#25D366",
                color: "#25D366",
                textTransform: "none",
                fontWeight: 500,
                py: 1.5,
                "&:hover": {
                  borderColor: "#1ebe5c",
                  backgroundColor: "rgba(37,211,102,0.04)",
                },
              }}
            >
              Dúvidas? Fale no WhatsApp
            </Button>

            <Box
              sx={{
                mt: 4,
                p: 2,
                backgroundColor: "#f9f9f9",
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <LocalShipping sx={{ color: "#E65100", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#555" }}>
                  Frete calculado no carrinho
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <CreditCard sx={{ color: "#E65100", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#555" }}>
                  Parcele em até {parcelas}x sem juros
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Security sx={{ color: "#E65100", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#555" }}>
                  Compra segura — loja oficial CarCrew
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
        src={produto.imgUrl}
        alt={produto.nome}
        sx={{
          width: "100%",
          height: 150,
          objectFit: "contain",
          backgroundColor: "#ffffff",
          borderRadius: 2,
          mb: 1,
          border: "1px solid #eee",
        }}
      />
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {produto.nome.substring(0, 50)}...
      </Typography>
      <Typography variant="h6" sx={{ color: "#E65100", fontWeight: 700 }}>
        {produto.preco <= 0 ? "Sob Consulta" : `R$ ${produto.preco.toFixed(2)}`}
      </Typography>
    </Paper>
  );
}
