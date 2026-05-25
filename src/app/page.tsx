"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import { produtos } from "@/lib/produtos";
import { categorias } from "@/lib/categorias";
import { Produto, ItemCarrinho } from "@/types";

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<ItemCarrinho[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const addToCart = (produto: Produto) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.produto.id === produto.id
      );
      if (existing) {
        return prev.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const removeFromCart = (item: ItemCarrinho) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.produto.id === item.produto.id
      );
      if (existing && existing.quantidade <= 1) {
        return prev.filter((i) => i.produto.id !== item.produto.id);
      }
      return prev.map((i) =>
        i.produto.id === item.produto.id
          ? { ...i, quantidade: i.quantidade - 1 }
          : i
      );
    });
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantidade, 0);

  // Filtro por busca
  const filteredProdutos = searchTerm
    ? produtos.filter((p) =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : produtos;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header
        cartItemCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        onSearch={setSearchTerm}
      />

      {/* Banner destaque */}
      <Box
        sx={{
          backgroundColor: "#1A1A1A",
          color: "#ffffff",
          py: { xs: 4, md: 6 },
          textAlign: "center",
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.5rem", md: "2.5rem" },
              mb: 1,
            }}
          >
            Peças para{" "}
            <Box component="span" sx={{ color: "#E65100" }}>
              Suspensão Automotiva
            </Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#aaa", maxWidth: 600, mx: "auto", mb: 3 }}
          >
            Amortecedores, molas, calços, ponta de eixo e tudo que você precisa
            para sua suspensão. Qualidade e confiança.
          </Typography>
        </Container>
      </Box>

      {/* Info strip */}
      <Box sx={{ backgroundColor: "#f5f5f5", py: 3 }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {[
              { titulo: "Descontos", desc: "Aproveite nossas melhores ofertas" },
              { titulo: "Pague com Cartão", desc: "em até 12x sem juros" },
              { titulo: "Segurança", desc: "Loja oficial CarCrew" },
            ].map((item) => (
              <Box
                key={item.titulo}
                sx={{ textAlign: "center", flex: { xs: "1 1 100%", sm: "1 1 30%" } }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#E65100" }}
                >
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

      {/* Categorias */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 3, color: "#1A1A1A" }}
        >
          Categorias
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {categorias.map((cat) => (
            <Box
              key={cat.slug}
              sx={{ flex: { xs: "1 1 calc(50% - 8px)", sm: "1 1 calc(25% - 8px)", md: "1 1 calc(16.66% - 10px)" } }}
            >
              <Card
                sx={{
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#E65100",
                    boxShadow: "0 4px 12px rgba(230,81,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {cat.icone}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, fontSize: "0.8rem" }}
                  >
                    {cat.nome}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Produtos */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 3, color: "#1A1A1A" }}
        >
          {searchTerm
            ? `Resultados para "${searchTerm}"`
            : "Novidades"}
        </Typography>

        {filteredProdutos.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "#999" }}>
            <Typography variant="h6">
              Nenhum produto encontrado
            </Typography>
            <Typography variant="body2">
              Tente buscar por outro termo
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredProdutos.map((produto) => (
              <Grid key={produto.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <ProductCard
                  produto={produto}
                  onAddToCart={addToCart}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Footer />

      {/* Carrinho drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onAdd={(item) => addToCart(item.produto)}
        onRemove={removeFromCart}
        onClear={clearCart}
      />
    </Box>
  );
}
