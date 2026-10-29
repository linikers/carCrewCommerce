"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { calcularResultado, comissaoDe, impostoDe, type CanalVenda } from "@/modules/pedidos/dominio/resultado";
import { formatBRL, formatPercent } from "@/lib/format";

/**
 * Custos e mídia (#191) — onde o cliente cadastra o que a plataforma cobra.
 *
 * A prévia usa `calcularResultado`, a mesma função do pedido e do relatório: se
 * a tela mostrasse uma conta própria, ela e o relatório discordariam no
 * centavo e ninguém saberia qual está certo.
 */

interface ComissaoCanal {
  percentual: number;
  fixo: number;
}

interface Dados {
  economia: {
    impostoPercent: number;
    impostoObs: string;
    embalagemPadrao: number;
    taxaGatewayPercent: number;
  };
  comissoes: Record<string, ComissaoCanal>;
  canais: { id: CanalVenda; rotulo: string }[];
  exemplo: { id: number; nome: string; preco: number; custo: number | null } | null;
}

type Textos = Record<string, { percentual: string; fixo: string }>;

interface Lancamento {
  id: string;
  tipo: string;
  canal: string;
  inicio: string;
  fim: string;
  valor: number;
  observacao: string | null;
  rateadoEm: string | null;
}

interface TipoCusto {
  id: string;
  rotulo: string;
  rateia: boolean;
}

