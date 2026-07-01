"use client";

import { useRef, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  Star,
  StarBorder,
  DragIndicator,
} from "@mui/icons-material";

interface GalleryUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  principalIndex?: number;
  onPrincipalChange?: (index: number) => void;
}

declare global {
  interface Window {
    cloudinary: any;
  }
}

export default function GalleryUpload({
  images,
  onChange,
  maxImages = 5,
  principalIndex = 0,
  onPrincipalChange,
}: GalleryUploadProps) {
  const widgetRef = useRef<any>(null);
  const [uploading, setUploading] = useState(false);

  const openWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
      return;
    }

    const CLOUD_NAME =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "drvnlgib2";
    const UPLOAD_PRESET = "carcrew";

    widgetRef.current = (window as any).cloudinary?.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        sources: ["local", "camera", "url"],
        multiple: false,
        maxFileSize: 5000000, // 5MB
        cropping: false,
        showAdvancedOptions: false,
        defaultSource: "local",
        styles: {
          palette: {
            window: "#ffffff",
            windowBorder: "#E65100",
            tabIcon: "#E65100",
            menuIcons: "#1A1A1A",
            textDark: "#1A1A1A",
            textLight: "#ffffff",
            link: "#E65100",
            action: "#E65100",
            inactiveTabIcon: "#999",
            error: "#d32f2f",
            inProgress: "#E65100",
            complete: "#2e7d32",
            sourceBg: "#f5f5f5",
          },
        },
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const url = result.info.secure_url;
          if (images.length < maxImages) {
            onChange([...images, url]);
          }
        }
        setUploading(false);
      }
    );

    setUploading(true);
    widgetRef.current?.open();
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    // Ajustar principal se necessário
    if (principalIndex >= newImages.length && newImages.length > 0) {
      onPrincipalChange?.(0);
    } else if (index < principalIndex) {
      onPrincipalChange?.(principalIndex - 1);
    }
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(from, 1);
    newImages.splice(to, 0, moved);
    onChange(newImages);
    // Ajustar principal
    if (principalIndex === from) {
      onPrincipalChange?.(to);
    } else if (from < principalIndex && to >= principalIndex) {
      onPrincipalChange?.(principalIndex - 1);
    } else if (from > principalIndex && to <= principalIndex) {
      onPrincipalChange?.(principalIndex + 1);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Galeria de Imagens ({images.length}/{maxImages})
        </Typography>
        {images.length < maxImages && (
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={openWidget}
            disabled={uploading}
            size="small"
            sx={{
              textTransform: "none",
              borderColor: "#E65100",
              color: "#E65100",
              "&:hover": { borderColor: "#BF360C", bgcolor: "rgba(230,81,0,0.04)" },
            }}
          >
            {uploading ? "Enviando..." : "Adicionar"}
          </Button>
        )}
      </Box>

      {images.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            border: "2px dashed #ddd",
            bgcolor: "#fafafa",
          }}
        >
          <CloudUpload sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
          <Typography variant="body2" sx={{ color: "#999" }}>
            Nenhuma imagem na galeria. Clique em "Adicionar" para começar.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {images.map((url, idx) => (
            <Paper
              key={idx}
              sx={{
                position: "relative",
                width: 120,
                height: 120,
                borderRadius: 2,
                overflow: "hidden",
                border: idx === principalIndex ? "3px solid #E65100" : "2px solid #eee",
                "&:hover": { boxShadow: 3 },
                transition: "all 0.2s",
              }}
            >
              <Box
                component="img"
                src={url}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* Overlay com ações */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  p: 0.5,
                  background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)",
                }}
              >
                {/* Mover */}
                <Box>
                  {idx > 0 && (
                    <Tooltip title="Mover para esquerda">
                      <IconButton
                        size="small"
                        onClick={() => moveImage(idx, idx - 1)}
                        sx={{ color: "#fff", p: 0.25 }}
                      >
                        <DragIndicator sx={{ fontSize: 16, transform: "rotate(180deg)" }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {idx < images.length - 1 && (
                    <Tooltip title="Mover para direita">
                      <IconButton
                        size="small"
                        onClick={() => moveImage(idx, idx + 1)}
                        sx={{ color: "#fff", p: 0.25 }}
                      >
                        <DragIndicator sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {/* Remover */}
                <Tooltip title="Remover">
                  <IconButton
                    size="small"
                    onClick={() => removeImage(idx)}
                    sx={{ color: "#fff", p: 0.25 }}
                  >
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Botão principal */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  p: 0.5,
                  background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)",
                }}
              >
                <Tooltip title={idx === principalIndex ? "Imagem principal" : "Definir como principal"}>
                  <IconButton
                    size="small"
                    onClick={() => onPrincipalChange?.(idx)}
                    sx={{ color: idx === principalIndex ? "#FFD700" : "#fff", p: 0.25 }}
                  >
                    {idx === principalIndex ? (
                      <Star sx={{ fontSize: 18 }} />
                    ) : (
                      <StarBorder sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Badge principal */}
              {idx === principalIndex && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    bgcolor: "#E65100",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    px: 0.5,
                    borderRadius: 1,
                  }}
                >
                  PRINCIPAL
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}

      <Typography variant="caption" sx={{ color: "#999", mt: 1, display: "block" }}>
        Máximo {maxImages} imagens. Clique na estrela para definir a principal.
      </Typography>
    </Box>
  );
}
