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
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
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

export default function NovoProduto() {
  const router = useRouter();
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
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validação campo a campo: antes só "Nome e preço são obrigatórios"
    // aparecia no rodapé, longe do campo errado. Negativo e zero passavam.
    const erros: Record<string, string> = {};

    if (!form.nome.trim()) erros.nome = "Informe o nome do produto";

    const preco = Number(form.preco);
    if (!form.preco || !Number.isFinite(preco) || preco <= 0) {
      erros.preco = "Preço deve ser maior que zero";
    }

    const estoque = Number(form.estoque);
    if (form.estoque !== "" && (!Number.isInteger(estoque) || estoque < 0)) {
      erros.estoque = "Estoque deve ser um número inteiro, zero ou mais";
    }

    const parcelas = Number(form.parcelamento);
    if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 12) {
      erros.parcelamento = "De 1 a 12 parcelas";
    }

    if (!form.category) erros.category = "Escolha a categoria";

    setFieldErrors(erros);
    if (Object.keys(erros).length > 0) {
      setError("Revise os campos destacados");
      return;
    }

    try {
      setSalvando(true);
      const res = await fetch("/api/admin/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          preco: parseFloat(form.preco),
          parcelamento: parseInt(form.parcelamento),
          estoque: parseInt(form.estoque),
          galeria: form.galeria,
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
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AdminLayout title="Novo produto">
      <Container maxWidth="md" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Breadcrumbs sx={{ mb: 2, fontSize: "0.85rem" }}>
          <MuiLink component="button" onClick={() => router.push("/admin")} underline="hover" sx={{ color: "#666" }}>
            Admin
          </MuiLink>
          <MuiLink component="button" onClick={() => router.push("/admin/produtos")} underline="hover" sx={{ color: "#666" }}>
            Produtos
          </MuiLink>
          <Typography variant="body2" sx={{ color: "#BF360C" }}>Novo</Typography>
        </Breadcrumbs>

        <Button startIcon={<ArrowBack />} onClick={() => router.back()}
          sx={{ textTransform: "none", color: "#666", mb: 2, "&:hover": { color: "#BF360C" } }}>
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
                    error={Boolean(fieldErrors.nome)}
                    helperText={fieldErrors.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Descrição" multiline rows={3} value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="Preço (R$)" required type="number" value={form.preco}
                    error={Boolean(fieldErrors.preco)}
                    helperText={fieldErrors.preco || "Use ponto para centavos: 1299.90"}
                    slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="Parcelamento (máx)" type="number" value={form.parcelamento}
                    error={Boolean(fieldErrors.parcelamento)}
                    helperText={fieldErrors.parcelamento}
                    slotProps={{ htmlInput: { min: 1, max: 12, step: 1 } }}
                    onChange={(e) => setForm({ ...form, parcelamento: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="Estoque" type="number" value={form.estoque}
                    error={Boolean(fieldErrors.estoque)}
                    helperText={fieldErrors.estoque}
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    onChange={(e) => setForm({ ...form, estoque: e.target.value })} />
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
                    error={Boolean(fieldErrors.category)}
                    helperText={fieldErrors.category}
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
              </Grid>

              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

              <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                <Button type="submit" variant="contained" disabled={salvando}
                  startIcon={salvando ? <CircularProgress size={18} color="inherit" /> : <Save />}
                  sx={{ backgroundColor: "#BF360C", "&:hover": { bgcolor: "#8C2A09" }, textTransform: "none" }}>
                  {salvando ? "Salvando..." : "Salvar Produto"}
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
