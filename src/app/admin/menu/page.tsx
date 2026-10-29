"use client";

import { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Snackbar,
} from "@mui/material";
import {
  Add,
  Delete,
  ArrowUpward,
  ArrowDownward,
  DragIndicator,
  OpenInNew,
  Save,
} from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";
import type { ItemMenu } from "@/lib/menu-loja";

type Grupo = "barra" | "solucoes";

interface CategoriaAdmin {
  id: number;
  slug: string;
  nome: string;
  ordem: number;
}

interface ConfigTela {
  barra: ItemMenu[];
  solucoes: ItemMenu[];
  categoriasOcultas: string[];
}

const VAZIO: ConfigTela = { barra: [], solucoes: [], categoriasOcultas: [] };

const rotuloGrupo: Record<Grupo, string> = {
  barra: "Barra do topo",
  solucoes: 'Menu "Soluções"',
};

const ajudaGrupo: Record<Grupo, string> = {
  barra:
    "Links que ficam soltos na faixa escura, ao lado das categorias. Por padrão, só o Blog.",
  solucoes:
    "Itens do menu suspenso Soluções. É o lugar das páginas de solução (suspensão a ar, rebaixados, off-road...).",
};

export default function AdminMenuPage() {
  const [config, setConfig] = useState<ConfigTela>(VAZIO);
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [remover, setRemover] = useState<{ grupo: Grupo; id: string } | null>(null);
  // Feedback de quem está mexendo no menu: sem isso o item novo entra fora da
  // tela e o dono não sabe se a ação funcionou.
  const [destaque, setDestaque] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/menu").then((r) => r.json()),
      fetch("/api/categorias").then((r) => r.json()),
    ])
      .then(([cfg, cats]) => {
        setConfig({
          barra: Array.isArray(cfg?.barra) ? cfg.barra : [],
          solucoes: Array.isArray(cfg?.solucoes) ? cfg.solucoes : [],
          categoriasOcultas: Array.isArray(cfg?.categoriasOcultas)
            ? cfg.categoriasOcultas
            : [],
        });
        setCategorias(Array.isArray(cats) ? cats : []);
      })
      .catch(() => setErro("Não foi possível carregar o menu."))
      .finally(() => setLoading(false));
  }, []);

  const alterarItem = (
    grupo: Grupo,
    id: string,
    campo: keyof ItemMenu,
    valor: string | boolean
  ) => {
    setConfig((atual) => ({
      ...atual,
      [grupo]: atual[grupo].map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      ),
    }));
    setMsg("");
  };

  // Reordenar arrastando (#183 parte 2); as setas continuam.
  const [arrastando, setArrastando] = useState<{ grupo: Grupo; indice: number } | null>(null);
  const [sobre, setSobre] = useState<{ grupo: Grupo; indice: number } | null>(null);
  // Ref: o drop pode chegar antes do state commitar.
  const origemArrasto = useRef<{ grupo: Grupo; indice: number } | null>(null);

  const reordenar = (grupo: Grupo, de: number, para: number) => {
    if (de === para) return;
    setConfig((atual) => {
      const lista = [...atual[grupo]];
      const [item] = lista.splice(de, 1);
      lista.splice(para, 0, item);
      return { ...atual, [grupo]: lista.map((i, n) => ({ ...i, ordem: n })) };
    });
    setMsg("");
  };

  const mover = (grupo: Grupo, indice: number, direcao: -1 | 1) => {
    setConfig((atual) => {
      const lista = [...atual[grupo]];
      const destino = indice + direcao;
      if (destino < 0 || destino >= lista.length) return atual;
      [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
      return { ...atual, [grupo]: lista.map((i, n) => ({ ...i, ordem: n })) };
    });
    setMsg("");
  };

  const novoId = (grupo: Grupo) => {
    const usados = new Set(config[grupo].map((i) => i.id));
    let n = config[grupo].length + 1;
    while (usados.has(`item-${n}`)) n += 1;
    return `item-${n}`;
  };

  const adicionar = (grupo: Grupo) => {
    const novo: ItemMenu = {
      id: novoId(grupo),
      rotulo: "",
      href: "",
      descricao: "",
      ativo: true,
      ordem: config[grupo].length,
    };
    setConfig((atual) => ({ ...atual, [grupo]: [...atual[grupo], novo] }));
    setMsg("");
    setErro("");
    setDestaque(novo.id);
    setAviso(
      `Item adicionado em “${rotuloGrupo[grupo]}”. Preencha nome e link e clique em Salvar para aparecer no site.`
    );
  };

  const excluir = (grupo: Grupo, id: string) => {
    setConfig((atual) => ({
      ...atual,
      [grupo]: atual[grupo]
        .filter((i) => i.id !== id)
        .map((i, n) => ({ ...i, ordem: n })),
    }));
    setRemover(null);
    setMsg("");
    setAviso("Item removido. Clique em Salvar para aplicar na loja.");
  };

  const alternarCategoria = (slug: string, mostrar: boolean) => {
    setConfig((atual) => ({
      ...atual,
      categoriasOcultas: mostrar
        ? atual.categoriasOcultas.filter((s) => s !== slug)
        : Array.from(new Set([...atual.categoriasOcultas, slug])),
    }));
    setMsg("");
  };

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    setMsg("");
    try {
      const resposta = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados?.error || "Não foi possível salvar.");
        return;
      }
      setConfig({
        barra: dados.barra ?? [],
        solucoes: dados.solucoes ?? [],
        categoriasOcultas: dados.categoriasOcultas ?? [],
      });
      setMsg("Menu salvo. A loja já está usando esta configuração.");
    } catch {
      setErro("Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  // Rola até o item recém-adicionado e coloca o cursor no nome. Antes ele
  // nascia no fim da lista, fora da tela.
  useEffect(() => {
    if (!destaque) return;
    const el = document.getElementById(`item-${destaque}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const campo = el.querySelector("input") as HTMLInputElement | null;
      campo?.focus({ preventScroll: true });
    }
    const t = setTimeout(() => setDestaque(null), 4000);
    return () => clearTimeout(t);
  }, [destaque]);

  const renderGrupo = (grupo: Grupo) => (
    <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {rotuloGrupo[grupo]}
          </Typography>
          <Typography variant="body2" sx={{ color: "#666" }}>
            {ajudaGrupo[grupo]}
          </Typography>
        </Box>
        <Button
          startIcon={<Add />}
          onClick={() => adicionar(grupo)}
          variant="contained"
          sx={{
            textTransform: "none",
            backgroundColor: "#BF360C",
            "&:hover": { backgroundColor: "#8f2809" },
            width: { xs: "100%", sm: "auto" },
            minHeight: 44,
          }}
        >
          Adicionar item
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      {config[grupo].length === 0 ? (
        <Typography variant="body2" sx={{ color: "#666" }}>
          Nenhum item nesta parte do menu.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {config[grupo].map((item, indice) => (
            <Box
              key={item.id}
              id={`item-${item.id}`}
              sx={{
                border: destaque === item.id ? "2px solid #BF360C" : "1px solid #eee",
                backgroundColor: destaque === item.id ? "#FFF3E0" : item.ativo ? "#fff" : "#fafafa",
                borderRadius: 2,
                p: 2,
                transition: "border-color .2s ease, background-color .2s ease",
              }}
            >
              <Box
                draggable
                onDragStart={(e) => {
                  origemArrasto.current = { grupo, indice };
                  setArrastando({ grupo, indice });
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragEnter={() => setSobre({ grupo, indice })}
                onDrop={(e) => {
                  e.preventDefault();
                  const origem = origemArrasto.current;
                  if (origem && origem.grupo === grupo) {
                    reordenar(grupo, origem.indice, indice);
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
                  gap: 1,
                  mb: 1.5,
                  cursor: "grab",
                  opacity: arrastando?.grupo === grupo && arrastando.indice === indice ? 0.5 : 1,
                  borderTop:
                    sobre?.grupo === grupo && sobre.indice === indice && arrastando
                      ? "2px dashed #BF360C"
                      : "2px solid transparent",
                  pt: 0.5,
                }}
              >
                <DragIndicator sx={{ fontSize: 18, color: "#bbb" }} />
                <Chip
                  size="small"
                  label={item.ativo ? "no menu" : "desligado"}
                  sx={{
                    backgroundColor: item.ativo ? "#E8F5E9" : "#EEEEEE",
                    color: item.ativo ? "#1B5E20" : "#555",
                    fontWeight: 600,
                  }}
                />
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Subir">
                  <span>
                    <IconButton size="small" disabled={indice === 0} onClick={() => mover(grupo, indice, -1)}>
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Descer">
                  <span>
                    <IconButton
                      size="small"
                      disabled={indice === config[grupo].length - 1}
                      onClick={() => mover(grupo, indice, 1)}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Remover item">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setRemover({ grupo, id: item.id })}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "220px 1fr" },
                }}
              >
                <TextField
                  label="Nome do item"
                  size="small"
                  value={item.rotulo}
                  onChange={(e) => alterarItem(grupo, item.id, "rotulo", e.target.value)}
                  placeholder="Rebaixados"
                />
                <TextField
                  label="Link"
                  size="small"
                  value={item.href}
                  onChange={(e) => alterarItem(grupo, item.id, "href", e.target.value)}
                  placeholder="/rebaixamento"
                  helperText="Caminho do site (/rebaixamento) ou endereço completo (https://...)"
                />
              </Box>
              <TextField
                label="Descrição do item"
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                value={item.descricao}
                onChange={(e) => alterarItem(grupo, item.id, "descricao", e.target.value)}
                placeholder="Altura baixa sem perder conforto"
                helperText="Linha de apoio que aparece no menu suspenso e no menu do celular"
              />
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Switch
                    checked={item.ativo}
                    onChange={(e) => alterarItem(grupo, item.id, "ativo", e.target.checked)}
                  />
                }
                label="Aparecer no menu"
              />
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );

  return (
    <AdminLayout title="Menu da loja">
      <Container maxWidth="md" sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 12, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Menu da loja
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            endIcon={<OpenInNew fontSize="small" />}
            href="/"
            target="_blank"
            sx={{ color: "#BF360C" }}
          >
            Ver o site
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Save fontSize="small" />}
            onClick={salvar}
            disabled={salvando || loading}
            sx={{ backgroundColor: "#BF360C", "&:hover": { backgroundColor: "#8f2809" } }}
          >
            Salvar
          </Button>
        </Box>
        <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
          Aqui você monta o menu que aparece no topo do site: renomeia, explica
          para onde leva, desliga (some do site sem apagar o cadastro) ou remove
          o item. Categoria desligada continua com a página no ar — só sai do
          menu.
        </Typography>

        {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            {renderGrupo("barra")}
            {renderGrupo("solucoes")}

            <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Categorias de produto
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                Desligar tira a categoria do menu do site. A página
                /categoria/... e os produtos continuam funcionando.
              </Typography>
              {categorias.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#666" }}>
                  Nenhuma categoria cadastrada.
                </Typography>
              ) : (
                <Stack divider={<Divider flexItem />} spacing={1}>
                  {categorias.map((cat) => {
                    const visivel = !config.categoriasOcultas.includes(cat.slug);
                    return (
                      <Box
                        key={cat.slug}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: { xs: 1, md: 2 },
                          flexWrap: { xs: "wrap", md: "nowrap" },
                        }}
                      >
                        <Typography sx={{ flex: 1, minWidth: 0, fontSize: "0.95rem" }}>
                          {cat.nome}
                        </Typography>
                        {/* o slug come 120 px no celular e empurra a chave para fora */}
                        <Typography
                          variant="caption"
                          sx={{ color: "#888", display: { xs: "none", sm: "block" } }}
                        >
                          /categoria/{cat.slug}
                        </Typography>
                        <FormControlLabel
                          sx={{ m: 0 }}
                          control={
                            <Switch
                              checked={visivel}
                              onChange={(e) => alternarCategoria(cat.slug, e.target.checked)}
                            />
                          }
                          label={visivel ? "Aparecer no menu" : "Oculta no menu"}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={salvar}
                disabled={salvando}
                sx={{ backgroundColor: "#BF360C", "&:hover": { backgroundColor: "#8f2809" } }}
              >
                {salvando ? "Salvando..." : "Salvar menu"}
              </Button>
              <Typography variant="caption" sx={{ color: "#666" }}>
                O menu do site atualiza na próxima visita à página, sem deploy.
              </Typography>
            </Box>
          </>
        )}
      </Container>

      {/* Aviso de cada ação (adicionar, remover). Sem isso o item novo nascia
          abaixo da dobra e parecia que nada tinha acontecido. */}
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

      {/* No celular o "Salvar" do topo sai da tela na primeira rolagem. */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 1.5,
          gap: 1,
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
          {salvando ? "Salvando..." : "Salvar menu"}
        </Button>
      </Box>

      <Dialog open={remover !== null} onClose={() => setRemover(null)}>
        <DialogTitle>Remover item do menu?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            O item sai da lista. Se a ideia é esconder por um tempo, use a chave
            &quot;Aparecer no menu&quot; — o cadastro fica guardado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemover(null)}>Cancelar</Button>
          <Button
            color="error"
            onClick={() => remover && excluir(remover.grupo, remover.id)}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
