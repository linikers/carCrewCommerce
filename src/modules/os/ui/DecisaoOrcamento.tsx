"use client";

import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";

/** Botões de aprovar/recusar do orçamento público (#os). */
export default function DecisaoOrcamento({ token, jaRespondido }: { token: string; jaRespondido: boolean }) {
  const [enviando, setEnviando] = useState<"aprovar" | "recusar" | null>(null);
  const [resposta, setResposta] = useState("");
  const [erro, setErro] = useState("");

  if (jaRespondido && !resposta) {
    return (
      <Alert severity="success" sx={{ mt: 3 }}>
        Orçamento já respondido. Qualquer dúvida, chame a oficina no WhatsApp.
      </Alert>
    );
  }

  if (resposta) {
    return (
      <Alert severity="success" sx={{ mt: 3 }}>
        {resposta}
      </Alert>
    );
  }

  async function decidir(decisao: "aprovar" | "recusar") {
    setEnviando(decisao);
    setErro("");
    try {
      const res = await fetch(`/api/orcamento/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisao }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível registrar");
      setResposta(d.mensagem);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={() => decidir("aprovar")}
          disabled={enviando !== null}
          sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700, px: 3 }}
        >
          {enviando === "aprovar" ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Aprovar orçamento"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => decidir("recusar")}
          disabled={enviando !== null}
          sx={{ textTransform: "none", borderColor: "#bbb", color: "#555" }}
        >
          {enviando === "recusar" ? "Enviando…" : "Não vou fazer agora"}
        </Button>
      </Box>

      <Typography sx={{ fontSize: "0.72rem", color: "#888", mt: 2 }}>
        Ao aprovar, a oficina é avisada e entra em contato para agendar o serviço.
      </Typography>
    </Box>
  );
}
