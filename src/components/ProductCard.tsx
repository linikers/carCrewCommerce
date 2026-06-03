"use client";

import { useRouter } from "next/navigation";
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
import { isCloudinaryUrl, thumbUrl, extractPublicId } from "@/lib/cloudinary";

interface ProductCardProps {
  produto: Produto;
  onAddToCart: (produto: Produto) => void;
}

export default function ProductCard({
  produto,
  onAddToCart,
}: ProductCardProps) {
  const router = useRouter();
  const parcelas = produto.parcelamento || 12;
  const valorParcela = produto.preco / parcelas;
  const sobConsulta = produto.preco <= 0;

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        cursor: "pointer",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          transform: "translateY(-2px)",
        },
      }}
      onClick={() => router.push(`/produto/${produto.id}`)}
    >
      {/* Imagem */}
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          height="200"
          image={
            isCloudinaryUrl(produto.imgUrl)
              ? thumbUrl(extractPublicId(produto.imgUrl))
              : produto.imgUrl
          }
          alt={produto.nome}
          sx={{
            objectFit: "contain",
            backgroundColor: "#ffffff",
            p: 1.5,
            borderRadius: 2,
          }}
        />
        {produto.galeria && produto.galeria.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              backgroundColor: "rgba(0,0,0,0.65)",
              color: "#fff",
              fontSize: "0.7rem",
              fontWeight: 600,
              px: 1,
              py: 0.3,
              borderRadius: 1,
              backdropFilter: "blur(4px)",
            }}
          >
            +{produto.galeria.length} fotos
          </Box>
        )}
      </Box>

      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: 2,
          pt: 1,
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
          {sobConsulta ? "Sob Consulta" : `R$ ${produto.preco.toFixed(2)}`}
        </Typography>

        {/* Parcelamento */}
        {!sobConsulta && (
        <Typography
          variant="caption"
          sx={{ color: "#666", mb: 2, fontSize: "0.8rem" }}
        >
          ou {parcelas}x de R$ {valorParcela.toFixed(2)} sem juros
        </Typography>
        )}

        {/* Botões — parar propagação pra não navegar ao clicar */}
        <Box onClick={(e) => e.stopPropagation()}>
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
            href={`https://wa.me/5544998133182?text=Olá! Tenho interesse em: ${produto.nome}${sobConsulta ? "" : ` (R$ ${produto.preco.toFixed(2)})`}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
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
        </Box>
      </CardContent>
    </Card>
  );
}
