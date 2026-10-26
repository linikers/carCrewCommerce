"use client";

import { useEffect, useState } from "react";
import { Box, Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import CapturaLead from "./CapturaLead";

/**
 * Convite para a lista (7.1).
 *
 * Regras para não virar praga:
 * - 30 segundos na página (a pessoa já mostrou interesse)
 * - **uma vez por sessão** (`sessionStorage`)
 * - não aparece em /checkout nem em /pedido — quem está comprando não é
 *   interrompido
 * - não promete desconto: não existe cupom automático, e prometer o que não
 *   entrega é o mesmo erro do "12x sem juros"
 */
export default function PopupLead() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const caminho = window.location.pathname;
    if (caminho.startsWith("/checkout") || caminho.startsWith("/pedido")) return;

    try {
      if (sessionStorage.getItem("lead_popup_visto") || sessionStorage.getItem("lead_capturado")) {
        return;
      }
    } catch {
      return;
    }

    const timer = setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem("lead_popup_visto", "1");
      } catch {
        /* ignora */
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, p: 0.5 } } }}
    >
      <DialogContent sx={{ position: "relative" }}>
        <IconButton
          onClick={() => setOpen(false)}
          aria-label="Fechar"
          sx={{ position: "absolute", top: 4, right: 4, color: "#999" }}
        >
          <Close fontSize="small" />
        </IconButton>

        <Box sx={{ pr: 2, pt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1A1A", mb: 0.5 }}>
            Peça nova, aviso primeiro
          </Typography>
          <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
            Deixe seu e-mail e a gente avisa quando chegar lançamento e promoção de suspensão.
          </Typography>
          <Box sx={{ color: "#555" }}>
            <CapturaLead origem="popup" compacto onSalvo={() => setTimeout(() => setOpen(false), 2200)} />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
