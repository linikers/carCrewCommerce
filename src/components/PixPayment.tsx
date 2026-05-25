"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  ContentCopy,
  CheckCircleOutlined,
} from "@mui/icons-material";
import { useState } from "react";

interface PixData {
  qrCode: string;
  payload: string;
  chave: string;
  amount: number;
  expiration: string;
}

interface PixPaymentProps {
  open: boolean;
  onClose: () => void;
  pixData: PixData | null;
  loading: boolean;
}

export default function PixPayment({
  open,
  onClose,
  pixData,
  loading,
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!pixData) return;
    try {
      await navigator.clipboard.writeText(pixData.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback: selecionar manualmente
      const textArea = document.createElement("textarea");
      textArea.value = pixData.payload;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 3, maxWidth: 420 },
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", position: "relative" }}>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ textAlign: "center", px: 3, pb: 4 }}>
        {loading ? (
          <Box sx={{ py: 6 }}>
            <CircularProgress sx={{ color: "#E65100", mb: 2 }} />
            <Typography variant="body1" sx={{ color: "#666" }}>
              Gerando PIX...
            </Typography>
          </Box>
        ) : pixData ? (
          <>
            {/* Ícone de sucesso */}
            <CheckCircleOutlined
              sx={{ fontSize: 56, color: "#2e7d32", mb: 2 }}
            />

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              PIX Gerado!
            </Typography>

            <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
              Escaneie o QR Code ou copie o código PIX para pagar
            </Typography>

            {/* Valor */}
            <Typography
              variant="h4"
              sx={{
                color: "#E65100",
                fontWeight: 700,
                mb: 3,
              }}
            >
              R$ {pixData.amount.toFixed(2)}
            </Typography>

            {/* QR Code */}
            <Box
              sx={{
                display: "inline-block",
                p: 2,
                backgroundColor: "#ffffff",
                borderRadius: 3,
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                mb: 3,
              }}
            >
              <Box
                component="img"
                src={pixData.qrCode}
                alt="QR Code PIX"
                sx={{ width: 250, height: 250, display: "block" }}
              />
            </Box>

            {/* Código copia-e-cola */}
            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: 2,
                p: 2,
                mb: 2,
                textAlign: "left",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#999", fontWeight: 500, mb: 1, display: "block" }}
              >
                Código PIX (copia e cola)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  wordBreak: "break-all",
                  color: "#555",
                  mb: 1,
                  maxHeight: 60,
                  overflow: "hidden",
                }}
              >
                {pixData.payload}
              </Typography>
              <Button
                fullWidth
                variant={copied ? "contained" : "outlined"}
                startIcon={copied ? <CheckCircleOutlined /> : <ContentCopy />}
                onClick={handleCopy}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  borderColor: copied ? "#2e7d32" : "#E65100",
                  color: copied ? "#fff" : "#E65100",
                  backgroundColor: copied ? "#2e7d32" : "transparent",
                  "&:hover": {
                    borderColor: copied ? "#2e7d32" : "#BF360C",
                    backgroundColor: copied ? "#2e7d32" : "rgba(230,81,0,0.04)",
                  },
                }}
              >
                {copied ? "Copiado!" : "Copiar código PIX"}
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="caption" sx={{ color: "#999" }}>
              🔒 Pagamento processado com segurança
            </Typography>
            <Typography variant="caption" sx={{ color: "#999", display: "block" }}>
              ⏱ Código válido por {pixData.expiration}
            </Typography>
          </>
        ) : (
          <Box sx={{ py: 6 }}>
            <Typography variant="body1" sx={{ color: "#999" }}>
              Erro ao gerar PIX. Tente novamente.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
