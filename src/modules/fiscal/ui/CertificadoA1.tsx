"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Lock, UploadFile, DeleteOutlined, VerifiedUser } from "@mui/icons-material";

/**
 * Certificado A1: upload do .pfx + senha.
 *
 * O backend lê o arquivo na hora (senha errada é recusada ali) e guarda tudo
 * cifrado. Aqui a tela só mostra o que o servidor devolveu.
 */

interface Certificado {
  nomeArquivo: string;
  titular: string | null;
  cnpj: string | null;
  emissor?: string | null;
  validoAte: string | null;
  atualizadoEm?: string;
  diasParaVencer?: number | null;
}

export default function CertificadoA1({ onMudou }: { onMudou?: () => void }) {
  const [cert, setCert] = useState<Certificado | null>(null);
  const [senha, setSenha] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = async () => {
    const res = await fetch("/api/admin/fiscal/certificado");
    if (res.ok) {
      const d = await res.json();
      setCert(d.certificado);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, []);

  const enviar = async () => {
    if (!arquivo || !senha) return;
    setEnviando(true);
    setErro("");
    setOk("");
    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      form.append("senha", senha);

      const res = await fetch("/api/admin/fiscal/certificado", {
        method: "POST",
        body: form,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao enviar");

      setCert(d.certificado);
      setSenha("");
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
      setOk("Certificado salvo e cifrado.");
      onMudou?.();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setEnviando(false);
    }
  };

  const remover = async () => {
    if (!confirm("Remover o certificado? Sem ele não é possível emitir nota.")) return;
    const res = await fetch("/api/admin/fiscal/certificado", { method: "DELETE" });
    if (res.ok) {
      setCert(null);
      setOk("Certificado removido.");
      onMudou?.();
    }
  };

  const dias = cert?.diasParaVencer ?? null;
  const vencido = dias !== null && dias < 0;
  const vencendo = dias !== null && dias >= 0 && dias <= 30;

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Certificado A1</Typography>
      <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
        É o que assina a nota. O arquivo e a senha ficam cifrados no banco —
        nada de .pfx solto no servidor.
      </Typography>

      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>{erro}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk("")}>{ok}</Alert>}

      {cert ? (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
            <VerifiedUser sx={{ color: vencido ? "#b3261e" : vencendo ? "#B26A00" : "#0E7A3F", fontSize: 20 }} />
            <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>{cert.nomeArquivo}</Typography>
            <Chip
              size="small"
              label={
                vencido
                  ? "vencido"
                  : dias !== null
                    ? `${dias} dia(s) para vencer`
                    : "válido"
              }
              color={vencido ? "error" : vencendo ? "warning" : "success"}
              variant="outlined"
            />
          </Box>
          <Typography sx={{ fontSize: "0.78rem", color: "#555" }}>
            {cert.titular || "titular não identificado"}
            {cert.cnpj ? ` · CNPJ ${cert.cnpj}` : ""}
            {cert.validoAte
              ? ` · válido até ${new Date(cert.validoAte).toLocaleDateString("pt-BR")}`
              : ""}
          </Typography>
          <Button
            size="small"
            startIcon={<DeleteOutlined />}
            onClick={remover}
            sx={{ mt: 1, textTransform: "none", color: "#b3261e" }}
          >
            Remover certificado
          </Button>
        </Box>
      ) : (
        <Typography sx={{ fontSize: "0.8rem", color: "#8a5200", mb: 2 }}>
          Nenhum certificado cadastrado — a emissão de nota fica bloqueada até enviar.
        </Typography>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr auto" }, gap: 2, alignItems: "start" }}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadFile />}
          sx={{ textTransform: "none", height: 40, borderColor: "#ddd", color: "#444" }}
        >
          {arquivo ? arquivo.name : "Escolher .pfx / .p12"}
          <input
            ref={inputRef}
            type="file"
            accept=".pfx,.p12,application/x-pkcs12"
            hidden
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
        </Button>

        <TextField
          size="small"
          type="password"
          label="Senha do certificado"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          helperText="Só para abrir o arquivo — fica cifrada"
        />

        <Button
          variant="contained"
          onClick={enviar}
          disabled={enviando || !arquivo || !senha}
          sx={{ height: 40, backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
        >
          {enviando ? "Enviando…" : "Salvar certificado"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.5 }}>
        <Lock sx={{ fontSize: 14, color: "#999" }} />
        <Typography sx={{ fontSize: "0.7rem", color: "#999" }}>
          AES-256-GCM com a chave de CONFIG_SECRET_KEY. Trocar essa chave exige reenviar o certificado.
        </Typography>
      </Box>
    </Paper>
  );
}
