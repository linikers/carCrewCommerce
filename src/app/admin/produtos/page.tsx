"use client";

import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/format";
import { calcularPreco } from "@/lib/preco";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Inventory2,
  LocalOffer,
  Paid,
  Receipt,
} from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";

interface Produto {
  sku?: string | null;
  descontoPercent?: number;
  /** custo da peça; null/undefined = não informado (não é zero) */
  custo?: number | null;
  id: number;
  nome: string;
  preco: number;
  category: string;
  estoque: number;
  ativo: boolean;
}

export default function AdminProdutos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(0);           // 0-based, como o TablePagination
  const [porPagina, setPorPagina] = useState(20);
  // desconto em lote (#desconto): aplica no que está filtrado na tela
  const [descontoAberto, setDescontoAberto] = useState(false);
  const [descontoPercent, setDescontoPercent] = useState("5");
  const [salvandoDesconto, setSalvandoDesconto] = useState(false);
  const [ordemPor, setOrdemPor] = useState<"id" | "nome" | "preco" | "estoque">("id");
  const [ordemDir, setOrdemDir] = useState<"asc" | "desc">("desc");
  // 6.3/6.4: sem visão de "sem preço" e "estoque baixo" a lista não servia
  // para trabalhar. O filtro vem também pela URL (atalho do dashboard).
  const [filtroRapido, setFiltroRapido] = useState<"todos" | "sem-preco" | "esgotado" | "estoque-baixo" | "sem-custo">("todos");
  // custos em lote (#191): a planilha do fornecedor vem por SKU
  const [custosAberto, setCustosAberto] = useState(false);
  const [textoCustos, setTextoCustos] = useState("");
  const [salvandoCustos, setSalvandoCustos] = useState(false);
  // dado fiscal em lote (interface do emissor)
  const [fiscalAberto, setFiscalAberto] = useState(false);
  const [textoFiscal, setTextoFiscal] = useState("");
  const [salvandoFiscal, setSalvandoFiscal] = useState(false);
  const [resultadoFiscal, setResultadoFiscal] = useState<{
    mensagem: string;
    naoEncontrados: string[];
    erros: { linha: number; texto: string; motivo: string }[];
  } | null>(null);
  const [resultadoCustos, setResultadoCustos] = useState<{
    mensagem: string;
    naoEncontrados: string[];
    erros: { linha: number; texto: string; motivo: string }[];
  } | null>(null);

  const carregar = async () => {
    try {
      setErro("");
      const res = await fetch("/api/admin/produtos");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar produtos");
      // a API pode devolver erro em JSON; sem esta checagem o .filter abaixo
      // estourava com "data.filter is not a function"
      setProdutos(Array.isArray(data) ? data : []);
    } catch (e) {
      setErro((e as Error).message);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar no mount é o padrão desta tela (o setState acontece depois do fetch).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filtro = params.get("filtro");
    if (filtro === "sem-preco" || filtro === "estoque-baixo" || filtro === "esgotado") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiltroRapido(filtro);
    }
    const termo = params.get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (termo) setSearch(termo);
  }, []);



  const aplicarDesconto = async (percentual: number, ids: number[]) => {
    setSalvandoDesconto(true);
    try {
      const res = await fetch("/api/admin/produtos/desconto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, percentual }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao aplicar");
      setDescontoAberto(false);
      await carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha ao aplicar o desconto");
    } finally {
      setSalvandoDesconto(false);
    }
  };

  /** Custo em lote por SKU — cola da planilha (formato SKU;custo). */
  const importarCustos = async () => {
    setSalvandoCustos(true);
    setResultadoCustos(null);
    try {
      const res = await fetch("/api/admin/produtos/custos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: textoCustos }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao gravar os custos");
      setResultadoCustos({
        mensagem: d.mensagem,
        naoEncontrados: Array.isArray(d.naoEncontrados) ? d.naoEncontrados : [],
        erros: Array.isArray(d.erros) ? d.erros : [],
      });
      setTextoCustos("");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao gravar os custos");
    } finally {
      setSalvandoCustos(false);
    }
  };

  /** Dado fiscal em lote: SKU;CSOSN;CFOP interno;CFOP externo */
  const importarFiscal = async () => {
    setSalvandoFiscal(true);
    setResultadoFiscal(null);
    try {
      const res = await fetch("/api/admin/produtos/fiscal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: textoFiscal }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao gravar o dado fiscal");
      setResultadoFiscal({
        mensagem: d.mensagem,
        naoEncontrados: Array.isArray(d.naoEncontrados) ? d.naoEncontrados : [],
        erros: Array.isArray(d.erros) ? d.erros : [],
      });
      setTextoFiscal("");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao gravar o dado fiscal");
    } finally {
      setSalvandoFiscal(false);
    }
  };

  const alternarAtivo = async (id: number, ativoAtual: boolean) => {
    try {
      const res = await fetch(`/api/admin/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativoAtual }),
      });
      if (!res.ok) throw new Error("Não foi possível alterar o status");
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const excluir = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/produtos/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Não foi possível excluir");
      setDeleteId(null);
      carregar();
    } catch (e) {
      setErro((e as Error).message);
      setDeleteId(null);
    }
  };

  if (status === "unauthenticated" || (status === "authenticated" && !session?.user?.admin)) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Container sx={{ flex: 1, py: 8, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Acesso restrito</Typography>
          <Button variant="contained" onClick={() => router.push("/admin/login")}
            sx={{ mt: 2, backgroundColor: "#BF360C", textTransform: "none" }}>
            Login Admin
          </Button>
      </Container>
      </Box>
    );
  }

  const filtrados = produtos.filter((p) => {
    const termo = search.trim().toLowerCase();
    if (
      !p.nome.toLowerCase().includes(termo) &&
      !(p.sku || "").toLowerCase().includes(termo)
    )
      return false;
    if (filtroRapido === "sem-preco") return p.preco <= 0;
    if (filtroRapido === "sem-custo") return p.custo === null || p.custo === undefined;
    if (filtroRapido === "esgotado") return p.estoque <= 0;
    if (filtroRapido === "estoque-baixo") return p.estoque > 0 && p.estoque <= 2;
    return true;
  });

  // Ordenação: clicar no cabeçalho alterna asc/desc.
  const ordenados = [...filtrados].sort((a, b) => {
    const dir = ordemDir === "asc" ? 1 : -1;
    switch (ordemPor) {
      case "nome":
        return a.nome.localeCompare(b.nome, "pt-BR") * dir;
      case "preco":
        return (a.preco - b.preco) * dir;
      case "estoque":
        return (a.estoque - b.estoque) * dir;
      default:
        return (a.id - b.id) * dir;
    }
  });

  const total = ordenados.length;
  const paginados = ordenados.slice(pagina * porPagina, pagina * porPagina + porPagina);

  const mudarOrdem = (campo: typeof ordemPor) => {
    if (ordemPor === campo) {
      setOrdemDir(ordemDir === "asc" ? "desc" : "asc");
    } else {
      setOrdemPor(campo);
      setOrdemDir("asc");
    }
    setPagina(0);
  };

  return (
    <AdminLayout title="Produtos">
      <Container maxWidth="lg" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Produtos</Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              {produtos.length} produto(s) cadastrado(s)
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push("/admin/produtos/novo")}
            sx={{ backgroundColor: "#BF360C", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none" }}
          >
            Novo Produto
          </Button>

          <Button
            variant="outlined"
            startIcon={<LocalOffer />}
            onClick={() => setDescontoAberto(true)}
            sx={{ textTransform: "none", borderColor: "#BF360C", color: "#BF360C" }}
          >
            Desconto
          </Button>

          <Button
            variant="outlined"
            startIcon={<Paid />}
            onClick={() => { setCustosAberto(true); setResultadoCustos(null); }}
            sx={{ textTransform: "none", borderColor: "#BF360C", color: "#BF360C" }}
          >
            Custos
          </Button>
          <Button
            variant="outlined"
            startIcon={<Receipt />}
            onClick={() => { setFiscalAberto(true); setResultadoFiscal(null); }}
            sx={{ textTransform: "none", borderColor: "#BF360C", color: "#BF360C" }}
          >
            Fiscal
          </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPagina(0); }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
          {[
            { id: "todos" as const, label: `Todos (${produtos.length})` },
            { id: "sem-preco" as const, label: `Sem preço (${produtos.filter((p) => p.preco <= 0).length})` },
            // sem custo = sem resultado na venda; é o filtro que transforma
            // "relatório vazio" em trabalho a fazer
            { id: "sem-custo" as const, label: `Sem custo (${produtos.filter((p) => p.custo === null || p.custo === undefined).length})` },
            // estoque 0 é "esgotado", não "baixo" — antes os 48 entravam no
            // filtro e ele não filtrava nada
            { id: "esgotado" as const, label: `Esgotado (${produtos.filter((p) => p.estoque <= 0).length})` },
            { id: "estoque-baixo" as const, label: `Estoque baixo (${produtos.filter((p) => p.estoque > 0 && p.estoque <= 2).length})` },
          ].map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              onClick={() => { setFiltroRapido(f.id); setPagina(0); }}
              color={filtroRapido === f.id ? "primary" : "default"}
              variant={filtroRapido === f.id ? "filled" : "outlined"}
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>
            {erro}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#BF360C" }} />
          </Box>
        ) : filtrados.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
            <Typography variant="h6" sx={{ color: "#666" }}>
              {produtos.length === 0 ? "Nenhum produto cadastrado" : "Nenhum produto encontrado"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
              {produtos.length === 0
                ? "Cadastre o primeiro produto para ele aparecer na loja"
                : `Nada com "${search}"`}
            </Typography>
            {produtos.length === 0 ? (
              <Button variant="contained" startIcon={<Add />} onClick={() => router.push("/admin/produtos/novo")}
                sx={{ backgroundColor: "#E65100", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none" }}>
                Novo produto
              </Button>
            ) : (
              <Button variant="outlined" onClick={() => setSearch("")} sx={{ textTransform: "none" }}>
                Limpar busca
              </Button>
            )}
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600 }} sortDirection={ordemPor === "id" ? ordemDir : false}>
                    <TableSortLabel active={ordemPor === "id"} direction={ordemPor === "id" ? ordemDir : "asc"} onClick={() => mudarOrdem("id")}>SKU</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} sortDirection={ordemPor === "nome" ? ordemDir : false}>
                    <TableSortLabel active={ordemPor === "nome"} direction={ordemPor === "nome" ? ordemDir : "asc"} onClick={() => mudarOrdem("nome")}>Nome</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} sortDirection={ordemPor === "preco" ? ordemDir : false}>
                    <TableSortLabel active={ordemPor === "preco"} direction={ordemPor === "preco" ? ordemDir : "asc"} onClick={() => mudarOrdem("preco")}>Preço</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Custo / margem</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} sortDirection={ordemPor === "estoque" ? ordemDir : false}>
                    <TableSortLabel active={ordemPor === "estoque"} direction={ordemPor === "estoque" ? ordemDir : "asc"} onClick={() => mudarOrdem("estoque")}>Estoque</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginados.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      {/* o SKU é o que a operação usa; o id fica discreto */}
                      <Box sx={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600 }}>
                        {p.sku || "—"}
                      </Box>
                      <Box sx={{ color: "#999", fontSize: "0.7rem" }}>#{p.id}</Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.nome}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: p.preco > 0 ? "#BF360C" : "#999" }}>
                      {p.preco > 0 ? (
                        (() => {
                          const preco = calcularPreco(p.preco, p.descontoPercent);
                          return preco.temDesconto ? (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                              <Box component="span" sx={{ color: "#9a9a9a", textDecoration: "line-through", fontSize: "0.72rem", fontWeight: 500 }}>
                                {formatBRL(preco.de)}
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                {formatBRL(preco.por)}
                                <Chip
                                  size="small"
                                  label={`-${preco.percentual}%`}
                                  sx={{ height: 16, fontSize: "0.6rem", backgroundColor: "#E8F5EC", color: "#0E7A3F", fontWeight: 700 }}
                                />
                              </Box>
                            </Box>
                          ) : (
                            formatBRL(preco.por)
                          );
                        })()
                      ) : (
                        "Sob consulta"
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const custo = p.custo;
                        if (custo === null || custo === undefined) {
                          return (
                            <Chip
                              label="sem custo"
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.62rem", borderColor: "#c98a2b", color: "#8a5a10" }}
                            />
                          );
                        }
                        const margem = p.preco > 0 ? ((p.preco - custo) / p.preco) * 100 : null;
                        return (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                            <Box component="span" sx={{ fontSize: "0.78rem", color: "#444" }}>
                              {formatBRL(custo)}
                            </Box>
                            {margem !== null && (
                              <Box component="span" sx={{ fontSize: "0.68rem", color: margem >= 0 ? "#0E7A3F" : "#b3261e", fontWeight: 600 }}>
                                margem {margem.toFixed(1)}%
                              </Box>
                            )}
                          </Box>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Chip label={p.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Inventory2 />}
                        label={p.estoque}
                        size="small"
                        color={p.estoque > 0 ? "default" : "error"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.ativo ? "Ativo" : "Inativo"}
                        size="small"
                        color={p.ativo ? "success" : "error"}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton sx={{ width: 44, height: 44 }} aria-label="Ver detalhes" size="small" onClick={() => router.push(`/produto/${p.id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title={p.ativo ? "Desativar (sai da loja)" : "Reativar na loja"}
                        onClick={() => alternarAtivo(p.id, p.ativo)}
                      >
                        {p.ativo ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                      <IconButton sx={{ width: 44, height: 44 }} aria-label="Editar" size="small" onClick={() => router.push(`/admin/produtos/${p.id}/edit`)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="Remover" size="small" onClick={() => setDeleteId(p.id)} sx={{ width: 44, height: 44, color: "#d32f2f" }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={pagina}
              onPageChange={(_, novaPagina) => setPagina(novaPagina)}
              rowsPerPage={porPagina}
              onRowsPerPageChange={(e) => { setPorPagina(parseInt(e.target.value, 10)); setPagina(0); }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Por página"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
          </TableContainer>
        )}
        <Dialog open={descontoAberto} onClose={() => setDescontoAberto(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Aplicar desconto</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.82rem", color: "#666", mb: 2 }}>
            Vai valer para <strong>{filtrados.length} produto(s)</strong> — exatamente o que está
            filtrado nesta tela. O preço com desconto aparece na vitrine, no carrinho e é o valor
            gravado no pedido.
          </Typography>

          <TextField
            size="small"
            type="number"
            label="Desconto (%)"
            value={descontoPercent}
            onChange={(e) => setDescontoPercent(e.target.value)}
            slotProps={{ htmlInput: { min: 0, max: 90, step: 0.5 } }}
            helperText="0 remove o desconto. Máximo 90%."
            fullWidth
          />

          {Number(descontoPercent) > 0 && (
            <Typography sx={{ fontSize: "0.75rem", color: "#0E7A3F", mt: 1.5 }}>
              Exemplo: peça de {formatBRL(100)} passa a {formatBRL(calcularPreco(100, Number(descontoPercent)).por)}.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDescontoAberto(false)} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            onClick={() => aplicarDesconto(0, filtrados.map((p) => p.id))}
            disabled={salvandoDesconto}
            sx={{ textTransform: "none", color: "#b3261e" }}
          >
            Remover desconto
          </Button>
          <Button
            variant="contained"
            onClick={() => aplicarDesconto(Number(descontoPercent), filtrados.map((p) => p.id))}
            disabled={salvandoDesconto || !descontoPercent}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
          >
            {salvandoDesconto ? "Aplicando…" : "Aplicar"}
          </Button>
        </DialogActions>
      </Dialog>
      </Container>

      {/* Custos em lote (#191) */}
      <Dialog open={custosAberto} onClose={() => setCustosAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Custos por SKU</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.82rem", color: "#666", mb: 2 }}>
            Cole a lista no formato <strong>SKU;custo</strong>, uma por linha (dá para colar direto
            do Excel, com tabulação). Custo vazio limpa o valor. O casamento é pelo SKU — nome do
            fornecedor não serve.
          </Typography>

          <TextField
            multiline
            minRows={6}
            fullWidth
            placeholder={"AMO-007;550,00\nCEN-001;1.240,50\nBOL-012;"}
            value={textoCustos}
            onChange={(e) => setTextoCustos(e.target.value)}
          />

          {resultadoCustos && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={resultadoCustos.naoEncontrados.length > 0 || resultadoCustos.erros.length > 0 ? "warning" : "success"}>
                {resultadoCustos.mensagem}
              </Alert>
              {resultadoCustos.naoEncontrados.length > 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "#666", mt: 1 }}>
                  SKU fora do catálogo: {resultadoCustos.naoEncontrados.slice(0, 30).join(", ")}
                  {resultadoCustos.naoEncontrados.length > 30 ? "…" : ""}
                </Typography>
              )}
              {resultadoCustos.erros.length > 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "#b3261e", mt: 1 }}>
                  Linhas recusadas: {resultadoCustos.erros.slice(0, 10).map((e) => `${e.linha} (${e.motivo})`).join(", ")}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCustosAberto(false)} sx={{ textTransform: "none" }}>
            Fechar
          </Button>
          <Button
            variant="contained"
            onClick={importarCustos}
            disabled={salvandoCustos || textoCustos.trim() === ""}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
          >
            {salvandoCustos ? "Gravando…" : "Gravar custos"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dado fiscal em lote (interface do emissor) */}
      <Dialog open={fiscalAberto} onClose={() => setFiscalAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Dado fiscal por SKU</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.82rem", color: "#666", mb: 1 }}>
            Cole no formato <strong>SKU;CSOSN;CFOP interno;CFOP externo</strong> — uma linha por peça.
            No Simples o CSOSN de revenda costuma ser <strong>102</strong>; CFOP interno 5102 e
            externo 6102 (confirme com o contador).
          </Typography>
          <TextField
            multiline
            minRows={6}
            fullWidth
            placeholder="AMO-007;102;5102;6102"
            value={textoFiscal}
            onChange={(e) => setTextoFiscal(e.target.value)}
          />
          {resultadoFiscal && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={resultadoFiscal.naoEncontrados.length || resultadoFiscal.erros.length ? "warning" : "success"}>
                {resultadoFiscal.mensagem}
              </Alert>
              {resultadoFiscal.naoEncontrados.length > 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "#666", mt: 1 }}>
                  SKU fora do catálogo: {resultadoFiscal.naoEncontrados.slice(0, 30).join(", ")}
                </Typography>
              )}
              {resultadoFiscal.erros.length > 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "#b3261e", mt: 1 }}>
                  Linhas recusadas: {resultadoFiscal.erros.slice(0, 10).map((e) => `${e.linha} (${e.motivo})`).join(", ")}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFiscalAberto(false)} sx={{ textTransform: "none" }}>Fechar</Button>
          <Button
            variant="contained"
            onClick={importarFiscal}
            disabled={salvandoFiscal || textoFiscal.trim() === ""}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
          >
            {salvandoFiscal ? "Gravando…" : "Gravar dado fiscal"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal excluir */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Desativar produto?</DialogTitle>
        <DialogContent>
          <Typography>
            O produto sai da loja na hora, mas continua cadastrado e pode ser
            reativado pelo ícone de olho na listagem. O histórico de pedidos não
            muda.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} sx={{ textTransform: "none" }}>Cancelar</Button>
          <Button onClick={excluir} color="error" variant="contained" sx={{ textTransform: "none" }}>Desativar</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
