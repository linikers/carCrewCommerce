"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { ArrowBack, Save } from "@mui/icons-material";
import Header from "@/components/Header";
import AdminLayout from "@/components/admin/AdminLayout";

const categorias = [
  { value: "amortecedores", label: "Amortecedores" },
  { value: "calco-antirruido", label: "Calço Antirruído" },
  { value: "ponta-de-eixo", label: "Ponta de Eixo" },
  { value: "bolsa-de-ar", label: "Bolsa de Ar" },
  { value: "acessorio-instalacao", label: "Acessórios" },
  { value: "mola-suspensao", label: "Molas" },
];

export default function NovoProduto() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    imgUrl: "",
    category: "acessorio-instalacao",
    parcelamento: "12",
    estoque: "0",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nome || !form.preco) {
      setError("Nome e preço são obrigatórios");
      return;
    }

    try {
      const res = await fetch("/api/admin/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          preco: parseFloat(form.preco),
          parcelamento: parseInt(form.parcelamento),
          estoque: parseInt(form.estoque),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/admin/produtos"), 1500);
    } catch {
      setError("Erro de conexão");
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="md" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Breadcrumbs sx={{ mb: 2, fontSize: "0.85rem" }}>
          <MuiLink component="button" onClick={() => router.push("/admin")} underline="hover" sx={{ color: "#666" }}>
            Admin
          </MuiLink>
          <MuiLink component="button" onClick={() => router.push("/admin/produtos")} underline="hover" sx={{ color: "#666" }}>
            Produtos
          </MuiLink>
          <Typography variant="body2" sx={{ color: "#E65100" }}>Novo</Typography>
        </Breadcrumbs>

        <Button startIcon={<ArrowBack />} onClick={() => router.back()}
          sx={{ textTransform: "none", color: "#666", mb: 2, "&:hover": { color: "#E65100" } }}>
          Voltar
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Novo Produto</Typography>

        {success ? (
          <Alert severity="success">Produto criado com sucesso! Redirecionando...</Alert>
        ) : (
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Nome do Produto" required value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Descrição" multiline rows={3} value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="Preço (R$)" required type="number" value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="Parcelamento (máx)" type="number" value={form.parcelamento}
                    onChange={(e) => setForm({ ...form, parcelamento: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="Estoque" type="number" value={form.estoque}
                    onChange={(e) => setForm({ ...form, estoque: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth select label="Categoria" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categorias.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="URL da Imagem" value={form.imgUrl}
                    onChange={(e) => setForm({ ...form, imgUrl: e.target.value })} />
                </Grid>
              </Grid>

              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

              <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                <Button type="submit" variant="contained" startIcon={<Save />}
                  sx={{ backgroundColor: "#E65100", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none" }}>
                  Salvar Produto
                </Button>
                <Button variant="outlined" onClick={() => router.push("/admin/produtos")}
                  sx={{ textTransform: "none" }}>Cancelar</Button>
              </Box>
            </form>
          </Paper>
        )}
      </Container>
    </AdminLayout>
  );
}
