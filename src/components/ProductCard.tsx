"use client";

import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { WhatsApp } from "@mui/icons-material";
import { Produto } from "@/types";

interface ProductCardProps {
  produto: Produto;
  onAddToCart: (produto: Produto) => void;
}

export default function ProductCard({
  produto,
  onAddToCart,
}: ProductCardProps) {
  const parcelas = produto.parcelamento || 12;
  const valorParcela = produto.preco / parcelas;

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* Imagem */}
      <CardMedia
        component="img"
        height="200"
        image={produto.imgUrl}
        alt={produto.nome}
        sx={{
          objectFit: "cover",
          backgroundColor: "#f5f5f5",
        }}
      />

      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: 2,
        }}
      >
        {/* Nome */}
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            fontSize: "0.95rem",
            mb: 0.5,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {produto.nome}
        </Typography>

        {/* Descrição */}
        <Typography
          variant="body2"
          sx={{
            color: "#777",
            fontSize: "0.8rem",
            mb: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {produto.descricao}
        </Typography>

        {/* Espaço flexível */}
        <Box sx={{ flex: 1 }} />

        {/* Preço */}
        <Typography
          variant="h6"
          sx={{
            color: "#E65100",
            fontWeight: 700,
            fontSize: "1.3rem",
            mb: 0.5,
          }}
        >
          R$ {produto.preco.toFixed(2)}
        </Typography>

        {/* Parcelamento */}
        <Typography
          variant="caption"
          sx={{ color: "#666", mb: 2, fontSize: "0.8rem" }}
        >
          ou {parcelas}x de R$ {valorParcela.toFixed(2)} sem juros
        </Typography>

        {/* Botões */}
        <Button
          fullWidth
          variant="contained"
          onClick={() => onAddToCart(produto)}
          sx={{
            backgroundColor: "#E65100",
            "&:hover": { backgroundColor: "#BF360C" },
            textTransform: "none",
            fontWeight: 600,
            py: 1,
            mb: 1,
          }}
        >
          Adicionar ao Carrinho
        </Button>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<WhatsApp />}
          href={`https://wa.me/5544991528386?text=Olá! Tenho interesse em: ${produto.nome}`}
          target="_blank"
          sx={{
            borderColor: "#25D366",
            color: "#25D366",
            textTransform: "none",
            fontSize: "0.8rem",
            fontWeight: 500,
            "&:hover": {
              borderColor: "#1ebe5c",
              backgroundColor: "rgba(37, 211, 102, 0.04)",
            },
          }}
        >
          Dúvidas? Fale no WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}
