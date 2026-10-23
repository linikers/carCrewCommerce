"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Box,
  Button,
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
import {
  ArrowBackIos,
  ArrowForwardIos,
  LocalShipping,
  Security,
  CreditCard,
  Air,
  ArrowDownward,
  SportsScore,
  Terrain,
} from "@mui/icons-material";
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
    icone: <Air sx={{ fontSize: 30 }} />,
  },
  {
    href: "/rebaixamento",
    titulo: "Rebaixamento",
    desc: "Calços antirruído, kits, bandejas e pontas de eixo",
    icone: <ArrowDownward sx={{ fontSize: 30 }} />,
  },
  {
    href: "/suspensao-esportiva",
    titulo: "Suspensão Esportiva",
    desc: "Amortecedores e kits para um carro mais estável e esportivo",
    icone: <SportsScore sx={{ fontSize: 30 }} />,
  },
  {
    href: "/off-road",
    titulo: "Off-Road 4x4",
    desc: "Lift kits e preparação para trilha e aventura",
    icone: <Terrain sx={{ fontSize: 30 }} />,
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

  // 1.5: a home despejava os 48 produtos. Agora mostra 8 e pagina no clique.
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const semFiltro = !categoriaAtiva && !searchTerm && !veiculoSelecionado;
  const listados = semFiltro && !mostrarTodos ? filteredProdutos.slice(0, 8) : filteredProdutos;

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
            minHeight: { xs: 180, md: 300 },
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

      {/* 1.4 — grade de categorias com foto e contagem, no lugar dos chips */}
      <Container maxWidth="lg" sx={{ mt: { xs: 2.5, md: 4 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1.5, gap: 2, flexWrap: "wrap" }}>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
            Comprar por categoria
          </Typography>
          <Typography variant="body2" sx={{ color: "#666" }}>
            {produtos.length} peças em {categorias.length} categorias
          </Typography>
        </Box>
        {/* Uma linha só: 8 no desktop, 4 no celular em scroll horizontal.
            Grade 2x2 no mobile empurrava a vitrine para 1.576 px. */}
        <Box
          sx={{
            display: "flex",
            gap: { xs: 1.5, md: 1.5 },
            overflowX: { xs: "auto", md: "visible" },
            pb: { xs: 1, md: 0 },
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {categorias.slice(0, 8).map((c) => {
            const itens = produtos.filter((p) => p.category === c.slug);
            const foto = itens.find((p) => p.imgUrl && !p.imgUrl.includes("placeholder"))?.imgUrl;
            return (
              <Box
                key={c.slug}
                component="a"
                href={`/?cat=${c.slug}`}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  toggleCategoria(c.slug as CategoriaSlug);
                  document.getElementById("vitrine")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                sx={{
                  display: "block",
                  flex: { xs: "0 0 26%", md: "1 1 0" },
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #e6e6e6",
                  borderRadius: 2.5,
                  overflow: "hidden",
                  transition: "border-color .15s ease, box-shadow .15s ease",
                  "&:hover": { borderColor: "primary.main", boxShadow: "0 6px 18px rgba(0,0,0,0.08)" },
                }}
              >
                <Box sx={{ position: "relative", aspectRatio: "1 / 1", backgroundColor: "#f2f2f2" }}>
                  {foto && (
                    <Box
                      component="img"
                      src={foto}
                      alt={c.nome}
                      loading="lazy"
                      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}
                </Box>
                <Box sx={{ px: 1, py: 0.75 }}>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", fontWeight: 700, color: "#1A1A1A", lineHeight: 1.2, fontSize: { xs: "0.7rem", md: "0.78rem" } }}
                  >
                    {c.nome}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#888", fontSize: "0.65rem" }}>
                    {itens.length} {itens.length === 1 ? "peça" : "peças"}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>

      {/* Vitrine */}
      <Container id="vitrine" maxWidth="lg" sx={{ mt: 3, mb: 6, scrollMarginTop: 96 }}>
        {/* Título + filtros em uma linha só: as 10 chips de categoria saíram
            (a grade de categorias já é a navegação) e o filtro de veículo
            virou um select compacto à direita. */}
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 2.5,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box>
            <Typography component="h2" sx={{ fontWeight: 800, color: "#1A1A1A", fontSize: { xs: "1.35rem", md: "1.6rem" }, lineHeight: 1.2 }}>
              {searchTerm
                ? `Resultados para "${searchTerm}"`
                : categoriaAtiva
                ? "Produtos"
                : "Destaques"}
            </Typography>
            {semFiltro && produtos.length > 0 && (
              <Typography variant="body2" sx={{ color: "#666" }}>
                {mostrarTodos ? `${produtos.length} peças` : `8 de ${produtos.length} peças`}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {(categoriaAtiva || searchTerm || veiculoSelecionado) && (
              <Chip
                label="Limpar filtros"
                size="small"
                onClick={() => {
                  setCategoriaAtiva(null);
                  setSearchTerm("");
                  setVeiculoSelecionado("");
                }}
                sx={{ backgroundColor: "#f2f2f2" }}
              />
            )}
            {todosVeiculos.length > 0 && (
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
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
            )}
          </Box>
        </Box>

        {produtos.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "#666" }}>
            <Typography variant="h6">Nenhum produto cadastrado</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Acesse o painel admin para cadastrar seus produtos
            </Typography>
          </Box>
        ) : filteredProdutos.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "#666" }}>
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
          /* Grid de verdade, não flex: com `flex: 1 1 33%` o último item de
             uma linha incompleta crescia e ocupava as três colunas — o card
             ficava gigante em "Componentes", que tem quantidade ímpar. */
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
              },
              alignItems: "stretch",
            }}
          >
            {listados.map((produto) => (
              <ProductCard
                key={produto.id}
                produto={produto as any}
                onAddToCart={handleAddToCart}
              />
            ))}
          </Box>
        )}

        {/* 1.5 — a home mostrava os 48 produtos de uma vez (12 mil px de página) */}
        {semFiltro && !mostrarTodos && filteredProdutos.length > listados.length && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setMostrarTodos(true)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: "primary.main",
                color: "primary.main",
                px: 4,
                "&:hover": { borderColor: "primary.dark", backgroundColor: "rgba(191,54,12,0.04)" },
              }}
            >
              Ver todas as {filteredProdutos.length} peças
            </Button>
            <Typography variant="caption" sx={{ color: "#666" }}>
              Mostrando 8 de {filteredProdutos.length}
            </Typography>
          </Box>
        )}
      </Container>

      {/* Info strip */}
      <Box sx={{ backgroundColor: "#f7f7f7", borderTop: "1px solid #ececec", py: { xs: 2, md: 3 } }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: { xs: 1, md: 2 },
            }}
          >
            {[
              { icon: <CreditCard sx={{ color: "primary.main" }} />, titulo: "Pagamento", desc: "via PIX" },
              { icon: <Security sx={{ color: "primary.main" }} />, titulo: "Atendimento", desc: "direto no WhatsApp" },
              { icon: <LocalShipping sx={{ color: "primary.main" }} />, titulo: "Entrega", desc: "para todo o Brasil" },
            ].map((item) => (
              <Box key={item.titulo} sx={{ textAlign: "center", minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: { xs: 0.5, md: 1 } }}>
                  {item.icon}
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", fontSize: { xs: "0.8rem", md: "1rem" } }}>
                    {item.titulo}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "#666", fontSize: { xs: "0.7rem", md: "0.85rem" }, display: "block" }}>
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
            Suspensão a ar, rebaixamento e lift em Maringá
            <Box component="span" sx={{ display: "block", fontSize: { xs: "1rem", md: "1.25rem" }, fontWeight: 600, color: "#666", mt: 1 }}>
              Peças em estoque, instalação na oficina e envio para todo o Brasil
            </Box>
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
        <Box
          sx={{
            display: "grid",
            gap: 2,
            mb: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {seoLinks.map((l) => (
            <Box key={l.href} sx={{ height: "100%" }}>
              <Link href={l.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: "1px solid #e0e0e0",
                    height: "100%",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "primary.main", boxShadow: "0 4px 16px rgba(230,81,0,0.12)", transform: "translateY(-2px)" },
                  }}
                >
                  <Box sx={{ color: "primary.main", mb: 1, lineHeight: 1, display: "flex" }}>
                    {l.icone}
                  </Box>
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
