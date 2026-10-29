"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Slide,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowDownward,
  ArrowUpward,
  Delete,
  DragIndicator,
  OpenInNew,
  Save,
} from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";
import type { PaginaInstitucional, SlugInstitucional } from "@/lib/paginas-conteudo";

/**
 * Editor das páginas institucionais (#182).
 *
 * Três páginas em abas. Em cada uma: título, subtítulo, faixa de destaque
 * (Trocas) e as seções de texto. O formato do texto é o mesmo que o site
 * renderiza: linha em branco separa parágrafo, "- " cria lista, **negrito**.
 */
const ROTULOS: Record<SlugInstitucional, string> = {
  sobre: "Sobre",
  trocas: "Trocas e Devoluções",
  privacidade: "Privacidade",
};

export default function AdminPaginasPage() {
  const [paginas, setPaginas] = useState<PaginaInstitucional[]>([]);
  const [aba, setAba] = useState(0);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [destaque, setDestaque] = useState<string | null>(null);
  const [remover, setRemover] = useState<{ slug: SlugInstitucional; id: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/paginas")
      .then((r) => r.json())
      .then((d) => setPaginas(Array.isArray(d?.paginas) ? d.paginas : []))
      .catch(() => setErro("Não foi possível carregar as páginas."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!destaque) return;
    const el = document.getElementById(`secao-${destaque}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el.querySelector("input") as HTMLInputElement | null)?.focus({ preventScroll: true });
    }
    const t = setTimeout(() => setDestaque(null), 4000);
    return () => clearTimeout(t);
  }, [destaque]);

  const pagina = paginas[aba];

  const alterar = (campo: "titulo" | "subtitulo" | "destaque", valor: string) => {
    setPaginas((atual) => atual.map((p, i) => (i === aba ? { ...p, [campo]: valor } : p)));
    setMsg("");
  };

  const alterarSecao = (id: string, campo: "titulo" | "texto", valor: string) => {
    setPaginas((atual) =>
      atual.map((p, i) =>
        i === aba
          ? { ...p, secoes: p.secoes.map((s) => (s.id === id ? { ...s, [campo]: valor } : s)) }
          : p
      )
    );
    setMsg("");
  };

  const moverSecao = (indice: number, direcao: -1 | 1) => {
    setPaginas((atual) =>
      atual.map((p, i) => {
        if (i !== aba) return p;
        const lista = [...p.secoes];
        const destino = indice + direcao;
        if (destino < 0 || destino >= lista.length) return p;
        [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
        return { ...p, secoes: lista };
      })
    );
    setMsg("");
  };

  // Reordenar arrastando (#183 parte 2); as setas continuam.
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [sobre, setSobre] = useState<number | null>(null);
  // Ref: o drop pode chegar antes do state commitar.
  const origemArrasto = useRef<number | null>(null);

  const reordenarSecao = (de: number, para: number) => {
    if (de === para) return;
    setPaginas((atual) =>
      atual.map((p, i) => {
        if (i !== aba) return p;
        const lista = [...p.secoes];
        const [secao] = lista.splice(de, 1);
        lista.splice(para, 0, secao);
        return { ...p, secoes: lista };
      })
    );
    setMsg("");
  };

  const adicionarSecao = () => {
    const id = `${pagina.slug}-${Date.now()}`;
    setPaginas((atual) =>
      atual.map((p, i) =>
        i === aba
          ? { ...p, secoes: [...p.secoes, { id, titulo: "", texto: "" }] }
          : p
      )
    );
    setDestaque(id);
    setAviso("Seção adicionada. Preencha o título e o texto e clique em Salvar.");
  };

  const excluirSecao = (id: string) => {
    setPaginas((atual) =>
      atual.map((p, i) =>
        i === aba ? { ...p, secoes: p.secoes.filter((s) => s.id !== id) } : p
      )
    );
    setRemover(null);
    setAviso("Seção removida. Clique em Salvar para aplicar no site.");
  };

  const salvar = async () => {
    if (!pagina) return;
    setSalvando(true);
    setErro("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/paginas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pagina),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados?.error || "Não foi possível salvar.");
      setPaginas((atual) => atual.map((p, i) => (i === aba ? dados.pagina : p)));
      setMsg(`Página “${ROTULOS[pagina.slug]}” salva. O site já está usando.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AdminLayout title="Páginas do site">
      <Container maxWidth="md" sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 12, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Páginas do site
          </Typography>
          <Box sx={{ flex: 1 }} />
          {pagina && (
            <Button
              size="small"
              endIcon={<OpenInNew fontSize="small" />}
              href={`/${pagina.slug}`}
              target="_blank"
              sx={{ color: "#BF360C", textTransform: "none" }}
            >
              Ver página
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            startIcon={<Save fontSize="small" />}
            onClick={salvar}
            disabled={salvando || loading}
            sx={{ backgroundColor: "#BF360C", "&:hover": { backgroundColor: "#8f2809" }, textTransform: "none" }}
          >
            Salvar
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
          Texto de Sobre, Trocas e Privacidade. No texto: linha em branco separa parágrafo,
          linha começando com <strong>- </strong> vira item de lista e <strong>**texto**</strong> fica
          em negrito. {"{{telefone}}"} e {"{{email}}"} puxam o contato de “Minha empresa”.
        </Typography>

        <Tabs value={aba} onChange={(_, v) => { setAba(v); setMsg(""); setErro(""); }} sx={{ mb: 2 }}>
          {paginas.map((p) => (
            <Tab key={p.slug} label={ROTULOS[p.slug]} sx={{ textTransform: "none", fontWeight: 600 }} />
          ))}
        </Tabs>

        {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

        {loading || !pagina ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
              <TextField
                label="Título da página (H1)"
                size="small"
                fullWidth
                value={pagina.titulo}
                onChange={(e) => alterar("titulo", e.target.value)}
              />
              <TextField
                label="Subtítulo"
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                value={pagina.subtitulo}
                onChange={(e) => alterar("subtitulo", e.target.value)}
                helperText="Aparece abaixo do título. Deixe vazio para esconder."
              />
              <TextField
                label="Faixa de destaque (topo)"
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                value={pagina.destaque}
                onChange={(e) => alterar("destaque", e.target.value)}
                helperText="Usada em Trocas (prazo de 7 dias). Vazio esconde a faixa."
              />
            </Paper>

            <Stack spacing={2}>
              {pagina.secoes.map((secao, indice) => (
                <Paper
                  key={secao.id}
                  id={`secao-${secao.id}`}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: destaque === secao.id ? "2px solid #BF360C" : "1px solid #eee",
                    backgroundColor: destaque === secao.id ? "#FFF3E0" : "#fff",
                    transition: "border-color .2s ease, background-color .2s ease",
                  }}
                >
                  <Box
                    draggable
                    onDragStart={(e) => {
                      origemArrasto.current = indice;
                      setArrastando(indice);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDragEnter={() => setSobre(indice)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (origemArrasto.current !== null) {
                        reordenarSecao(origemArrasto.current, indice);
                      }
                      origemArrasto.current = null;
                      setArrastando(null);
                      setSobre(null);
                    }}
                    onDragEnd={() => {
                      origemArrasto.current = null;
                      setArrastando(null);
                      setSobre(null);
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 1.5,
                      cursor: "grab",
                      opacity: arrastando === indice ? 0.5 : 1,
                      borderTop: sobre === indice && arrastando !== null ? "2px dashed #BF360C" : "2px solid transparent",
                      pt: 0.5,
                    }}
                  >
                    <DragIndicator sx={{ fontSize: 18, color: "#bbb" }} />
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      Seção {indice + 1}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title="Subir">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Subir seção"
                          disabled={indice === 0}
                          onClick={() => moverSecao(indice, -1)}
                          sx={{ width: 40, height: 40 }}
                        >
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Descer">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Descer seção"
                          disabled={indice === pagina.secoes.length - 1}
                          onClick={() => moverSecao(indice, 1)}
                          sx={{ width: 40, height: 40 }}
                        >
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Remover seção">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Remover seção"
                        onClick={() => setRemover({ slug: pagina.slug, id: secao.id })}
                        sx={{ width: 40, height: 40 }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <TextField
                    label="Título da seção"
                    size="small"
                    fullWidth
                    value={secao.titulo}
                    onChange={(e) => alterarSecao(secao.id, "titulo", e.target.value)}
                  />
                  <TextField
                    label="Texto"
                    size="small"
                    fullWidth
                    multiline
                    minRows={6}
                    sx={{ mt: 2 }}
                    value={secao.texto}
                    onChange={(e) => alterarSecao(secao.id, "texto", e.target.value)}
                  />
                </Paper>
              ))}
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Button
              startIcon={<Add />}
              onClick={adicionarSecao}
              variant="contained"
              sx={{
                textTransform: "none",
                backgroundColor: "#BF360C",
                "&:hover": { backgroundColor: "#8f2809" },
                width: { xs: "100%", sm: "auto" },
                minHeight: 44,
              }}
            >
              Adicionar seção
            </Button>
            <Typography variant="caption" sx={{ display: "block", color: "#666", mt: 1 }}>
              A página atualiza na próxima visita, sem deploy.
            </Typography>
          </>
        )}
      </Container>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={6000}
        onClose={() => setAviso("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        slots={{ transition: Slide }}
        sx={{ mb: { xs: 9, md: 0 } }}
      >
        <Alert severity="info" onClose={() => setAviso("")} sx={{ width: "100%" }}>
          {aviso}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 1.5,
          backgroundColor: "#fff",
          borderTop: "1px solid #eee",
          boxShadow: "0 -4px 14px rgba(0,0,0,0.06)",
          zIndex: 1200,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          startIcon={<Save />}
          onClick={salvar}
          disabled={salvando || loading}
          sx={{ backgroundColor: "#BF360C", "&:hover": { backgroundColor: "#8f2809" }, minHeight: 48, textTransform: "none" }}
        >
          {salvando ? "Salvando..." : "Salvar página"}
        </Button>
      </Box>

      <Dialog open={remover !== null} onClose={() => setRemover(null)}>
        <DialogTitle>Remover esta seção?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            A seção sai da página. Se a ideia é só testar, salve antes uma cópia do texto.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemover(null)}>Cancelar</Button>
          <Button color="error" onClick={() => remover && excluirSecao(remover.id)}>
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