export default function EconomiaAdmin() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const [impostoPercent, setImpostoPercent] = useState("0");
  const [impostoObs, setImpostoObs] = useState("");
  const [embalagem, setEmbalagem] = useState("0");
  const [taxaGateway, setTaxaGateway] = useState("0");
  const [textos, setTextos] = useState<Textos>({});

  // custos por período (#191 PR-4): ads e fatura do Full
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [tiposCusto, setTiposCusto] = useState<TipoCusto[]>([]);
  const [novo, setNovo] = useState({
    tipo: "ads",
    canal: "mercado_livre",
    inicio: new Date().toISOString().slice(0, 10),
    fim: new Date().toISOString().slice(0, 10),
    valor: "",
    observacao: "",
  });
  const [aviso, setAviso] = useState("");

  // simulador: parte de uma peça real do catálogo
  const [venda, setVenda] = useState("799");
  const [custo, setCusto] = useState("550");
  const [frete, setFrete] = useState("0");
  const [ads, setAds] = useState("0");
  const [canalSim, setCanalSim] = useState<CanalVenda>("mercado_livre");

  useEffect(() => {
    fetch("/api/admin/economia")
      .then((r) => r.json())
      .then((d: Dados) => {
        if (!d?.economia) {
          setErro("Não foi possível carregar os custos");
          setCarregando(false);
          return;
        }
        setDados(d);
        setImpostoPercent(String(d.economia.impostoPercent ?? 0));
        setImpostoObs(d.economia.impostoObs ?? "");
        setEmbalagem(String(d.economia.embalagemPadrao ?? 0));
        setTaxaGateway(String(d.economia.taxaGatewayPercent ?? 0));

        const inicial: Textos = {};
        for (const c of d.canais) {
          inicial[c.id] = {
            percentual: String(d.comissoes?.[c.id]?.percentual ?? 0),
            fixo: String(d.comissoes?.[c.id]?.fixo ?? 0),
          };
        }
        setTextos(inicial);

        if (d.exemplo) {
          setVenda(String(d.exemplo.preco));
          setCusto(d.exemplo.custo != null ? String(d.exemplo.custo) : "");
        }
        setCarregando(false);
        // lista de custos por período (carregada aqui para não depender de
        // função declarada depois do efeito)
        fetch("/api/admin/economia/periodo")
          .then((r) => (r.ok ? r.json() : null))
          .then((periodo) => {
            if (!periodo) return;
            setLancamentos(Array.isArray(periodo.lancamentos) ? periodo.lancamentos : []);
            setTiposCusto(Array.isArray(periodo.tipos) ? periodo.tipos : []);
          })
          .catch(() => {});
      })
      .catch(() => {
        setErro("Erro de conexão");
        setCarregando(false);
      });
  }, []);

  const carregarPeriodo = async () => {
    try {
      const r = await fetch("/api/admin/economia/periodo");
      if (!r.ok) return;
      const d = await r.json();
      setLancamentos(Array.isArray(d.lancamentos) ? d.lancamentos : []);
      setTiposCusto(Array.isArray(d.tipos) ? d.tipos : []);
    } catch {
      /* lista vazia não quebra a tela */
    }
  };

  const lancarCusto = async () => {
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/admin/economia/periodo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novo),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível lançar");
      setNovo({ ...novo, valor: "", observacao: "" });
      setOk("Custo do período lançado. Agora use Ratear para distribuir nas vendas.");
      await carregarPeriodo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao lançar");
    }
  };

  const ratear = async (id: string) => {
    setErro("");
    setOk("");
    setAviso("");
    try {
      const res = await fetch("/api/admin/economia/periodo/ratear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível ratear");
      setAviso(d.mensagem);
      await carregarPeriodo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao ratear");
    }
  };

  const removerLancamento = async (id: string) => {
    setErro("");
    try {
      const res = await fetch(`/api/admin/economia/periodo?id=${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível remover");
      await carregarPeriodo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover");
    }
  };

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/admin/economia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          economia: {
            impostoPercent: Number(impostoPercent) || 0,
            impostoObs,
            embalagemPadrao: Number(embalagem) || 0,
            taxaGatewayPercent: Number(taxaGateway) || 0,
          },
          comissoes: Object.fromEntries(
            Object.entries(textos).map(([canal, v]) => [
              canal,
              { percentual: Number(v.percentual) || 0, fixo: Number(v.fixo) || 0 },
            ])
          ),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível salvar");
      setOk("Custos salvos. Valem na próxima venda e na prévia.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#BF360C" }} />
      </Box>
    );
  }

  // prévia: comissão do canal escolhido com o % que está na tela (antes de salvar)
  const comissoesNaTela: Record<string, ComissaoCanal> = Object.fromEntries(
    Object.entries(textos).map(([canal, v]) => [
      canal,
      { percentual: Number(v.percentual) || 0, fixo: Number(v.fixo) || 0 },
    ])
  );
  const receita = Number(venda) || 0;
  const comissao = comissaoDe(canalSim, receita, comissoesNaTela);
  const imposto = impostoDe(receita, Number(impostoPercent) || 0);
  const taxaGatewayValor = canalSim === "site" ? impostoDe(receita, Number(taxaGateway) || 0) : 0;
  const resultado = calcularResultado({
    receita,
    custoItens: Number(custo) || 0,
    comissao: comissao + taxaGatewayValor,
    freteVendedor: Number(frete) || 0,
    imposto,
    embalagem: Number(embalagem) || 0,
    ads: Number(ads) || 0,
  });

  const linhasDre = [
    { label: "Valor da venda", valor: receita, negativo: false },
    { label: `Comissão ${dados?.canais.find((c) => c.id === canalSim)?.rotulo ?? ""}`, valor: comissao, negativo: true },
    ...(taxaGatewayValor > 0 ? [{ label: "Taxa do gateway (site)", valor: taxaGatewayValor, negativo: true }] : []),
    { label: "Frete pago pelo vendedor", valor: Number(frete) || 0, negativo: true },
    { label: "Custo do produto", valor: Number(custo) || 0, negativo: true },
    { label: `Imposto (${Number(impostoPercent) || 0}%)`, valor: imposto, negativo: true },
    { label: "Embalagem", valor: Number(embalagem) || 0, negativo: true },
    { label: "Publicidade atribuída", valor: Number(ads) || 0, negativo: true },
  ];

  return (
    <Grid container spacing={3} sx={{ pb: { xs: 12, md: 0 } }}>
      <Grid size={{ xs: 12 }}>
        <Alert severity="info">
          Estes números servem para <strong>simular e conferir</strong>. Quando o pedido vem do
          marketplace (importação), a comissão e o frete <strong>reais</strong> do pedido mandam —
          o percentual aqui é o que vale para venda manual e para a prévia.
        </Alert>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Imposto e custos fixos
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
            Imposto entra em cada venda. Embalagem é o custo médio por pedido. Taxa do gateway só
            incide nas vendas do site.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth
                label="Imposto %"
                type="number"
                value={impostoPercent}
                onChange={(e) => setImpostoPercent(e.target.value)}
                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                helperText="Alíquota efetiva"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth
                label="Embalagem (R$)"
                type="number"
                value={embalagem}
                onChange={(e) => setEmbalagem(e.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                helperText="Por venda"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth
                label="Gateway site %"
                type="number"
                value={taxaGateway}
                onChange={(e) => setTaxaGateway(e.target.value)}
                slotProps={{ htmlInput: { min: 0, max: 20, step: 0.01 } }}
                helperText="Só venda no site"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Origem da alíquota"
                value={impostoObs}
                onChange={(e) => setImpostoObs(e.target.value)}
                placeholder="Ex.: Simples Nacional, Anexo I — 6,4% efetivo (contador)"
                helperText="Fica registrado para conferir depois. Não muda o cálculo."
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Comissão por plataforma
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
            Cada plataforma cobra um percentual diferente — e algumas cobram também um valor fixo
            por item. Deixe em <strong>0</strong> o que você não sabe: zero é &quot;não
            informado&quot;, não comissão grátis.
          </Typography>

          <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 320 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Plataforma</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Comissão (%)</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "normal", lineHeight: 1.2 }}>
                  Fixo por item (R$)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(dados?.canais ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell sx={{ whiteSpace: { xs: "normal", sm: "nowrap" }, pr: { xs: 0.5, sm: 2 } }}>
                    {c.rotulo}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={textos[c.id]?.percentual ?? "0"}
                      onChange={(e) =>
                        setTextos({ ...textos, [c.id]: { ...textos[c.id], percentual: e.target.value } })
                      }
                      slotProps={{ htmlInput: { min: 0, max: 60, step: 0.01, "aria-label": `Comissão de ${c.rotulo} em %` } }}
                      sx={{ width: { xs: 74, sm: 96 } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={textos[c.id]?.fixo ?? "0"}
                      onChange={(e) =>
                        setTextos({ ...textos, [c.id]: { ...textos[c.id], fixo: e.target.value } })
                      }
                      slotProps={{ htmlInput: { min: 0, step: 0.01, "aria-label": `Valor fixo de ${c.rotulo}` } }}
                      sx={{ width: { xs: 74, sm: 96 } }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>

          <Typography sx={{ fontSize: "0.75rem", color: "#666", mt: 1.5 }}>
            No Mercado Livre o percentual muda por categoria e por tipo de anúncio
            (clássico/premium); na Shopee há faixa com valor fixo. Por isso o pedido importado
            sempre manda o valor real dele.
          </Typography>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Custos por período — Ads e fatura do Full
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
            O Mercado Livre <strong>Full</strong> não manda frete por pedido: manda fatura mensal de
            fulfillment (e de armazenagem). Lance aqui o valor da fatura e o gasto de Ads, e o
            sistema distribui nas vendas do período, proporcional à receita. O frete de cada venda
            continua editável no pedido — o rateio é para o que chega depois.
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField select fullWidth size="small" label="Tipo" value={novo.tipo}
                onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}>
                {(tiposCusto.length ? tiposCusto : [{ id: "ads", rotulo: "Publicidade (Ads)", rateia: true }]).map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.rotulo}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField select fullWidth size="small" label="Canal" value={novo.canal}
                onChange={(e) => setNovo({ ...novo, canal: e.target.value })}>
                {(dados?.canais ?? []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.rotulo}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField fullWidth size="small" label="De" type="date" value={novo.inicio}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(e) => setNovo({ ...novo, inicio: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField fullWidth size="small" label="Até" type="date" value={novo.fim}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(e) => setNovo({ ...novo, fim: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField fullWidth size="small" label="Valor da fatura (R$)" type="number" value={novo.valor}
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                onChange={(e) => setNovo({ ...novo, valor: e.target.value })} />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
            <TextField size="small" label="Observação (nº da fatura, campanha)" value={novo.observacao}
              onChange={(e) => setNovo({ ...novo, observacao: e.target.value })}
              sx={{ flex: 1, minWidth: 240 }} />
            <Button variant="contained" onClick={lancarCusto} disabled={!novo.valor}
              sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}>
              Lançar custo
            </Button>
          </Box>

          {aviso && <Alert severity="info" sx={{ mb: 2 }}>{aviso}</Alert>}

          {lancamentos.length === 0 ? (
            <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>
              Nenhum custo de período lançado ainda.
            </Typography>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: { xs: 300, sm: 520 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Canal</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Período</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Valor</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Situação</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lancamentos.map((l) => {
                    const tipo = tiposCusto.find((t) => t.id === l.tipo);
                    const rateia = tipo?.rateia ?? false;
                    return (
                      <TableRow key={l.id}>
                        <TableCell sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" } }}>{tipo?.rotulo ?? l.tipo}</TableCell>
                        <TableCell sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" }, display: { xs: "none", sm: "table-cell" } }}>
                          {dados?.canais.find((c) => c.id === l.canal)?.rotulo ?? l.canal}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: { xs: "normal", sm: "nowrap" }, fontSize: { xs: "0.7rem", sm: "0.78rem" } }}>
                          {l.inicio.slice(8, 10)}/{l.inicio.slice(5, 7)} → {l.fim.slice(8, 10)}/{l.fim.slice(5, 7)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatBRL(l.valor)}</TableCell>
                        <TableCell>
                          {l.rateadoEm ? (
                            <Chip size="small" label="rateado" sx={{ height: 20, fontSize: "0.65rem", backgroundColor: "#E8F5EC", color: "#0E7A3F" }} />
                          ) : rateia ? (
                            <Chip size="small" label="a ratear" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                          ) : (
                            <Chip size="small" label="custo do período" variant="outlined" sx={{ height: 20, fontSize: "0.65rem", color: "#666" }} />
                          )}
                        </TableCell>
                        <TableCell>
                          {rateia && (
                            <Button size="small" onClick={() => ratear(l.id)}
                              sx={{ textTransform: "none", color: "#BF360C", fontWeight: 700, minWidth: 0 }}>
                              Ratear
                            </Button>
                          )}
                          {!l.rateadoEm && (
                            <Button size="small" onClick={() => removerLancamento(l.id)}
                              sx={{ textTransform: "none", color: "#b3261e", minWidth: 0 }}>
                              Remover
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Simulador de venda
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
            Mesma conta que o pedido e o relatório usam. Serve para decidir preço e quanto cabe de
            anúncio antes de publicar.
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField fullWidth size="small" label="Venda (R$)" type="number" value={venda}
                onChange={(e) => setVenda(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField fullWidth size="small" label="Custo (R$)" type="number" value={custo}
                onChange={(e) => setCusto(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                helperText={custo === "" ? "Não informado" : undefined} />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField fullWidth size="small" label="Frete (R$)" type="number" value={frete}
                onChange={(e) => setFrete(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                helperText="Pago por você" />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField fullWidth size="small" label="Ads (R$)" type="number" value={ads}
                onChange={(e) => setAds(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="canal-sim">Canal</InputLabel>
                <Select
                  labelId="canal-sim"
                  label="Canal"
                  value={canalSim}
                  onChange={(e) => setCanalSim(e.target.value as CanalVenda)}
                >
                  {(dados?.canais ?? []).map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.rotulo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, maxWidth: 520 }}>
            {linhasDre.map((l) => (
              <Box key={l.label} sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <Box component="span" sx={{ color: "#444" }}>{l.label}</Box>
                <Box component="span" sx={{ fontWeight: 600, color: l.negativo ? "#8a3b12" : "#333" }}>
                  {l.negativo ? "− " : ""}{formatBRL(l.valor)}
                </Box>
              </Box>
            ))}
            <Divider sx={{ my: 0.5 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontWeight: 700 }}>Resultado da venda</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 700, color: resultado.prejuizo ? "#b3261e" : "#0E7A3F", fontSize: "1.05rem" }}>
                  {formatBRL(resultado.resultado)}
                </Typography>
                <Chip
                  size="small"
                  label={formatPercent(resultado.margemPercent)}
                  sx={{
                    height: 20,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    backgroundColor: resultado.prejuizo ? "#fdecea" : "#E8F5EC",
                    color: resultado.prejuizo ? "#b3261e" : "#0E7A3F",
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#666", mt: 0.5 }}>
              <Box component="span">Margem de contribuição (antes do ads)</Box>
              <Box component="span">{formatBRL(resultado.margemContribuicao)} · {formatPercent(resultado.mcPercent)}</Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#666" }}>
              <Box component="span">Teto de ads nesta venda</Box>
              <Box component="span">{formatBRL(resultado.tetoAds)}</Box>
            </Box>
            {Number(ads) > resultado.tetoAds && (
              <Alert severity="warning" sx={{ mt: 1, py: 0.25 }}>
                O ads desta simulação ({formatBRL(Number(ads))}) passa do teto de {formatBRL(resultado.tetoAds)}:
                a venda fecha no prejuízo.
              </Alert>
            )}
          </Box>
        </Paper>
      </Grid>

      {erro && <Grid size={{ xs: 12 }}><Alert severity="error">{erro}</Alert></Grid>}
      {ok && <Grid size={{ xs: 12 }}><Alert severity="success">{ok}</Alert></Grid>}

      <Grid size={{ xs: 12 }}>
        <Paper
          sx={{
            // no celular a página é longa e o botão ficava fora da dobra: barra fixa
            position: { xs: "fixed", md: "static" },
            left: { xs: 12, md: "auto" },
            right: { xs: 12, md: "auto" },
            bottom: { xs: 12, md: "auto" },
            zIndex: { xs: 1200, md: "auto" },
            p: 2,
            borderRadius: 3,
            display: "flex",
            gap: 2,
            alignItems: "center",
            boxShadow: { xs: 4, md: 0 },
          }}
        >
          <Button
            variant="contained"
            onClick={salvar}
            disabled={salvando}
            sx={{ backgroundColor: "#BF360C", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none", fontWeight: 700 }}
          >
            {salvando ? "Salvando…" : "Salvar custos"}
          </Button>
          <Typography sx={{ fontSize: "0.75rem", color: "#666" }}>
            Vale na hora para a prévia; entra nas próximas vendas.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
