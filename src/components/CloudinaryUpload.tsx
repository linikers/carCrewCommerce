"use client";

import { useRef } from "react";
import { Button } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";

interface CloudinaryUploadProps {
  onUpload: (url: string, publicId: string) => void;
  label?: string;
}

declare global {
  interface Window {
    cloudinary: any;
    cloudinaryWidget: any;
  }
}

export default function CloudinaryUpload({
  onUpload,
  label = "Upload Imagem",
}: CloudinaryUploadProps) {
  const widgetRef = useRef<any>(null);

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
          fonts: {
            default: null,
            "'Inter', sans-serif": {
              url: "https://fonts.googleapis.com/css2?family=Inter",
              active: true,
            },
          },
        },
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const info = result.info;
          onUpload(info.secure_url, info.public_id);
        }
      }
    );

    widgetRef.current?.open();
  };

  return (
    <Button
      variant="outlined"
      startIcon={<CloudUpload />}
      onClick={openWidget}
      sx={{
        textTransform: "none",
        borderColor: "#E65100",
        color: "#E65100",
        "&:hover": { borderColor: "#BF360C", bgcolor: "rgba(230,81,0,0.04)" },
      }}
    >
      {label}
    </Button>
  );
}
