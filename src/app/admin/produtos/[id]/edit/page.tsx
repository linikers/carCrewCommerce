"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { ArrowBack, Save } from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import GalleryUpload from "@/components/GalleryUpload";

const categorias = [
  { value: "compressores", label: "Compressores" },
  { value: "amortecedores", label: "Amortecedores" },
  { value: "bandejas", label: "Bandejas" },
  { value: "bolsas-de-ar", label: "Bolsas de Ar" },
  { value: "pontas-de-eixo", label: "Pontas de Eixo" },
  { value: "calcos-antirruido", label: "Calços Antirruído" },
  { value: "kits", label: "Kits" },
  { value: "componentes", label: "Componentes" },
  { value: "terminais", label: "Terminais de Direção" },
  { value: "controles", label: "Controles Bluetooth" },
];

export default function EditarProduto() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    imgUrl: "",
    galeria: [] as string[],
    galeriaPrincipal: 0,
    category: "acessorio-instalacao",
    parcelamento: "12",
    estoque: "0",
    peso: "",
    altura: "",
    largura: "",
    profundidade: "",
    veiculos: "",
    destaque: false,
    ordem: "0",
    ativo: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/produtos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError("Produto não encontrado");
          return;
        }
        setForm({
          nome: data.nome,
          descricao: data.descricao,
          preco: String(data.preco),
          imgUrl: data.imgUrl,
          galeria: Array.isArray(data.imagens) ? data.imagens : (data.galeria || []),
          galeriaPrincipal: 0,
          category: data.category,
          parcelamento: String(data.parcelamento),
          estoque: String(data.estoque),
          destaque: Boolean(data.destaque),
          ordem: String(data.ordem ?? 0),
          peso: data.peso != null ? String(data.peso) : "",
          altura: data.altura != null ? String(data.altura) : "",
          largura: data.largura != null ? String(data.largura) : "",
          profundidade: data.profundidade != null ? String(data.profundidade) : "",
          veiculos: Array.isArray(data.veiculos) ? data.veiculos.join(", ") : "",
          ativo: data.ativo,
        });
        setLoading(false);
      })
      .catch(() => setError("Erro ao carregar"));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`/api/admin/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          preco: parseFloat(form.preco),
          parcelamento: parseInt(form.parcelamento),
          estoque: parseInt(form.estoque),
          galeria: form.galeria,
          ordem: parseInt(form.ordem || "0"),
          destaque: Boolean(form.destaque),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao salvar");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/admin/produtos"), 1500);
    } catch {
      setError("Erro de conexão");
    }
  };

  return (
    <AdminLayout title="Editar produto">
      <Container maxWidth="md" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Breadcrumbs sx={{ mb: 2, fontSize: "0.85rem" }}>
          <MuiLink component="button" onClick={() => router.push("/admin")} underline="hover" sx={{ color: "#666" }}>Admin</MuiLink>
          <MuiLink component="button" onClick={() => router.push("/admin/produtos")} underline="hover" sx={{ color: "#666" }}>Produtos</MuiLink>
          <Typography variant="body2" sx={{ color: "#BF360C" }}>Editar</Typography>
        </Breadcrumbs>

        <Button startIcon={<ArrowBack />} onClick={() => router.back()}
          sx={{ textTransform: "none", color: "#666", mb: 2, "&:hover": { color: "#BF360C" } }}>
          Voltar
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Editar Produto</Typography>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress sx={{ color: "#BF360C" }} /></Box>
        ) : success ? (
          <Alert severity="success">Produto atualizado com sucesso! Redirecionando...</Alert>
        ) : error && !form.nome ? (
          <Alert severity="error">{error}</Alert>
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
                  <TextField fullWidth label="Parcelamento" type="number" value={form.parcelamento}
                    onChange={(e) => setForm({ ...form, parcelamento: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="Estoque" type="number" value={form.estoque}
                    onChange={(e) => setForm({ ...form, estoque: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField fullWidth label="Ordem na home" type="number" value={form.ordem}
                    helperText="Menor aparece antes"
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    onChange={(e) => setForm({ ...form, ordem: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }} sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Switch checked={form.destaque}
                        onChange={(e) => setForm({ ...form, destaque: e.target.checked })} />
                    }
                    label="Destaque na home"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField fullWidth label="Peso (g)" type="number" value={form.peso}
                    helperText="Para o cálculo do frete"
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    onChange={(e) => setForm({ ...form, peso: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField fullWidth label="Altura (cm)" type="number" value={form.altura}
                    slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                    onChange={(e) => setForm({ ...form, altura: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField fullWidth label="Largura (cm)" type="number" value={form.largura}
                    slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                    onChange={(e) => setForm({ ...form, largura: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField fullWidth label="Profundidade (cm)" type="number" value={form.profundidade}
                    slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                    onChange={(e) => setForm({ ...form, profundidade: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Aplicação veicular" value={form.veiculos}
                    helperText="Separe por vírgula: Gol, Voyage, Saveiro (2013 em diante). Aparece na página do produto."
                    onChange={(e) => setForm({ ...form, veiculos: e.target.value })} />
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
                  <TextField fullWidth label="URL da Imagem Principal" value={form.imgUrl}
                    onChange={(e) => setForm({ ...form, imgUrl: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CloudinaryUpload
                    onUpload={(url) => setForm({ ...form, imgUrl: url })}
                    label="Upload Imagem Principal"
                  />
                  {form.imgUrl && form.imgUrl.includes("cloudinary") && (
                    <Box sx={{ mt: 1 }}>
                      <Box component="img" src={form.imgUrl} sx={{ width: 100, height: 100, objectFit: "cover", borderRadius: 2 }} />
                    </Box>
                  )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <GalleryUpload
                    images={form.galeria}
                    onChange={(galeria) => setForm({ ...form, galeria })}
                    principalIndex={form.galeriaPrincipal}
                    onPrincipalChange={(idx) => setForm({ ...form, galeriaPrincipal: idx })}
                    maxImages={5}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel control={
                    <Switch checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
                  } label="Produto ativo" />
                </Grid>
              </Grid>

              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

              <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                <Button type="submit" variant="contained" startIcon={<Save />}
                  sx={{ backgroundColor: "#BF360C", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none" }}>
                  Salvar Alterações
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
