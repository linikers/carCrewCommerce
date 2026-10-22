"use client";

import Link from "next/link";
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
import { formatBRL } from "@/lib/format";

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
  const sobConsulta = produto.preco <= 0;

  return (
    <Link
      href={`/produto/${produto.id}`}
      style={{ textDecoration: "none", height: "100%", display: "block", color: "inherit" }}
    >
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
    >
      {/* Imagem */}
      <Box sx={{ position: "relative", aspectRatio: "1/1" }}>
        <CardMedia
          component="img"
          height="200"
          width="200"
          loading="lazy"
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
          {sobConsulta ? "Sob Consulta" : formatBRL(produto.preco)}
        </Typography>

        {/* Parcelamento */}
        {!sobConsulta && (
        <Typography
          variant="caption"
          sx={{ color: "#666", mb: 2, fontSize: "0.8rem" }}
        >
          Pagamento via PIX
        </Typography>
        )}

        {/* Botões — parar propagação pra não navegar ao clicar */}
        <Box onClick={(e) => e.stopPropagation()}>
          {sobConsulta ? (
            <>
              <Button
                fullWidth
                variant="contained"
                startIcon={<WhatsApp />}
                href={`https://wa.me/5544998133182?text=${encodeURIComponent(
                  `Olá! Quero um orçamento para: ${produto.nome}`
                )}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                sx={{
                  backgroundColor: "#BF360C",
                  "&:hover": { backgroundColor: "#8C2A09" },
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1,
                  mb: 0.5,
                }}
              >
                Solicitar orçamento no WhatsApp
              </Button>
              <Typography
                variant="caption"
                sx={{ color: "#666", display: "block", textAlign: "center", fontSize: "0.72rem" }}
              >
                Resposta em até 1h em horário comercial
              </Typography>
            </>
          ) : (
            <>
              <Button
                fullWidth
                variant="contained"
                onClick={() => onAddToCart(produto)}
                sx={{
                  backgroundColor: "#BF360C",
                  "&:hover": { backgroundColor: "#8C2A09" },
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
                href={`https://wa.me/5544998133182?text=${encodeURIComponent(
                  `Olá! Tenho interesse em: ${produto.nome} (${formatBRL(produto.preco)})`
                )}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                sx={{
                  borderColor: "#0E7A3F",
                  color: "#0E7A3F",
                  textTransform: "none",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  "&:hover": {
                    borderColor: "#0E7A3F",
                    backgroundColor: "rgba(14, 122, 63, 0.06)",
                  },
                }}
              >
                Dúvidas? Fale no WhatsApp
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
    </Link>
  );
}
