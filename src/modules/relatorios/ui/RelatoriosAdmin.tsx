"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { formatBRL, formatPercent } from "@/lib/format";

/** valor com sinal na frente do R$: − R$ 225,91 (e não -R$ 225,91) */
function brl(valor: number): string {
  return valor < 0 ? `− ${formatBRL(Math.abs(valor))}` : formatBRL(valor);
}

/**
 * Relatórios — resultado do período (#191, PR-5).
 *
 * O que esta tela NÃO faz: esconder dado faltando. Venda sem custo não entra no
 * resultado e aparece contada; SKU sem custo não entra na lista de margem.
 */

interface Relatorio {
  total: { pedidos: number; receita: number; custos: number; resultado: number; margemPercent: number; mcPercent: number };
  porCanal: {
    canal: string; rotulo: string; pedidos: number; receita: number;
    custos: number; resultado: number; margemPercent: number; semCusto: number;
  }[];
  topSkus: { sku: string | null; nome: string; unidades: number; receita: number; custo: number; margemBruta: number; margemPercent: number }[];
  pioresSkus: { sku: string | null; nome: string; unidades: number; receita: number; custo: number; margemBruta: number; margemPercent: number }[];
  qualidade: { semCusto: number; semComissao: number; aReceber: number; cancelados: number };
  incompleto: boolean;
}

