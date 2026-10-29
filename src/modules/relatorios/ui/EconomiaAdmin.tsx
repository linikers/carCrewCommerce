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
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { calcularResultado, comissaoDe, impostoDe, type CanalVenda } from "@/modules/pedidos/dominio/resultado";
import { formatBRL } from "@/lib/format";

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
      })
      .catch(() => {
        setErro("Erro de conexão");
        setCarregando(false);
      });
  }, []);

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
    <Grid container spacing={3}>
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

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Plataforma</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Comissão (%)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fixo por item (R$)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(dados?.canais ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{c.rotulo}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={textos[c.id]?.percentual ?? "0"}
                      onChange={(e) =>
                        setTextos({ ...textos, [c.id]: { ...textos[c.id], percentual: e.target.value } })
                      }
                      slotProps={{ htmlInput: { min: 0, max: 60, step: 0.01, "aria-label": `Comissão de ${c.rotulo} em %` } }}
                      sx={{ width: 110 }}
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
                      sx={{ width: 110 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
                  label={`${resultado.margemPercent.toFixed(1)}%`}
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
              <Box component="span">{formatBRL(resultado.margemContribuicao)} · {resultado.mcPercent.toFixed(1)}%</Box>
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
        <Paper sx={{ position: "sticky", bottom: 0, p: 2, borderRadius: 3, display: "flex", gap: 2, alignItems: "center" }}>
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
