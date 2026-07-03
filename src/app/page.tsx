"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Slide,
  useMediaQuery,
  useTheme,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/lib/CartContext";
import { CategoriaSlug } from "@/types";

interface ProdutoData {
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

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaSlug | null>(null);

  const { items, totalItens, addToCart, removeFromCart, clearCart } = useCart();
  // Dados dinâmicos da API
  const [produtos, setProdutos] = useState<ProdutoData[]>([]);
  const [categorias, setCategorias] = useState<CategoriaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/produtos").then((r) => r.json()),
      fetch("/api/categorias").then((r) => r.json()),
    ])
      .then(([prods, cats]) => {
        setProdutos(prods);
        setCategorias(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Snackbar de feedback
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackProduto, setSnackProduto] = useState("");

  const handleAddToCart = (produto: any) => {
    addToCart(produto);
    setSnackProduto(produto.nome);
    setSnackOpen(true);
  };

  // Banners
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetch("/api/admin/banners")
      .then((r) => r.json())
      .then((data) => setBanners(data.filter((b: any) => b.ativo)))
      .catch(() => {});
  }, []);

  const bannerAnterior = () => setBannerIndex((i) => (i === 0 ? banners.length - 1 : i - 1));
  const bannerProximo = () => setBannerIndex((i) => (i === banners.length - 1 ? 0 : i + 1));

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => bannerProximo(), 5000);
    return () => clearInterval(timer);
  }, [banners.length, bannerIndex]);

  // Filtro por veículo
  const [veiculoSelecionado, setVeiculoSelecionado] = useState("");
  const todosVeiculos = [...new Set(produtos.flatMap((p) => p.veiculos || []))].sort();

  // Filtro por busca + categoria + veículo
  const filteredProdutos = produtos.filter((p) => {
    const matchSearch =
      !searchTerm ||
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = !categoriaAtiva || p.category === categoriaAtiva;
    const matchVeiculo =
      !veiculoSelecionado ||
      (p.veiculos && p.veiculos.includes(veiculoSelecionado));
    return matchSearch && matchCategoria && matchVeiculo;
  });

  const toggleCategoria = (slug: CategoriaSlug) => {
    setCategoriaAtiva(categoriaAtiva === slug ? null : slug);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header
        cartItemCount={totalItens}
        onCartOpen={() => setCartOpen(true)}
        onSearch={(term) => {
          setSearchTerm(term);
          setCategoriaAtiva(null);
        }}
        activeCategory={categoriaAtiva}
        onCategorySelect={(slug) => setCategoriaAtiva(slug as CategoriaSlug | null)}
      />

      {/* Banner carrossel dinâmico */}
      {banners.length > 0 && (
        <Box
          sx={{
            position: "relative",
            backgroundColor: banners[bannerIndex]?.corFundo || "#1A1A1A",
            color: banners[bannerIndex]?.corTexto || "#fff",
            overflow: "hidden",
            minHeight: { xs: 200, md: 350 },
            display: "flex",
            alignItems: "center",
            transition: "background-color 0.5s ease",
          }}
        >
          <Box
            component="img"
            fetchPriority="high"
            src={isMobile ? banners[bannerIndex]?.imgMobile : banners[bannerIndex]?.imgDesktop}
            alt={banners[bannerIndex]?.titulo}
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              inset: 0,
            }}
          />
          {banners.length > 1 && (
            <>
              <IconButton
                onClick={bannerAnterior}
                sx={{
                  position: "absolute",
                  left: { xs: 4, md: 16 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: banners[bannerIndex]?.corTexto || "#fff",
                  bgcolor: "rgba(0,0,0,0.2)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.4)" },
                  zIndex: 2,
                }}
              >
                <ArrowBackIos fontSize="small" />
              </IconButton>
              <IconButton
                onClick={bannerProximo}
                sx={{
                  position: "absolute",
                  right: { xs: 4, md: 16 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: banners[bannerIndex]?.corTexto || "#fff",
                  bgcolor: "rgba(0,0,0,0.2)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.4)" },
                  zIndex: 2,
                }}
              >
                <ArrowForwardIos fontSize="small" />
              </IconButton>
            </>
          )}
          {banners.length > 1 && (
            <Box
              sx={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 1,
                zIndex: 2,
              }}
            >
              {banners.map((_, i) => (
                <Box
                  key={i}
                  onClick={() => setBannerIndex(i)}
                  sx={{
                    width: i === bannerIndex ? 24 : 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor:
                      i === bannerIndex
                        ? banners[bannerIndex]?.corTexto || "#fff"
                        : "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Info strip */}
      <Box sx={{ backgroundColor: "#f5f5f5", py: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 2 }}>
            {[
              { titulo: "Descontos", desc: "Aproveite nossas melhores ofertas" },
              { titulo: "Pague com Cartão", desc: "em até 12x sem juros" },
              { titulo: "Segurança", desc: "Loja oficial Car Crew Garage" },
            ].map((item) => (
              <Box
                key={item.titulo}
                sx={{ textAlign: "center", flex: { xs: "1 1 100%", sm: "1 1 30%" } }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#E65100" }}>
                  {item.titulo}
                </Typography>
                <Typography variant="body2" sx={{ color: "#666" }}>
                  {item.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#E65100" }} />
        </Box>
      ) : (
        <>
          {/* Filtro por veículo */}
          {todosVeiculos.length > 0 && (
            <Container maxWidth="lg" sx={{ mt: 3, mb: 1 }}>
              <FormControl size="small" sx={{ minWidth: 280 }}>
                <InputLabel>Filtrar por veículo</InputLabel>
                <Select
                  value={veiculoSelecionado}
                  label="Filtrar por veículo"
                  onChange={(e) => { setVeiculoSelecionado(e.target.value); setCategoriaAtiva(null); }}
                >
                  <MenuItem value="">Todos os veículos</MenuItem>
                  {todosVeiculos.map((v) => (
                    <MenuItem key={v} value={v}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {veiculoSelecionado && (
                <Chip
                  label={veiculoSelecionado}
                  onDelete={() => setVeiculoSelecionado("")}
                  sx={{ ml: 1, backgroundColor: "#E65100", color: "#fff" }}
                />
              )}
            </Container>
          )}

          {/* Produtos */}
          <Container maxWidth="lg" sx={{ mb: 6 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
                {searchTerm
                  ? `Resultados para "${searchTerm}"`
                  : categoriaAtiva
                  ? "Produtos"
                  : "Novidades"}
              </Typography>
              {!categoriaAtiva && !searchTerm && produtos.length > 0 && (
                <Typography variant="body2" sx={{ color: "#999" }}>
                  {produtos.length} produto(s)
                </Typography>
              )}
            </Box>

            {produtos.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8, color: "#999" }}>
                <Typography variant="h6">Nenhum produto cadastrado</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Acesse o painel admin para cadastrar seus produtos
                </Typography>
              </Box>
            ) : filteredProdutos.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8, color: "#999" }}>
                <Typography variant="h6">Nenhum produto encontrado</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Tente buscar por outro termo ou limpe os filtros
                </Typography>
                {categoriaAtiva && (
                  <Chip
                    label="Limpar filtros"
                    onClick={() => setCategoriaAtiva(null)}
                    sx={{ cursor: "pointer" }}
                  />
                )}
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {filteredProdutos.map((produto) => (
                  <Box
                    key={produto.id}
                    sx={{
                      flex: {
                        xs: "1 1 100%",
                        sm: "1 1 calc(50% - 12px)",
                        md: "1 1 calc(33.33% - 16px)",
                      },
                    }}
                  >
                    <ProductCard produto={produto as any} onAddToCart={handleAddToCart} />
                  </Box>
                ))}
              </Box>
            )}
          </Container>
        </>
      )}

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
        onAdd={(item) => handleAddToCart(item.produto)}
        onRemove={removeFromCart}
        onClear={clearCart}
      />
    </Box>
  );
}
