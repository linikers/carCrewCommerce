"use client";

import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/format";
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
  Inventory2,
} from "@mui/icons-material";
import Header from "@/components/Header";
import AdminLayout from "@/components/admin/AdminLayout";

interface Produto {
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
  const [ordemPor, setOrdemPor] = useState<"id" | "nome" | "preco" | "estoque">("id");
  const [ordemDir, setOrdemDir] = useState<"asc" | "desc">("desc");

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

  useEffect(() => { carregar(); }, []);

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
        <Header />
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

  const filtrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase())
  );

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
    <AdminLayout>
      <Container maxWidth="lg" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Produtos</Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              {produtos.length} produto(s) cadastrado(s)
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push("/admin/produtos/novo")}
            sx={{ backgroundColor: "#BF360C", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none" }}
          >
            Novo Produto
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPagina(0); }}
          sx={{ mb: 3 }}
        />

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
                    <TableSortLabel active={ordemPor === "id"} direction={ordemPor === "id" ? ordemDir : "asc"} onClick={() => mudarOrdem("id")}>ID</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} sortDirection={ordemPor === "nome" ? ordemDir : false}>
                    <TableSortLabel active={ordemPor === "nome"} direction={ordemPor === "nome" ? ordemDir : "asc"} onClick={() => mudarOrdem("nome")}>Nome</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} sortDirection={ordemPor === "preco" ? ordemDir : false}>
                    <TableSortLabel active={ordemPor === "preco"} direction={ordemPor === "preco" ? ordemDir : "asc"} onClick={() => mudarOrdem("preco")}>Preço</TableSortLabel>
                  </TableCell>
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
                    <TableCell>#{p.id}</TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.nome}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#BF360C" }}>
                      {formatBRL(p.preco)}
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
                      <IconButton size="small" onClick={() => router.push(`/produto/${p.id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/admin/produtos/${p.id}/edit`)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteId(p.id)} sx={{ color: "#d32f2f" }}>
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
      </Container>

      {/* Modal excluir */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Excluir produto?</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza? Esta ação não pode ser desfeita.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button onClick={excluir} color="error" variant="contained">Excluir</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
