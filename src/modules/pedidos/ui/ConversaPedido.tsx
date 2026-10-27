"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Send, WhatsApp, Email, StickyNote2 } from "@mui/icons-material";
import { CANAL_LABEL, modelosPorStatus, type CanalMensagem } from "@/modules/pedidos/dominio/mensagem";

interface Mensagem {
  id: string;
  canal: string;
  texto: string;
  enviado: boolean;
  criadoEm: string;
  autor: string | null;
}

interface Props {
  pedidoId: string;
  clienteNome: string | null;
  status: string;
}

/**
 * 6.5: conversa com o cliente sem sair do pedido.
 *
 * Hoje registra e abre WhatsApp/e-mail com o texto pronto (envio automático é
 * configuração posterior). O histórico fica no pedido — antes ficava na cabeça
 * de quem atendeu.
 */
export default function ConversaPedido({ pedidoId, clienteNome, status }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [canal, setCanal] = useState<CanalMensagem>("whatsapp");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const modelos = modelosPorStatus({
    clienteNome,
    clienteTelefone: null,
    clienteEmail: null,
    status,
  });

  const carregar = async () => {
    const res = await fetch(`/api/admin/pedidos/${pedidoId}/mensagens`);
    if (res.ok) setMensagens(await res.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  const enviar = async () => {
    setEnviando(true);
    setErro("");
    setAviso("");
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal, texto }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao registrar");

      setTexto("");
      await carregar();

      if (d.aviso) setAviso(d.aviso);

      if (d.link) {
        window.open(d.link, "_blank", "noopener,noreferrer");
        // marca como enviada depois que o app abriu
        await fetch(`/api/admin/pedidos/${pedidoId}/mensagens`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mensagemId: d.mensagem.id }),
        });
        await carregar();
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao registrar");
    } finally {
      setEnviando(false);
    }
  };

  const icone = (c: string) =>
    c === "whatsapp" ? <WhatsApp sx={{ fontSize: 14 }} /> : c === "email" ? <Email sx={{ fontSize: 14 }} /> : <StickyNote2 sx={{ fontSize: 14 }} />;

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: "#1A1A1A" }}>
        Falar com o cliente
      </Typography>
      <Typography sx={{ fontSize: "0.78rem", color: "#777", mb: 2 }}>
        A mensagem fica registrada no pedido. O envio abre o WhatsApp ou o e-mail com o texto
        pronto — envio automático entra quando você configurar o canal.
      </Typography>

      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>{erro}</Alert>}
      {aviso && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setAviso("")}>{aviso}</Alert>}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
        {modelos.map((m) => (
          <Chip
            key={m.rotulo}
            label={m.rotulo}
            size="small"
            variant="outlined"
            onClick={() => setTexto(m.texto)}
            sx={{ fontSize: "0.72rem", cursor: "pointer" }}
          />
        ))}
      </Box>

      <TextField
        select
        size="small"
        label="Canal"
        value={canal}
        onChange={(e) => setCanal(e.target.value as CanalMensagem)}
        sx={{ width: 180, mb: 1.5 }}
      >
        <MenuItem value="whatsapp">WhatsApp</MenuItem>
        <MenuItem value="email">E-mail</MenuItem>
        <MenuItem value="interno">Nota interna</MenuItem>
      </TextField>

      <TextField
        fullWidth
        multiline
        rows={3}
        size="small"
        label="Mensagem"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escreva ou escolha um modelo acima"
        helperText={`${texto.length}/2000`}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={enviar}
          disabled={enviando || !texto.trim()}
          sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
        >
          {enviando ? "Registrando…" : canal === "interno" ? "Registrar nota" : "Registrar e abrir"}
        </Button>
      </Box>

      {mensagens.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ fontSize: "0.72rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
            Histórico ({mensagens.length})
          </Typography>
          {mensagens.map((m) => (
            <Box
              key={m.id}
              sx={{
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                backgroundColor: m.canal === "interno" ? "#fafafa" : "#fff8f5",
                border: "1px solid #f0e6e2",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Chip
                  size="small"
                  icon={icone(m.canal)}
                  label={CANAL_LABEL[m.canal as CanalMensagem] ?? m.canal}
                  sx={{ height: 20, fontSize: "0.62rem" }}
                  variant="outlined"
                />
                {!m.enviado && m.canal !== "interno" && (
                  <Chip size="small" label="não enviada" sx={{ height: 20, fontSize: "0.62rem" }} color="warning" variant="outlined" />
                )}
                <Typography sx={{ fontSize: "0.68rem", color: "#999", ml: "auto" }}>
                  {new Date(m.criadoEm).toLocaleString("pt-BR")} · {m.autor || "admin"}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.82rem", color: "#333", whiteSpace: "pre-wrap" }}>
                {m.texto}
              </Typography>
            </Box>
          ))}
        </>
      )}
    </Paper>
  );
}
