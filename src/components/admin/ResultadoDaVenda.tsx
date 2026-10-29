"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Paid } from "@mui/icons-material";
import { calcularResultado } from "@/modules/pedidos/dominio/resultado";
import { formatBRL, formatPercent } from "@/lib/format";

/**
 * Resultado da venda no detalhe do pedido (#191).
 *
 * Mostra a mesma conta do exemplo que o cliente usou no sistema atual:
 * venda − comissão − frete do vendedor − custo − imposto − embalagem − ads.
 *
 * Quando falta custo em algum item, o resultado não é exibido: número com custo
 * zero inventaria margem de 100%.
 */

interface PedidoResultado {
  id: string;
  total: number;
  comissao?: number | null;
  comissaoPercent?: number | null;
  freteVendedor?: number | null;
  imposto?: number | null;
  impostoPercent?: number | null;
  embalagem?: number | null;
  ads?: number | null;
  resultado?: number | null;
  margemPercent?: number | null;
  custosOrigem?: string;
  itens?: { nome: string; quantidade: number; custoUnitario?: number | null }[];
}

export default function ResultadoDaVenda({
  pedido,
  onAtualizado,
}: {
  pedido: PedidoResultado;
  onAtualizado?: () => void | Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    comissao: String(pedido.comissao ?? 0),
    freteVendedor: String(pedido.freteVendedor ?? 0),
    imposto: String(pedido.imposto ?? 0),
    embalagem: String(pedido.embalagem ?? 0),
    ads: String(pedido.ads ?? 0),
  });

  const itens = pedido.itens ?? [];
  const semCusto = itens.filter((i) => i.custoUnitario === null || i.custoUnitario === undefined).length;
  const custoItens = itens.reduce((soma, i) => soma + (i.custoUnitario ?? 0) * i.quantidade, 0);

  const conta = calcularResultado({
    receita: pedido.total,
    custoItens,
    comissao: pedido.comissao ?? 0,
    freteVendedor: pedido.freteVendedor ?? 0,
    imposto: pedido.imposto ?? 0,
    embalagem: pedido.embalagem ?? 0,
    ads: pedido.ads ?? 0,
  });

  const linhas = [
    { label: "Valor da venda", valor: pedido.total, negativo: false },
    {
      label: `Comissão${pedido.comissaoPercent ? ` (${pedido.comissaoPercent}%)` : ""}`,
      valor: pedido.comissao ?? 0,
      negativo: true,
    },
    { label: "Frete pago por você", valor: pedido.freteVendedor ?? 0, negativo: true },
    { label: "Custo das peças", valor: custoItens, negativo: true },
    {
      label: `Imposto${pedido.impostoPercent ? ` (${pedido.impostoPercent}%)` : ""}`,
      valor: pedido.imposto ?? 0,
      negativo: true,
    },
    { label: "Embalagem", valor: pedido.embalagem ?? 0, negativo: true },
    { label: "Publicidade atribuída", valor: pedido.ads ?? 0, negativo: true },
  ];

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pedido.id, custos: form }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível salvar");
      setAberto(false);
      await onAtualizado?.();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Paid sx={{ fontSize: 18, color: "#BF360C" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Resultado da venda
          </Typography>
        </Box>
        <Button size="small" onClick={() => setAberto(true)} sx={{ textTransform: "none", color: "#BF360C", fontWeight: 700 }}>
          Editar custos
        </Button>
      </Box>

      <Typography sx={{ fontSize: "0.75rem", color: "#666", mb: 2 }}>
        {pedido.custosOrigem === "importado"
          ? "Comissão e frete vieram do pedido do marketplace."
          : pedido.custosOrigem === "calculado"
            ? "Comissão, imposto e embalagem calculados pela configuração de Custos e mídia."
            : "Custos informados manualmente."}
      </Typography>

      {semCusto > 0 ? (
        <Alert severity="warning">
          {semCusto} {semCusto === 1 ? "item está" : "itens estão"} sem custo de peça. O resultado fica
          pendente até o custo ser informado — aqui ou no cadastro do produto.
        </Alert>
      ) : (
        <>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, maxWidth: 520 }}>
            {linhas.map((l) => (
              <Box key={l.label} sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <Box component="span" sx={{ color: "#444" }}>{l.label}</Box>
                <Box component="span" sx={{ fontWeight: 600, color: l.negativo ? "#8a3b12" : "#333" }}>
                  {l.negativo && l.valor > 0 ? "− " : ""}
                  {formatBRL(l.valor)}
                </Box>
              </Box>
            ))}
            <Divider sx={{ my: 0.5 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontWeight: 700 }}>Resultado</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  sx={{ fontWeight: 700, fontSize: "1.05rem", color: conta.prejuizo ? "#b3261e" : "#0E7A3F" }}
                >
                  {formatBRL(conta.resultado)}
                </Typography>
                <Chip
                  size="small"
                  label={formatPercent(conta.margemPercent)}
                  sx={{
                    height: 20,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    backgroundColor: conta.prejuizo ? "#fdecea" : "#E8F5EC",
                    color: conta.prejuizo ? "#b3261e" : "#0E7A3F",
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#666" }}>
              <Box component="span">Margem de contribuição (antes do ads)</Box>
              <Box component="span">
                {formatBRL(conta.margemContribuicao)} · {formatPercent(conta.mcPercent)}
              </Box>
            </Box>
          </Box>
        </>
      )}

      <Dialog open={aberto} onClose={() => setAberto(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Custos desta venda</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
            Corrigir aqui não mexe no cadastro do produto nem em outra venda.
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              size="small" label="Comissão (R$)" type="number" value={form.comissao}
              onChange={(e) => setForm({ ...form, comissao: e.target.value })}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
            <TextField
              size="small" label="Frete do vendedor (R$)" type="number" value={form.freteVendedor}
              onChange={(e) => setForm({ ...form, freteVendedor: e.target.value })}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
            <TextField
              size="small" label="Imposto (R$)" type="number" value={form.imposto}
              onChange={(e) => setForm({ ...form, imposto: e.target.value })}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
            <TextField
              size="small" label="Embalagem (R$)" type="number" value={form.embalagem}
              onChange={(e) => setForm({ ...form, embalagem: e.target.value })}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
            <TextField
              size="small" label="Ads (R$)" type="number" value={form.ads}
              onChange={(e) => setForm({ ...form, ads: e.target.value })}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
          </Box>
          {erro && <Alert severity="error" sx={{ mt: 2 }}>{erro}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAberto(false)} sx={{ textTransform: "none" }}>Cancelar</Button>
          <Button
            variant="contained" onClick={salvar} disabled={salvando}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
          >
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
