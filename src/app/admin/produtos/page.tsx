"use client";

import { useState, useEffect } from "react";
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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
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

  const carregar = async () => {
    const res = await fetch("/api/admin/produtos");
    const data = await res.json();
    setProdutos(data);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const excluir = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/produtos/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    carregar();
  };

  if (status === "unauthenticated" || (status === "authenticated" && !session?.user?.admin)) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <Container sx={{ flex: 1, py: 8, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Acesso restrito</Typography>
          <Button variant="contained" onClick={() => router.push("/admin/login")}
            sx={{ mt: 2, backgroundColor: "#E65100", textTransform: "none" }}>
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
            sx={{ backgroundColor: "#E65100", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none" }}
          >
            Novo Produto
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
        />

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#E65100" }} />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Preço</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estoque</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrados.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>#{p.id}</TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.nome}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#E65100" }}>
                      R$ {p.preco.toFixed(2)}
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
