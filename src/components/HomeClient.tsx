"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos, LocalShipping, Security, CreditCard } from "@mui/icons-material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/lib/CartContext";
import { CategoriaSlug, Produto } from "@/types";

interface ProdutoData extends Produto {
  estoque: number;
  ativo: boolean;
}

interface CategoriaData {
  slug: string;
  nome: string;
  icone: string;
}

interface BannerData {
  titulo: string;
  subtitulo?: string;
  imgDesktop?: string;
  imgMobile?: string;
  link?: string;
  corFundo: string;
  corTexto: string;
  ativo: boolean;
}

interface HomeClientProps {
  produtos: ProdutoData[];
  categorias: CategoriaData[];
  banners: BannerData[];
}

const seoLinks = [
  {
    href: "/suspensao-a-ar",
    titulo: "Suspensão a Ar",
    desc: "Bolsas de ar, compressores e controles para sistema pneumático",
    emoji: "🎈",
  },
  {
    href: "/rebaixamento",
    titulo: "Rebaixamento",
    desc: "Calços antirruído, kits, bandejas e pontas de eixo",
    emoji: "⬇️",
  },
  {
    href: "/suspensao-esportiva",
    titulo: "Suspensão Esportiva",
    desc: "Amortecedores e kits para um carro mais estável e esportivo",
    emoji: "🏁",
  },
  {
    href: "/off-road",
    titulo: "Off-Road 4x4",
    desc: "Lift kits e preparação para trilha e aventura",
    emoji: "4x4",
  },
];

export default function HomeClient({ produtos, categorias, banners }: HomeClientProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaSlug | null>(null);

  const { items, totalItens, addToCart, removeFromCart, clearCart } = useCart();

  // Lê ?cat=slug da URL na inicialização (ex: vindo do Header fora da home)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat) setCategoriaAtiva(cat as CategoriaSlug);
    const q = params.get("q");
    if (q) setSearchTerm(q);
  }, []);

  const [bannerIndex, setBannerIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Auto-rotate dos banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setBannerIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Snackbar de feedback
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackProduto, setSnackProduto] = useState("");

  const handleAddToCart = (produto: any) => {
    addToCart(produto);
    setSnackProduto(produto.nome);
    setSnackOpen(true);
  };

  const bannerAnterior = () => setBannerIndex((i) => (i === 0 ? banners.length - 1 : i - 1));
  const bannerProximo = () => setBannerIndex((i) => (i + 1) % banners.length);

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
          {banners[bannerIndex]?.link && (
            <Box
              component="a"
              href={banners[bannerIndex]?.link}
              aria-label={banners[bannerIndex]?.titulo || "Ver oferta"}
              sx={{ position: "absolute", inset: 0, zIndex: 1 }}
            />
          )}
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
              { icon: <CreditCard sx={{ color: "#E65100" }} />, titulo: "Pagamento", desc: "via PIX" },
              { icon: <Security sx={{ color: "#E65100" }} />, titulo: "Atendimento", desc: "direto no WhatsApp" },
              { icon: <LocalShipping sx={{ color: "#E65100" }} />, titulo: "Entrega", desc: "para todo o Brasil" },
            ].map((item) => (
              <Box
                key={item.titulo}
                sx={{ textAlign: "center", flex: { xs: "1 1 100%", sm: "1 1 30%" } }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  {item.icon}
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#E65100" }}>
                    {item.titulo}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "#666" }}>
                  {item.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Bloco SEO — H1 + categorias de serviço */}
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.75rem", md: "2.5rem" },
              color: "#1A1A1A",
              lineHeight: 1.2,
              mb: 1.5,
            }}
          >
            Car Crew Garage — Suspensão Automotiva Custom em Maringá
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#666", maxWidth: 780, mx: "auto", fontSize: { xs: "0.95rem", md: "1.05rem" }, lineHeight: 1.8 }}
          >
            Especialistas em suspensão a ar, rebaixamento e suspensão esportiva em Maringá-PR.
            Bolsas de ar, compressores, calços antirruído, amortecedores, kits e componentes para
            deixar seu carro com a altura e o desempenho que você sempre quis. Entrega para todo o Brasil.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", mb: 2 }}>
          {seoLinks.map((l) => (
            <Box
              key={l.href}
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 16px)", md: "1 1 calc(25% - 24px)" },
              }}
            >
              <Link href={l.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: "1px solid #e0e0e0",
                    height: "100%",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "#E65100", boxShadow: "0 4px 16px rgba(230,81,0,0.12)", transform: "translateY(-2px)" },
                  }}
                >
                  <Typography sx={{ fontSize: 28, lineHeight: 1, mb: 1, color: "#E65100", fontWeight: 900 }}>
                    {l.emoji}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
                    {l.titulo}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
                    {l.desc}
                  </Typography>
                </Box>
              </Link>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Produtos */}
      <Container maxWidth="lg" sx={{ mt: 3, mb: 6 }}>
        {/* Filtro por veículo */}
        {todosVeiculos.length > 0 && (
          <Box sx={{ mb: 2 }}>
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
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h2" component="h2" sx={{ fontWeight: 700, color: "#1A1A1A", fontSize: "1.5rem" }}>
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

        {!categoriaAtiva && !searchTerm && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            {categorias.map((c) => (
              <Chip
                key={c.slug}
                label={`${c.icone} ${c.nome}`}
                onClick={() => toggleCategoria(c.slug as CategoriaSlug)}
                sx={{
                  cursor: "pointer",
                  backgroundColor: categoriaAtiva === c.slug ? "#E65100" : "#f5f5f5",
                  color: categoriaAtiva === c.slug ? "#fff" : "#444",
                  "&:hover": { backgroundColor: categoriaAtiva === c.slug ? "#d84a00" : "#e8e8e8" },
                }}
              />
            ))}
          </Box>
        )}

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
