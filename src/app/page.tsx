"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import { produtos } from "@/lib/produtos";
import { categorias } from "@/lib/categorias";
import { useCart } from "@/lib/CartContext";
import { CategoriaSlug } from "@/types";

export default function Home() {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaSlug | null>(
    null
  );

  const { items, totalItens, addToCart, removeFromCart, clearCart } = useCart();

  // Filtro por busca + categoria
  const filteredProdutos = produtos.filter((p) => {
    const matchSearch =
      !searchTerm ||
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = !categoriaAtiva || p.category === categoriaAtiva;
    return matchSearch && matchCategoria;
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
      />

      {/* Banner */}
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
                sx={{
                  textAlign: "center",
                  flex: { xs: "1 1 100%", sm: "1 1 30%" },
                }}
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
          {categorias.map((cat) => {
            const isActive = categoriaAtiva === cat.slug;
            return (
              <Box
                key={cat.slug}
                sx={{
                  flex: {
                    xs: "1 1 calc(50% - 8px)",
                    sm: "1 1 calc(25% - 8px)",
                    md: "1 1 calc(16.66% - 10px)",
                  },
                }}
              >
                <Card
                  onClick={() => toggleCategoria(cat.slug)}
                  sx={{
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: isActive
                      ? "2px solid #E65100"
                      : "2px solid transparent",
                    backgroundColor: isActive ? "#fff5f0" : "#fff",
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
                      sx={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.8rem",
                        color: isActive ? "#E65100" : "#1A1A1A",
                      }}
                    >
                      {cat.nome}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>

        {categoriaAtiva && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={`${
                categorias.find((c) => c.slug === categoriaAtiva)?.nome
              } — ${filteredProdutos.length} produto(s)`}
              onDelete={() => setCategoriaAtiva(null)}
              sx={{
                backgroundColor: "#E65100",
                color: "#fff",
                fontWeight: 500,
              }}
            />
          </Box>
        )}
      </Container>

      {/* Produtos */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#1A1A1A" }}
          >
            {searchTerm
              ? `Resultados para "${searchTerm}"`
              : categoriaAtiva
              ? "Produtos"
              : "Novidades"}
          </Typography>
          {!categoriaAtiva && !searchTerm && (
            <Typography variant="body2" sx={{ color: "#999" }}>
              {produtos.length} produto(s)
            </Typography>
          )}
        </Box>

        {filteredProdutos.length === 0 ? (
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
                <ProductCard produto={produto} onAddToCart={addToCart} />
              </Box>
            ))}
          </Box>
        )}
      </Container>

      <Footer />

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
