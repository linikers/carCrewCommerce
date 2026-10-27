"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { formatBRL } from "@/lib/format";

interface Exemplo {
  nome: string;
  base: number;
  site: number;
}

interface Politica {
  sitePercent: number;
  canais: Record<string, number>;
}

/**
 * Política de preço por canal (#preco).
 *
 * O preço que o cliente vê no site é o preço base menos o percentual do site.
 * As plataformas usam o percentual delas (ou a exceção do item).
 */
export default function PrecosAdmin() {
  const [politica, setPolitica] = useState<Politica>({
    sitePercent: 0,
    canais: { mercado_livre: 0, shopee: 0 },
  });
  const [exemplo, setExemplo] = useState<Exemplo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/admin/precos");
      const d = await res.json();
      if (d?.politica) setPolitica(d.politica);
      setExemplo(d?.exemplo ?? []);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function salvar() {
    setSalvando(true);
    setAviso("");
    try {
      const res = await fetch("/api/admin/precos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(politica),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      setAviso("Política salva. Os preços da vitrine já usam os novos percentuais.");
      await carregar();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 880 }}>
      <Alert severity="info" sx={{ mb: 3, fontSize: "0.82rem" }}>
        O <strong>preço base</strong> é o valor de referência (o praticado no marketplace). O site
        vende com o desconto configurado abaixo; cada plataforma usa o percentual dela. Nada
        configurado = preço base, sem desconto. Pedido já feito não muda — o preço pago fica
        gravado no item.
      </Alert>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography sx={{ fontWeight: 700, mb: 2 }}>Site</Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
          <TextField
            size="small"
            type="number"
            label="Desconto do site (%)"
            value={politica.sitePercent}
            onChange={(e) =>
              setPolitica({ ...politica, sitePercent: Number(e.target.value) })
            }
            slotProps={{ htmlInput: { min: 0, max: 90, step: 0.5 } }}
            helperText="Ex.: 5 deixa o site 5% abaixo do preço base"
            sx={{ width: 220 }}
          />
          <Box sx={{ pt: 1 }}>
            <Typography sx={{ fontSize: "0.78rem", color: "#666" }}>
              Peça de {formatBRL(100)} passa a{" "}
              <strong>{formatBRL(100 * (1 - politica.sitePercent / 100))}</strong> no site.
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Plataformas</Typography>
        <Typography sx={{ fontSize: "0.78rem", color: "#666", mb: 2 }}>
          Percentual sobre o preço base em cada canal. Serve para igualar o preço depois da comissão
          da plataforma.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            size="small"
            type="number"
            label="Mercado Livre (%)"
            value={politica.canais?.mercado_livre ?? 0}
            onChange={(e) =>
              setPolitica({
                ...politica,
                canais: { ...politica.canais, mercado_livre: Number(e.target.value) },
              })
            }
            slotProps={{ htmlInput: { min: 0, max: 90, step: 0.5 } }}
            sx={{ width: 200 }}
          />
          <TextField
            size="small"
            type="number"
            label="Shopee (%)"
            value={politica.canais?.shopee ?? 0}
            onChange={(e) =>
              setPolitica({
                ...politica,
                canais: { ...politica.canais, shopee: Number(e.target.value) },
              })
            }
            slotProps={{ htmlInput: { min: 0, max: 90, step: 0.5 } }}
            sx={{ width: 200 }}
          />
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Typography sx={{ fontWeight: 700 }}>Como o preço aparece</Typography>
          <Chip size="small" label="comparativo em breve" sx={{ height: 18, fontSize: "0.6rem" }} />
        </Box>
        <TextField
          select
          size="small"
          value="seco"
          disabled
          sx={{ width: 260, mt: 1 }}
          helperText="Só o preço do site. Comparar com o marketplace fica para depois de ter venda no site."
        >
          <MenuItem value="seco">Preço seco (só o valor do site)</MenuItem>
        </TextField>
      </Paper>

      {exemplo.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Prévia com produtos reais</Typography>
          <Box component="table" sx={{ width: "100%", fontSize: "0.82rem" }}>
            <Box component="thead">
              <Box component="tr" sx={{ color: "#777" }}>
                <Box component="th" sx={{ textAlign: "left", pb: 1 }}>Produto</Box>
                <Box component="th" sx={{ textAlign: "right", pb: 1 }}>Base</Box>
                <Box component="th" sx={{ textAlign: "right", pb: 1 }}>Site</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {exemplo.map((e) => (
                <Box component="tr" key={e.nome}>
                  <Box component="td" sx={{ py: 0.5, pr: 2 }}>{e.nome.slice(0, 60)}</Box>
                  <Box component="td" sx={{ textAlign: "right", color: "#888" }}>{formatBRL(e.base)}</Box>
                  <Box component="td" sx={{ textAlign: "right", fontWeight: 700, color: "#BF360C" }}>
                    {formatBRL(e.site)}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      )}

      {aviso && (
        <Alert severity="success" sx={{ mb: 2, fontSize: "0.8rem" }}>{aviso}</Alert>
      )}

      <Button
        variant="contained"
        startIcon={<Save />}
        onClick={salvar}
        disabled={salvando}
        sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
      >
        {salvando ? "Salvando…" : "Salvar política"}
      </Button>
    </Box>
  );
}
