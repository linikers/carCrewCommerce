"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { formatarTelefone } from "@/lib/documento";

interface Props {
  /** Origem do lead (footer, popup, produto…). Vai para o banco. */
  origem?: string;
  /** Popup usa layout empilhado e texto curto. */
  compacto?: boolean;
  /** Chamado quando o lead é salvo (o popup usa para se fechar). */
  onSalvo?: () => void;
}

/**
 * Captura de e-mail/telefone (7.1).
 *
 * Antes não havia newsletter nem lista: quem não comprava na hora
 * desaparecia. Grava em `leads` com consentimento explícito (LGPD).
 */
export default function CapturaLead({ origem = "site", compacto = false, onSalvo }: Props) {
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aceite, setAceite] = useState(false);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "erro">("idle");
  const [mensagem, setMensagem] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (estado === "enviando") return;

    if (!aceite) {
      setEstado("erro");
      setMensagem("Marque o aceite para receber as novidades.");
      return;
    }

    setEstado("enviando");
    setMensagem("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, telefone, origem, consentimento: aceite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível salvar");

      setEstado("ok");
      setMensagem("Pronto! Você está na lista.");
      try {
        sessionStorage.setItem("lead_capturado", "1");
      } catch {
        /* modo privado sem storage: ignora */
      }
      onSalvo?.();
    } catch (err) {
      setEstado("erro");
      setMensagem(err instanceof Error ? err.message : "Não foi possível salvar");
    }
  };

  if (estado === "ok") {
    return (
      <Alert severity="success" sx={{ borderRadius: 2 }}>
        {mensagem} Avisamos assim que chegar peça nova.
      </Alert>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={enviar}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        maxWidth: compacto ? "100%" : 420,
        // texto do consentimento herda o contraste do contexto (rodapé escuro
        // ou popup claro) em vez de um cinza fixo que sumia nos dois
        "& .MuiFormControlLabel-label": { color: "inherit" },
      }}
    >
      {!compacto && (
        <Typography variant="body2" sx={{ color: "#aaa", mb: 0.5 }}>
          Receba lançamentos e ofertas antes de todo mundo.
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1, flexDirection: compacto ? "column" : { xs: "column", sm: "row" } }}>
        <TextField
          size="small"
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          slotProps={{ htmlInput: { "aria-label": "Seu e-mail" } }}
          sx={{ flex: 1, backgroundColor: "#fff", borderRadius: 1 }}
        />
        <TextField
          size="small"
          placeholder="WhatsApp (opcional)"
          value={telefone}
          onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
          slotProps={{ htmlInput: { "aria-label": "WhatsApp (opcional)", inputMode: "tel" } }}
          sx={{ flex: 1, backgroundColor: "#fff", borderRadius: 1 }}
        />
      </Box>

      <Button
        type="submit"
        variant="contained"
        disabled={estado === "enviando"}
        sx={{
          textTransform: "none",
          fontWeight: 700,
          backgroundColor: "#BF360C",
          "&:hover": { backgroundColor: "#8C2A09" },
          alignSelf: compacto ? "stretch" : { xs: "stretch", sm: "flex-start" },
          px: 3,
        }}
      >
        {estado === "enviando" ? "Salvando…" : "Quero receber"}
      </Button>

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={aceite}
            onChange={(e) => setAceite(e.target.checked)}
            sx={{ color: "#888", "&.Mui-checked": { color: "#BF360C" }, py: 0.25 }}
          />
        }
        label={
          <Typography variant="caption" sx={{ color: "inherit", fontSize: "0.78rem", lineHeight: 1.4 }}>
            Aceito receber novidades por e-mail. Posso sair quando quiser.
          </Typography>
        }
        sx={{ mr: 0, alignItems: "flex-start" }}
      />

      {estado === "erro" && mensagem && (
        <Typography variant="caption" sx={{ color: "#ff8a65" }}>
          {mensagem}
        </Typography>
      )}
    </Box>
  );
}