const CANAIS = [
  { id: "", rotulo: "Todos os canais" },
  { id: "mercado_livre", rotulo: "Mercado Livre" },
  { id: "shopee", rotulo: "Shopee" },
  { id: "site", rotulo: "Site" },
  { id: "manual", rotulo: "Manual / balcão" },
];

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function inicioDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function RelatoriosAdmin() {
  const router = useRouter();
  const [de, setDe] = useState(inicioDoMes());
  const [ate, setAte] = useState(hoje());
  const [canal, setCanal] = useState("");
  const [dados, setDados] = useState<Relatorio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const q = new URLSearchParams({ de, ate });
      if (canal) q.set("canal", canal);
      const res = await fetch(`/api/admin/relatorios/resultado?${q.toString()}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível carregar");
      setDados(d);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, [de, ate, canal]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  const cards = dados
    ? [
        { label: "Receita", valor: formatBRL(dados.total.receita), cor: "#333" },
        { label: "Custos", valor: formatBRL(dados.total.custos), cor: "#8a3b12" },
        {
          label: "Resultado",
          valor: formatBRL(dados.total.resultado),
          cor: dados.total.resultado < 0 ? "#b3261e" : "#0E7A3F",
        },
        {
          label: "Margem",
          valor: formatPercent(dados.total.margemPercent),
          cor: dados.total.resultado < 0 ? "#b3261e" : "#0E7A3F",
        },
      ]
    : [];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 2.5 }}>
          <TextField fullWidth size="small" label="De" type="date" value={de}
            slotProps={{ inputLabel: { shrink: true } }} onChange={(e) => setDe(e.target.value)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 2.5 }}>
          <TextField fullWidth size="small" label="Até" type="date" value={ate}
            slotProps={{ inputLabel: { shrink: true } }} onChange={(e) => setAte(e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField select fullWidth size="small" label="Canal" value={canal}
            onChange={(e) => setCanal(e.target.value)}>
            {CANAIS.map((c) => <MenuItem key={c.id || "todos"} value={c.id}>{c.rotulo}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <Button fullWidth variant="contained" onClick={carregar}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700, height: 40 }}>
            Atualizar
          </Button>
        </Grid>
      </Grid>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {carregando ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#BF360C" }} />
        </Box>
      ) : !dados || dados.total.pedidos === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Nenhuma venda no período</Typography>
          <Typography sx={{ color: "#666", fontSize: "0.85rem", mt: 1, mb: 2 }}>
            O relatório nasce do que está em Pedidos. Lance uma venda ou importe a planilha do
            sistema atual para ele começar a ter número.
          </Typography>
          <Button variant="contained" onClick={() => router.push("/admin/pedidos")}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}>
            Ir para Pedidos
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {cards.map((c) => (
              <Grid key={c.label} size={{ xs: 6, sm: 3 }}>
                <Paper sx={{ p: 2, borderRadius: 3 }}>
                  <Typography sx={{ fontSize: "0.72rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {c.label}
                  </Typography>
                  <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, color: c.cor, mt: 0.5 }}>
                    {c.valor}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {dados.incompleto && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {dados.qualidade.semCusto} venda(s) com item sem custo ficaram <strong>fora</strong> do
              resultado — o total acima é só das vendas completas. Informe o custo da peça para elas
              entrarem.
            </Alert>
          )}

          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Resultado por canal</Typography>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: { xs: 300, sm: 560 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Canal</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Vendas</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Receita</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Custos</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Resultado</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Margem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dados.porCanal.map((c) => (
                    <TableRow key={c.canal}>
                      <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>{c.rotulo}</TableCell>
                      <TableCell align="right">{c.pedidos}</TableCell>
                      <TableCell align="right">{brl(c.receita)}</TableCell>
                      <TableCell align="right" sx={{ color: "#8a3b12" }}>{brl(c.custos)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: c.resultado < 0 ? "#b3261e" : "#0E7A3F" }}>
                        {brl(c.resultado)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={formatPercent(c.margemPercent)}
                          sx={{
                            height: 20, fontSize: "0.65rem", fontWeight: 700,
                            backgroundColor: c.resultado < 0 ? "#fdecea" : "#E8F5EC",
                            color: c.resultado < 0 ? "#b3261e" : "#0E7A3F",
                          }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography sx={{ fontSize: "0.72rem", color: "#666", mt: 1.5 }}>
              Venda com item sem custo não entra no resultado — o número do canal é só das vendas
              completas ({dados.qualidade.semCusto} pendente(s) no total).
            </Typography>
          </Paper>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { titulo: "Melhores peças (margem bruta)", lista: dados.topSkus },
              { titulo: "Piores peças (margem bruta)", lista: dados.pioresSkus },
            ].map((bloco) => (
              <Grid key={bloco.titulo} size={{ xs: 12, lg: 6 }}>
                <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{bloco.titulo}</Typography>
                  {bloco.lista.length === 0 ? (
                    <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>
                      Sem peça com custo informado no período.
                    </Typography>
                  ) : (
                    <TableContainer sx={{ overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Peça</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Un.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Margem</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bloco.lista.map((s) => (
                            <TableRow key={`${s.sku ?? s.nome}-${bloco.titulo}`}>
                              <TableCell sx={{ maxWidth: 220, fontSize: "0.78rem" }}>
                                <Box sx={{ fontWeight: 600 }}>{s.sku ?? "—"}</Box>
                                <Box sx={{ color: "#666", fontSize: "0.7rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {s.nome}
                                </Box>
                              </TableCell>
                              <TableCell align="right">{s.unidades}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: s.margemBruta < 0 ? "#b3261e" : "#0E7A3F" }}>
                                {brl(s.margemBruta)}
                                <Box component="span" sx={{ display: "block", fontSize: "0.65rem", color: "#666", fontWeight: 500 }}>
                                  {formatPercent(s.margemPercent)}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Qualidade do dado</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={`${dados.qualidade.semCusto} venda(s) sem custo de peça`}
                color={dados.qualidade.semCusto > 0 ? "warning" : "default"} variant="outlined" />
              <Chip label={`${dados.qualidade.semComissao} venda(s) sem comissão`}
                color={dados.qualidade.semComissao > 0 ? "warning" : "default"} variant="outlined" />
              <Chip label={`${dados.qualidade.aReceber} aguardando pagamento`} variant="outlined" />
              <Chip label={`${dados.qualidade.cancelados} cancelada(s)`} variant="outlined" />
            </Box>
            <Typography sx={{ fontSize: "0.72rem", color: "#666", mt: 1.5 }}>
              Margem de contribuição do período (antes do ads): {formatPercent(dados.total.mcPercent)}.
              Custos incluem comissão, frete do vendedor, custo da peça, imposto, embalagem e ads.
            </Typography>
          </Paper>
        </>
      )}
    </Box>
  );
}
