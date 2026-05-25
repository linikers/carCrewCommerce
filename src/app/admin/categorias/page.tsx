"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Add, Edit, Delete, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import Header from "@/components/Header";
import AdminLayout from "@/components/admin/AdminLayout";

interface Categoria {
  id: number;
  slug: string;
  nome: string;
  icone: string;
  descricao: string;
  ordem: number;
}

export default function AdminCategorias() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm] = useState({ slug: "", nome: "", icone: "", descricao: "" });
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const carregar = async () => {
    const res = await fetch("/api/admin/categorias");
    setCategorias(await res.json());
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ slug: "", nome: "", icone: "", descricao: "" });
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (cat: Categoria) => {
    setEditando(cat);
    setForm({ slug: cat.slug, nome: cat.nome, icone: cat.icone, descricao: cat.descricao });
    setError("");
    setModalOpen(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.slug || !form.nome) {
      setError("Slug e nome são obrigatórios");
      return;
    }

    try {
      const url = editando
        ? `/api/admin/categorias/${editando.id}`
        : "/api/admin/categorias";
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao salvar");
        return;
      }

      setModalOpen(false);
      carregar();
    } catch {
      setError("Erro de conexão");
    }
  };

  const excluir = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/categorias/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    carregar();
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Categorias</Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              {categorias.length} categoria(s) cadastrada(s)
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={abrirNovo}
            sx={{ backgroundColor: "#E65100", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none" }}>
            Nova Categoria
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress sx={{ color: "#E65100" }} /></Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Ordem</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ícone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Slug</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categorias.sort((a, b) => a.ordem - b.ordem).map((cat) => (
                  <TableRow key={cat.id} hover>
                    <TableCell>{cat.ordem}</TableCell>
                    <TableCell sx={{ fontSize: "1.5rem" }}>{cat.icone}</TableCell>
                    <TableCell><code>{cat.slug}</code></TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{cat.nome}</TableCell>
                    <TableCell sx={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#666" }}>
                      {cat.descricao}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => abrirEditar(cat)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteId(cat.id)} sx={{ color: "#d32f2f" }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {/* Modal criar/editar */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={salvar}>
          <DialogTitle>{editando ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField label="Slug" required value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                helperText="Identificador único (ex: amortecedores)" />
              <TextField label="Nome" required value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              <TextField label="Ícone (emoji)" value={form.icone}
                onChange={(e) => setForm({ ...form, icone: e.target.value })}
                helperText="Emoji para exibir na loja (ex: 🔧)" />
              <TextField label="Descrição" multiline rows={2} value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              {error && <Alert severity="error">{error}</Alert>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained"
              sx={{ backgroundColor: "#E65100", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none" }}>
              {editando ? "Salvar" : "Criar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal excluir */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Excluir categoria?</DialogTitle>
        <DialogContent>
          <Typography>Esta ação não pode ser desfeita.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button onClick={excluir} color="error" variant="contained">Excluir</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
