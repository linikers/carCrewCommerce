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
  Divider,
  Chip,
} from "@mui/material";
import { Add, Edit, Delete, Article } from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";

interface ConteudoAdmin {
  slug: string;
  nome: string;
  personalizado: boolean;
  salvo: {
    titulo?: string;
    intro?: string;
    atencao?: string;
    landingLabel?: string;
    landingHref?: string;
  };
  padrao: {
    titulo: string;
    intro: string;
    atencao: string;
    landing?: { href: string; label: string };
  };
}

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
  const [form, setForm] = useState({ slug: "", nome: "", icone: "", descricao: "", ordem: "0" });
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Conteúdo da página de categoria (título, introdução, "Antes de comprar").
  const [conteudos, setConteudos] = useState<Record<string, ConteudoAdmin>>({});
  const [conteudoSlug, setConteudoSlug] = useState<string | null>(null);
  const [conteudoForm, setConteudoForm] = useState({
    titulo: "",
    intro: "",
    atencao: "",
    landingLabel: "",
    landingHref: "",
  });
  const [conteudoErro, setConteudoErro] = useState("");
  const [conteudoAviso, setConteudoAviso] = useState("");
  const [conteudoSalvando, setConteudoSalvando] = useState(false);

  const carregar = async () => {
    const [res, resConteudo] = await Promise.all([
      fetch("/api/admin/categorias"),
      fetch("/api/admin/categorias-conteudo"),
    ]);
    setCategorias(await res.json());
    if (resConteudo.ok) {
      const dados = await resConteudo.json();
      const mapa: Record<string, ConteudoAdmin> = {};
      for (const item of dados?.categorias ?? []) mapa[item.slug] = item;
      setConteudos(mapa);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Carregar no mount é o padrão desta tela; os setters acontecem depois do fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ slug: "", nome: "", icone: "", descricao: "", ordem: "0" });
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (cat: Categoria) => {
    setEditando(cat);
    setForm({ slug: cat.slug, nome: cat.nome, icone: cat.icone, descricao: cat.descricao, ordem: String(cat.ordem ?? 0) });
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
        body: JSON.stringify({ ...form, ordem: Number(form.ordem) || 0 }),
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

  const abrirConteudo = (cat: Categoria) => {
    const item = conteudos[cat.slug];
    setConteudoSlug(cat.slug);
    setConteudoErro("");
    setConteudoAviso("");
    setConteudoForm({
      titulo: item?.salvo.titulo ?? "",
      intro: item?.salvo.intro ?? "",
      atencao: item?.salvo.atencao ?? "",
      landingLabel: item?.salvo.landingLabel ?? "",
      landingHref: item?.salvo.landingHref ?? "",
    });
  };

  const salvarConteudo = async () => {
    if (!conteudoSlug) return;
    setConteudoSalvando(true);
    setConteudoErro("");
    setConteudoAviso("");
    try {
      const res = await fetch("/api/admin/categorias-conteudo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: conteudoSlug, ...conteudoForm }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados?.error || "Erro ao salvar");
      setConteudoAviso("Texto salvo. A página da categoria já está usando.");
      await carregar();
    } catch (e) {
      setConteudoErro(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setConteudoSalvando(false);
    }
  };

  return (
    <AdminLayout title="Categorias">
      <Container maxWidth="lg" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Categorias</Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              {categorias.length} categoria(s) cadastrada(s)
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={abrirNovo}
            sx={{ backgroundColor: "#BF360C", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none" }}>
            Nova Categoria
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress sx={{ color: "#BF360C" }} /></Box>
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
                    <TableCell sx={{ fontWeight: 500 }}>
                      {cat.nome}
                      {conteudos[cat.slug]?.personalizado && (
                        <Chip
                          size="small"
                          label="texto próprio"
                          sx={{ ml: 1, height: 18, fontSize: "0.6rem", backgroundColor: "#FFF3E0", color: "#BF360C" }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#666" }}>
                      {cat.descricao}
                    </TableCell>
                    <TableCell>
                      <IconButton sx={{ width: 44, height: 44 }} aria-label="Editar" size="small" onClick={() => abrirEditar(cat)} title="Editar categoria">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="Editar texto da página"
                        size="small"
                        onClick={() => abrirConteudo(cat)}
                        title="Editar texto da página"
                        sx={{ width: 44, height: 44, color: conteudos[cat.slug]?.personalizado ? "#BF360C" : "#555" }}
                      >
                        <Article fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="Remover" size="small" onClick={() => setDeleteId(cat.id)} sx={{ width: 44, height: 44, color: "#d32f2f" }}>
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
              <TextField label="Ícone" value={form.icone}
                helperText="Curto, ex.: ar, roda. Sem emoji."
                onChange={(e) => setForm({ ...form, icone: e.target.value })} />
              <TextField label="Ordem" type="number" value={form.ordem}
                helperText="Menor número aparece primeiro no menu da loja"
                onChange={(e) => setForm({ ...form, ordem: e.target.value })} />
              <TextField label="Descrição" multiline rows={2} value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              {error && <Alert severity="error">{error}</Alert>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained"
              sx={{ backgroundColor: "#BF360C", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none" }}>
              {editando ? "Salvar" : "Criar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal conteúdo da página */}
      <Dialog open={conteudoSlug !== null} onClose={() => setConteudoSlug(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Texto da página
          {conteudoSlug && (
            <Typography component="span" sx={{ display: "block", fontSize: "0.8rem", color: "#777", fontWeight: 400 }}>
              /categoria/{conteudoSlug} — deixe vazio para usar o texto atual do site
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Título (H1)"
              value={conteudoForm.titulo}
              placeholder={conteudoSlug ? conteudos[conteudoSlug]?.padrao.titulo : ""}
              onChange={(e) => setConteudoForm({ ...conteudoForm, titulo: e.target.value })}
              helperText="É o título que o Google lê como assunto da página"
            />
            <TextField
              label="Introdução"
              multiline
              minRows={3}
              value={conteudoForm.intro}
              placeholder={conteudoSlug ? conteudos[conteudoSlug]?.padrao.intro : ""}
              onChange={(e) => setConteudoForm({ ...conteudoForm, intro: e.target.value })}
            />
            <TextField
              label="Antes de comprar"
              multiline
              minRows={3}
              value={conteudoForm.atencao}
              placeholder={conteudoSlug ? conteudos[conteudoSlug]?.padrao.atencao : ""}
              onChange={(e) => setConteudoForm({ ...conteudoForm, atencao: e.target.value })}
              helperText="O bloco cinza com a dica de compra"
            />

            <Divider textAlign="left">
              <Typography variant="caption" sx={{ color: "#777" }}>
                Botão para a landing (opcional)
              </Typography>
            </Divider>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Texto do botão"
                size="small"
                value={conteudoForm.landingLabel}
                placeholder={conteudoSlug ? conteudos[conteudoSlug]?.padrao.landing?.label : ""}
                onChange={(e) => setConteudoForm({ ...conteudoForm, landingLabel: e.target.value })}
              />
              <TextField
                label="Link"
                size="small"
                value={conteudoForm.landingHref}
                placeholder={conteudoSlug ? conteudos[conteudoSlug]?.padrao.landing?.href : ""}
                onChange={(e) => setConteudoForm({ ...conteudoForm, landingHref: e.target.value })}
                helperText="Ex.: /suspensao-a-ar — vazio esconde o botão"
              />
            </Box>

            {conteudoErro && <Alert severity="error">{conteudoErro}</Alert>}
            {conteudoAviso && <Alert severity="success">{conteudoAviso}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConteudoSlug(null)}>Fechar</Button>
          <Button
            variant="contained"
            onClick={salvarConteudo}
            disabled={conteudoSalvando}
            sx={{ backgroundColor: "#BF360C", "&:hover": { bgcolor: "#8f2809" }, textTransform: "none" }}
          >
            {conteudoSalvando ? "Salvando…" : "Salvar texto"}
          </Button>
        </DialogActions>
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
