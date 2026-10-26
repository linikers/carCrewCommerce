"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  CircularProgress,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

interface Resultados {
  produtos: { id: number; nome: string; sku: string | null; preco: number; estoque: number }[];
  pedidos: { id: number; clienteNome: string | null; total: number; status: string }[];
  clientes: { id: string; name: string | null; email: string }[];
}

const VAZIO: Resultados = { produtos: [], pedidos: [], clientes: [] };

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Campo de busca único do painel: produto (nome ou SKU), pedido (número ou
 * cliente) e cliente (nome, e-mail). Um lugar só, sem precisar saber em qual
 * tela o dado mora.
 */
export default function BuscaGlobal({ autoFoco = false }: { autoFoco?: boolean }) {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [dados, setDados] = useState<Resultados>(VAZIO);
  const [carregando, setCarregando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = termo.trim();
    if (q.length < 2) {
      setDados(VAZIO);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/busca?q=${encodeURIComponent(q)}`);
        if (res.ok) setDados(await res.json());
      } catch {
        // silencioso: a busca não pode atrapalhar o painel
      } finally {
        setCarregando(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [termo]);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const ir = (url: string) => {
    setAberto(false);
    setTermo("");
    router.push(url);
  };

  const total = dados.produtos.length + dados.pedidos.length + dados.clientes.length;
  const mostrarPainel = aberto && termo.trim().length >= 2;

  return (
    <Box ref={caixaRef} sx={{ position: "relative", width: "100%", maxWidth: 360 }}>
      <TextField
        size="small"
        fullWidth
        autoFocus={autoFoco}
        placeholder="Buscar peça, SKU, pedido ou cliente…"
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAberto(false);
          if (e.key === "Enter" && dados.produtos.length > 0) ir(`/admin/produtos?q=${encodeURIComponent(termo)}`);
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "#999" }} />
              </InputAdornment>
            ),
            endAdornment: carregando ? (
              <InputAdornment position="end">
                <CircularProgress size={14} />
              </InputAdornment>
            ) : null,
            sx: { backgroundColor: "#fff", fontSize: "0.875rem" },
          },
        }}
      />

      {mostrarPainel && (
        <Paper
          elevation={6}
          sx={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: 420,
            overflowY: "auto",
            borderRadius: 2,
            border: "1px solid #eee",
          }}
        >
          {!carregando && total === 0 && (
            <Typography sx={{ p: 2, fontSize: "0.8125rem", color: "#666" }}>
              Nada encontrado para “{termo.trim()}”.
            </Typography>
          )}

          {dados.produtos.length > 0 && (
            <>
              <Titulo>Peças</Titulo>
              {dados.produtos.map((p) => (
                <Linha key={p.id} onClick={() => ir(`/admin/produtos/${p.id}/edit`)}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      {p.nome}
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: "#888", fontFamily: "monospace" }}>
                      {p.sku || "sem SKU"} · estoque {p.estoque}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.75rem", color: "#BF360C", fontWeight: 700, whiteSpace: "nowrap", ml: 1 }}>
                    {p.preco > 0 ? brl(p.preco) : "sob consulta"}
                  </Typography>
                </Linha>
              ))}
            </>
          )}

          {dados.pedidos.length > 0 && (
            <>
              <Titulo>Pedidos</Titulo>
              {dados.pedidos.map((p) => (
                <Linha key={p.id} onClick={() => ir(`/admin/pedidos?q=${p.id}`)}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      #{p.id} · {p.clienteNome || "sem nome"}
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: "#888" }}>
                      {p.status.toLowerCase()}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.75rem", color: "#BF360C", fontWeight: 700, whiteSpace: "nowrap", ml: 1 }}>
                    {brl(p.total)}
                  </Typography>
                </Linha>
              ))}
            </>
          )}

          {dados.clientes.length > 0 && (
            <>
              <Titulo>Clientes</Titulo>
              {dados.clientes.map((c) => (
                <Linha key={c.id} onClick={() => ir(`/admin/clientes?q=${encodeURIComponent(c.email)}`)}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      {c.name || "sem nome"}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: "0.7rem", color: "#888" }}>
                      {c.email}
                    </Typography>
                  </Box>
                </Linha>
              ))}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        px: 2,
        pt: 1.25,
        pb: 0.5,
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "#999",
        backgroundColor: "#fafafa",
      }}
    >
      {children}
    </Typography>
  );
}

function Linha({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1,
        cursor: "pointer",
        borderBottom: "1px solid #f5f5f5",
        "&:last-of-type": { borderBottom: 0 },
        "&:hover": { backgroundColor: "#fff8f5" },
      }}
    >
      {children}
    </Box>
  );
}
