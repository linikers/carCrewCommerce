"use client";

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
  CircularProgress,
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
import { ItemCarrinho } from "@/types";
import { useState, useEffect } from "react";
import { isCloudinaryUrl, detailUrl, extractPublicId } from "@/lib/cloudinary";

interface ProdutoDetalheData {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imgUrl: string;
  category: string;
  parcelamento: number;
  veiculos?: string[];
}

interface CategoriaData {
  slug: string;
  nome: string;
  icone: string;
}

export default function ProdutoDetalhe() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [produto, setProduto] = useState<ProdutoDetalheData | null>(null);
  const [categorias, setCategorias] = useState<CategoriaData[]>([]);
  const [produtos, setProdutos] = useState<ProdutoDetalheData[]>([]);
  const [loading, setLoading] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    Promise.all([
      fetch(`/api/produtos?id=${id}`).then((r) => r.json()),
      fetch("/api/categorias").then((r) => r.json()),
      fetch("/api/produtos").then((r) => r.json()),
    ])
      .then(([prodData, catData, allProds]) => {
        if (Array.isArray(prodData) && prodData.length > 0) {
          setProduto(prodData[0]);
          document.title = `${prodData[0].nome} | CarCrew Suspensões`;
        } else {
          setNaoEncontrado(true);
        }
        setCategorias(catData);
        setProdutos(allProds);
      })
      .catch(() => setNaoEncontrado(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
          <CircularProgress sx={{ color: "#E65100" }} />
        </Box>
        <Footer />
      </Box>
    );
  }

  if (naoEncontrado || !produto) {
    notFound();
  }

  const categoria = categorias.find((c) => c.slug === produto.category);
  const parcelas = produto.parcelamento || 12;
  const valorParcela = produto.preco / parcelas;

  const relacionados = produtos.filter(
    (p) => p.category === produto.category && p.id !== produto.id
  ).slice(0, 3);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

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
          {/* Imagem */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{
                p: { xs: 2, md: 4 },
                backgroundColor: "#1A1A1A",
                borderRadius: 4,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 350,
              }}
            >
              <Box
                component="img"
                src={
                  isCloudinaryUrl(produto.imgUrl)
                    ? detailUrl(extractPublicId(produto.imgUrl))
                    : produto.imgUrl
                }
                alt={produto.nome}
                sx={{
                  maxWidth: "100%",
                  maxHeight: 400,
                  objectFit: "contain",
                }}
              />
            </Paper>
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
              R$ {produto.preco.toFixed(2)}
            </Typography>

            <Typography variant="body1" sx={{ color: "#666", mb: 3 }}>
              ou{" "}
              <Box component="span" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
                {parcelas}x de R$ {valorParcela.toFixed(2)}
              </Box>{" "}
              sem juros
            </Typography>

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
              href={`https://wa.me/5544991528386?text=Olá! Tenho interesse em: ${produto.nome} (R$ ${produto.preco.toFixed(2)})`}
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
    </Box>
  );
}

function ProductCardInline({ produto }: { produto: ProdutoDetalheData }) {
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
          backgroundColor: "#1A1A1A",
          borderRadius: 2,
          mb: 1,
        }}
      />
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {produto.nome.substring(0, 50)}...
      </Typography>
      <Typography variant="h6" sx={{ color: "#E65100", fontWeight: 700 }}>
        R$ {produto.preco.toFixed(2)}
      </Typography>
    </Paper>
  );
}
