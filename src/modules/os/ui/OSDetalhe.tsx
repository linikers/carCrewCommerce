"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
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
import { ArrowBack, DeleteOutlined, Add, Edit, Send, PictureAsPdf } from "@mui/icons-material";
import { formatBRL, formatDataCurta } from "@/lib/format";
import {
  STATUS_OS,
  STATUS_OS_COR,
  STATUS_OS_LABEL,
  type StatusOS,
} from "@/modules/os/dominio/os";

interface Item {
  id: string;
  tipo: string;
  descricao: string;
  quantidade: number;
  valorUnit: number;
  total: number;
}

interface Ordem {
  id: string;
  clienteNome: string;
  clienteTelefone: string | null;
  clienteEmail: string | null;
  veiculo: string;
  placa: string | null;
  km: number | null;
  descricaoProblema: string;
  observacoes: string | null;
  status: string;
  totalPecas: number;
  totalServicos: number;
  total: number;
  prazo: string | null;
  criadoEm: string;
  tokenPublico?: string | null;
  itens: Item[];
}

export default function OSDetalhe({ id }: { id: string }) {
  const router = useRouter();
  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [linkAberto, setLinkAberto] = useState(false);
  const [itemAberto, setItemAberto] = useState(false);
  // edição dos dados da OS (cliente, veículo, data de abertura)
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    clienteNome: "",
    clienteTelefone: "",
    veiculo: "",
    placa: "",
    km: "",
    descricaoProblema: "",
    observacoes: "",
    prazo: "",
    dataAbertura: "",
  });
  const [historico, setHistorico] = useState<
    { id: string; veiculo: string; status: string; criadoEm: string; total: number }[]
  >([]);
  const [item, setItem] = useState({
    tipo: "peca",
    origem: "catalogo" as "catalogo" | "externa",
    produtoId: null as number | null,
    descricao: "",
    quantidade: "1",
    valorUnit: "",
    custo: "",
    terceiro: "",
  });
  const [buscaProduto, setBuscaProduto] = useState("");
  const [achados, setAchados] = useState<{ id: number; nome: string; preco: number; estoque: number }[]>([]);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    const res = await fetch(`/api/admin/os/${id}`);
    if (!res.ok) {
      setErro("OS não encontrada");
      setCarregando(false);
      return;
    }
    const dados = await res.json();
    setOrdem(dados);
    setCarregando(false);

    if (dados?.placa) {
      const h = await fetch(`/api/admin/os/historico?placa=${encodeURIComponent(dados.placa)}&ignorar=${id}`);
      if (h.ok) {
        const hd = await h.json();
        setHistorico(hd.ordens ?? []);
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const acao = async (corpo: Record<string, unknown>, mensagem: string) => {
    setSalvando(true);
    setErro("");
    setOk("");
    try {
      const res = await fetch(`/api/admin/os/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao salvar");
      setOk(mensagem);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  const buscarProduto = async (termo: string) => {
    setBuscaProduto(termo);
    if (termo.trim().length < 2) {
      setAchados([]);
      return;
    }
    const res = await fetch(`/api/admin/busca?q=${encodeURIComponent(termo)}`);
    if (!res.ok) return;
    const d = await res.json();
    setAchados((d.produtos ?? []).slice(0, 6));
  };

  const escolherProduto = (p: { id: number; nome: string; preco: number }) => {
    setItem({
      ...item,
      produtoId: p.id,
      origem: "catalogo",
      tipo: "peca",
      descricao: p.nome,
      valorUnit: String(p.preco),
    });
    setBuscaProduto(p.nome);
    setAchados([]);
  };

  const abrirEdicao = () => {
    if (!ordem) return;
    setForm({
      clienteNome: ordem.clienteNome,
      clienteTelefone: ordem.clienteTelefone || "",
      veiculo: ordem.veiculo,
      placa: ordem.placa || "",
      km: ordem.km ? String(ordem.km) : "",
      descricaoProblema: ordem.descricaoProblema,
      observacoes: ordem.observacoes || "",
      prazo: ordem.prazo ? String(ordem.prazo).slice(0, 10) : "",
      dataAbertura: String(ordem.criadoEm).slice(0, 10),
    });
    setEditando(true);
  };

  const salvarEdicao = async () => {
    await acao(
      {
        acao: "editar",
        dados: {
          clienteNome: form.clienteNome,
          clienteTelefone: form.clienteTelefone || null,
          veiculo: form.veiculo,
          placa: form.placa || null,
          km: form.km ? Number(form.km) : null,
          descricaoProblema: form.descricaoProblema,
          observacoes: form.observacoes || null,
          prazo: form.prazo || null,
          dataAbertura: form.dataAbertura || null,
        },
      },
      "Dados da OS atualizados."
    );
    setEditando(false);
  };

  const adicionar = async () => {
    await acao(
      {
        acao: "item",
        item: {
          tipo: item.tipo,
          origem: item.tipo === "peca" ? item.origem : null,
          produtoId: item.origem === "catalogo" ? item.produtoId : null,
          descricao: item.descricao,
          quantidade: Number(item.quantidade),
          valorUnit: Number(String(item.valorUnit).replace(",", ".")),
          custo: item.custo ? Number(String(item.custo).replace(",", ".")) : null,
          terceiro: item.terceiro || null,
        },
      },
      "Item adicionado."
    );
    setItem({ ...item, produtoId: null, descricao: "", quantidade: "1", valorUnit: "", custo: "", terceiro: "" });
    setBuscaProduto("");
    setAchados([]);
    setItemAberto(false);
  };

  if (carregando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!ordem) return <Alert severity="error">OS não encontrada.</Alert>;

  const statusAtual = ordem.status as StatusOS;
  const fechada = ["entregue", "cancelada"].includes(ordem.status);

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => router.push("/admin/os")} sx={{ textTransform: "none", mb: 2, color: "#555" }}>
        Ordens
      </Button>

      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>{erro}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk("")}>{ok}</Alert>}

      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{ordem.clienteNome}</Typography>
              <Chip size="small" label={STATUS_OS_LABEL[statusAtual]} color={STATUS_OS_COR[statusAtual]} variant="outlined" />
            </Box>
            <Typography sx={{ fontSize: "0.85rem", color: "#555", mt: 0.5 }}>
              {ordem.veiculo}{ordem.placa ? ` · ${ordem.placa}` : ""}{ordem.km ? ` · ${ordem.km} km` : ""}
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "#888" }}>
              {ordem.clienteTelefone || "sem telefone"} · aberta em {formatDataCurta(ordem.criadoEm)}
              {ordem.prazo ? ` · prazo ${formatDataCurta(ordem.prazo)}` : ""}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={() => window.open(`/api/admin/os/${ordem.id}/pdf`, "_blank")}
            sx={{ textTransform: "none", height: 40, borderColor: "#BF360C", color: "#BF360C" }}
          >
            PDF
          </Button>

          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={abrirEdicao}
            sx={{ textTransform: "none", height: 40 }}
          >
            Editar dados
          </Button>

          <Button
            variant="outlined"
            startIcon={<Send />}
            onClick={() => setLinkAberto(true)}
            sx={{ textTransform: "none", height: 40 }}
          >
            Enviar orçamento
          </Button>

          <TextField
            size="small"
            select
            label="Mudar status"
            value=""
            sx={{ minWidth: 200 }}
            disabled={salvando || fechada}
            onChange={(e) => acao({ acao: "status", status: e.target.value }, "Status atualizado.")}
          >
            {STATUS_OS.filter((s) => s !== statusAtual).map((s) => (
              <MenuItem key={s} value={s}>{STATUS_OS_LABEL[s]}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontSize: "0.72rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Problema relatado
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "#333", mb: 1 }}>{ordem.descricaoProblema}</Typography>

        {ordem.observacoes && (
          <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>
            <strong>Observações:</strong> {ordem.observacoes}
          </Typography>
        )}
      </Paper>

      {historico.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 3 }}>
          <Typography sx={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#888", mb: 1 }}>
            Este carro já passou aqui ({historico.length})
          </Typography>
          {historico.map((h) => (
            <Box
              key={h.id}
              onClick={() => router.push(`/admin/os/${h.id}`)}
              sx={{ display: "flex", gap: 2, py: 0.75, cursor: "pointer", fontSize: "0.82rem", "&:hover": { color: "#BF360C" } }}
            >
              <Box component="span" sx={{ color: "#888", minWidth: 78 }}>{formatDataCurta(h.criadoEm)}</Box>
              <Box component="span" sx={{ flex: 1 }}>{h.veiculo}</Box>
              <Box component="span" sx={{ color: "#888" }}>{STATUS_OS_LABEL[h.status as StatusOS] ?? h.status}</Box>
              <Box component="span" sx={{ fontWeight: 600 }}>{formatBRL(h.total)}</Box>
            </Box>
          ))}
        </Paper>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5, flexWrap: "wrap" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Itens da OS</Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "#888" }}>
          Produtos {formatBRL(ordem.totalPecas)} · Serviços {formatBRL(ordem.totalServicos)}
        </Typography>

        {!fechada && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setItem({ ...item, tipo: "peca", origem: "catalogo", produtoId: null, descricao: "", quantidade: "1", valorUnit: "", custo: "", terceiro: "" });
              setBuscaProduto("");
              setAchados([]);
              setItemAberto(true);
            }}
            sx={{
              ml: "auto",
              backgroundColor: "#BF360C",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": { backgroundColor: "#8C2A09" },
            }}
          >
            Adicionar produto
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Qtd</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Unitário</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {ordem.itens.map((i) => (
              <TableRow key={i.id} hover>
                <TableCell>
                  <Chip size="small" label={i.tipo} variant="outlined" sx={{ fontSize: "0.65rem" }} />
                </TableCell>
                <TableCell sx={{ fontSize: "0.85rem" }}>{i.descricao}</TableCell>
                <TableCell align="right">{i.quantidade}</TableCell>
                <TableCell align="right">{formatBRL(i.valorUnit)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{formatBRL(i.total)}</TableCell>
                <TableCell align="right">
                  {!fechada && (
                    <IconButton aria-label="Remover"
                      size="small"
                      onClick={() => {
                        // remover item é destrutivo: confirma antes
                        if (confirm(`Remover "${i.descricao}" da OS?`)) {
                          acao({ acao: "removerItem", itemId: i.id }, "Item removido.");
                        }
                      }}
                      sx={{ width: 44, height: 44, color: "#b3261e" }}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {ordem.itens.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 3, textAlign: "center", color: "#666" }}>
                  Nenhum item ainda — adicione a peça ou o serviço abaixo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {fechada && (
        <Alert
          severity={ordem.status === "entregue" ? "info" : "warning"}
          sx={{ mb: 2, fontSize: "0.82rem" }}
          action={
            ordem.status === "entregue" ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => acao({ acao: "status", status: "concluida" }, "OS reaberta.")}
                sx={{ textTransform: "none" }}
              >
                Reabrir
              </Button>
            ) : undefined
          }
        >
          {ordem.status === "entregue"
            ? "OS entregue: peças e serviços estão travados. Reabra para corrigir e feche de novo."
            : "OS cancelada: não dá para incluir itens (o estoque já foi devolvido). Abra uma nova OS."}
        </Alert>
      )}


      <Dialog open={itemAberto} onClose={() => setItemAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Adicionar produto</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            size="small"
            label="O que você está lançando"
            value={item.tipo === "peca" && item.origem === "catalogo" ? "catalogo" : item.tipo === "peca" ? "externa" : item.tipo}
            onChange={(e) => {
              const escolha = e.target.value;
              if (escolha === "catalogo") {
                setItem({ ...item, tipo: "peca", origem: "catalogo" });
              } else if (escolha === "externa") {
                setItem({ ...item, tipo: "peca", origem: "externa", produtoId: null });
              } else {
                setItem({ ...item, tipo: escolha, origem: "externa", produtoId: null });
              }
            }}
            sx={{ mt: 1 }}
            helperText={
              item.tipo === "peca" && item.origem === "catalogo"
                ? "Baixa o estoque na hora"
                : item.tipo === "peca"
                  ? "Não mexe no estoque — peça comprada fora"
                  : "Mão de obra ou serviço de terceiro"
            }
          >
            <MenuItem value="catalogo">Produto do catálogo (baixa estoque)</MenuItem>
            <MenuItem value="externa">Produto comprado fora (sem estoque)</MenuItem>
            <MenuItem value="servico">Mão de obra (serviço próprio)</MenuItem>
            <MenuItem value="terceiro">Serviço de terceiro</MenuItem>
          </TextField>

          {item.tipo === "peca" && item.origem === "catalogo" ? (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Buscar peça no catálogo"
                placeholder="Nome ou SKU"
                value={buscaProduto}
                onChange={(e) => {
                  setBuscaProduto(e.target.value);
                  void buscarProduto(e.target.value);
                }}
                helperText={item.produtoId ? "Peça vinculada — o estoque dessa peça será baixado" : "Escolha uma peça da lista"}
              />
              {achados.length > 0 && (
                <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, mt: 1, maxHeight: 200, overflowY: "auto" }}>
                  {achados.map((p) => (
                    <ButtonBase
                      key={p.id}
                      onClick={() => escolherProduto(p)}
                      sx={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        p: 1.25,
                        fontSize: "0.82rem",
                        borderBottom: "1px solid #f0f0f0",
                        "&:hover": { backgroundColor: "#f5f5f5" },
                      }}
                    >
                      <Box component="span" sx={{ fontWeight: 700 }}>{p.nome}</Box>
                      <Box component="span" sx={{ color: "#777" }}>
                        {" "}· {formatBRL(p.preco)} · {p.estoque} em estoque
                      </Box>
                    </ButtonBase>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <TextField
              fullWidth
              size="small"
              label={item.tipo === "terceiro" ? "O que o terceiro vai fazer" : item.tipo === "peca" ? "Descrição da peça" : "Descrição do serviço"}
              value={item.descricao}
              onChange={(e) => setItem({ ...item, descricao: e.target.value })}
              sx={{ mt: 2 }}
            />
          )}

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 2 }}>
            <TextField
              size="small"
              type="number"
              label="Quantidade"
              value={item.quantidade}
              onChange={(e) => setItem({ ...item, quantidade: e.target.value })}
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <TextField
              size="small"
              label="Valor unitário"
              placeholder="0,00"
              value={item.valorUnit}
              onChange={(e) => setItem({ ...item, valorUnit: e.target.value })}
            />
          </Box>

          {item.tipo === "terceiro" && (
            <TextField
              fullWidth
              size="small"
              label="Terceiro (quem executa)"
              value={item.terceiro}
              onChange={(e) => setItem({ ...item, terceiro: e.target.value })}
              sx={{ mt: 2 }}
            />
          )}

          {(item.tipo === "terceiro" || (item.tipo === "peca" && item.origem === "externa")) && (
            <TextField
              fullWidth
              size="small"
              label="Custo (opcional)"
              placeholder="0,00"
              value={item.custo}
              onChange={(e) => setItem({ ...item, custo: e.target.value })}
              sx={{ mt: 2 }}
              helperText="Só aparece no PDF interno, para calcular margem"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setItemAberto(false)} sx={{ textTransform: "none" }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={adicionar}
            disabled={salvando || !item.descricao || !item.valorUnit}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
          >
            {salvando ? "Adicionando…" : "Adicionar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editando} onClose={() => setEditando(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Editar dados da OS</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mt: 1 }}>
            <TextField size="small" label="Cliente" value={form.clienteNome}
              onChange={(e) => setForm({ ...form, clienteNome: e.target.value })} />
            <TextField size="small" label="Telefone" value={form.clienteTelefone}
              onChange={(e) => setForm({ ...form, clienteTelefone: e.target.value })} />
            <TextField size="small" label="Veículo" value={form.veiculo}
              onChange={(e) => setForm({ ...form, veiculo: e.target.value })} />
            <TextField size="small" label="Placa" value={form.placa}
              onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} />
            <TextField size="small" type="number" label="KM" value={form.km}
              onChange={(e) => setForm({ ...form, km: e.target.value })} />
            <TextField size="small" type="date" label="Data de abertura" value={form.dataAbertura}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(e) => setForm({ ...form, dataAbertura: e.target.value })} />
            <TextField size="small" type="date" label="Prazo" value={form.prazo}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
          </Box>
          <TextField size="small" fullWidth multiline minRows={2} label="Problema relatado" sx={{ mt: 1.5 }}
            value={form.descricaoProblema}
            onChange={(e) => setForm({ ...form, descricaoProblema: e.target.value })} />
          <TextField size="small" fullWidth multiline minRows={2} label="Observações" sx={{ mt: 1.5 }}
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditando(false)} sx={{ textTransform: "none" }}>Cancelar</Button>
          <Button variant="contained" onClick={salvarEdicao} disabled={salvando || !form.clienteNome || !form.veiculo}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={linkAberto} onClose={() => setLinkAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Enviar orçamento ao cliente</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.82rem", color: "#666", mb: 2 }}>
            O cliente abre o link sem login, vê peças e serviços (sem custo interno) e aprova ou
            recusa. Quando aprova, esta OS vai para <strong>Aprovada pelo cliente</strong>.
          </Typography>

          <TextField
            fullWidth
            size="small"
            value={ordem.tokenPublico ? `${typeof window !== "undefined" ? window.location.origin : ""}/orcamento/${ordem.tokenPublico}` : ""}
            slotProps={{ input: { readOnly: true } }}
            helperText={ordem.tokenPublico ? "" : "Esta OS é antiga e não tem link. Abra uma nova."}
          />

          {ordem.status === "aberta" && (
            <Alert severity="info" sx={{ mt: 2, fontSize: "0.78rem" }}>
              Mude o status para <strong>Orçamento enviado</strong> antes de mandar — assim o
              painel mostra que ele está esperando resposta.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLinkAberto(false)} sx={{ textTransform: "none" }}>Fechar</Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={() => {
              if (ordem.tokenPublico) {
                window.open(`/api/orcamento/${ordem.tokenPublico}/pdf`, "_blank");
              }
            }}
            sx={{ textTransform: "none" }}
          >
            PDF do orçamento
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (ordem.tokenPublico) {
                void navigator.clipboard.writeText(`${window.location.origin}/orcamento/${ordem.tokenPublico}`);
              }
            }}
            sx={{ textTransform: "none" }}
          >
            Copiar link
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!ordem.tokenPublico) return;
              const link = `${window.location.origin}/orcamento/${ordem.tokenPublico}`;
              const texto = `Olá, ${ordem.clienteNome}! Seu orçamento da Car Crew para o ${ordem.veiculo} está pronto: ${link}`;
              window.open(`https://wa.me/${(ordem.clienteTelefone || "").replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`, "_blank");
            }}
            sx={{ backgroundColor: "#25D366", textTransform: "none", fontWeight: 700, "&:hover": { backgroundColor: "#1eb955" } }}
          >
            Enviar no WhatsApp
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 3 }}>
        <Typography sx={{ fontSize: "0.85rem", color: "#666" }}>Total da OS</Typography>
        <Typography sx={{ fontSize: "1.1rem", fontWeight: 800 }}>{formatBRL(ordem.total)}</Typography>
      </Box>
    </Box>
  );
}
