"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  Delete,
  OpenInNew,
  Restore,
  Save,
} from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";
import { serializar, useAlteracoesNaoSalvas } from "@/lib/useAlteracoesNaoSalvas";
import type { ConteudoLp } from "@/lib/lp-conteudo";

interface PaginaLp {
  slug: string;
  nome: string;
  href: string;
  extras?: ("selo" | "tituloDestaque")[];
  personalizado: boolean;
  conteudo: ConteudoLp;
  original: ConteudoLp;
}

/** Contador de caractere do campo que o Google corta. */
function Contador({ atual, limite }: { atual: number; limite: number }) {
  const cor = atual > limite ? "#C62828" : "#777";
  return (
    <Typography variant="caption" sx={{ color: cor }}>
      {atual}/{limite}
    </Typography>
  );
}

export default function AdminLpEditorPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const [pagina, setPagina] = useState<PaginaLp | null>(null);
  const [conteudo, setConteudo] = useState<ConteudoLp | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  /** JSON do que veio do banco: base do aviso de alteração não salva (#183). */
  const [snapshot, setSnapshot] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch("/api/admin/lp")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("falha"))))
      .then((d) => {
        const encontrada = (d?.paginas ?? []).find(
          (p: PaginaLp) => p.slug === slug
        );
        if (!encontrada) {
          setErro("Página não encontrada.");
          return;
        }
        setPagina(encontrada);
        setConteudo(encontrada.conteudo);
        setSnapshot(serializar(encontrada.conteudo));
      })
      .catch(() => setErro("Não foi possível carregar a página."))
      .finally(() => setLoading(false));
  }, [slug]);

  const alterar = (campo: keyof ConteudoLp, valor: string) => {
    setConteudo((atual) => (atual ? { ...atual, [campo]: valor } : atual));
    setMsg("");
  };

  const alterarNaLista = (
    campo: "intro" | "servicos",
    indice: number,
    valor: string
  ) => {
    setConteudo((atual) => {
      if (!atual) return atual;
      const lista = [...atual[campo]];
      lista[indice] = valor;
      return { ...atual, [campo]: lista };
    });
    setMsg("");
  };

  const adicionarNaLista = (campo: "intro" | "servicos") => {
    setConteudo((atual) =>
      atual ? { ...atual, [campo]: [...atual[campo], ""] } : atual
    );
    setMsg("");
  };

  const removerDaLista = (campo: "intro" | "servicos", indice: number) => {
    setConteudo((atual) => {
      if (!atual) return atual;
      const lista = atual[campo].filter((_, i) => i !== indice);
      return { ...atual, [campo]: lista.length > 0 ? lista : [""] };
    });
    setMsg("");
  };

  const alterarBeneficio = (
    indice: number,
    campo: "titulo" | "texto",
    valor: string
  ) => {
    setConteudo((atual) => {
      if (!atual) return atual;
      const lista = atual.beneficios.map((b, i) =>
        i === indice ? { ...b, [campo]: valor } : b
      );
      return { ...atual, beneficios: lista };
    });
    setMsg("");
  };

  const adicionarBeneficio = () => {
    setConteudo((atual) =>
      atual
        ? { ...atual, beneficios: [...atual.beneficios, { titulo: "", texto: "" }] }
        : atual
    );
    setMsg("");
  };

  const removerBeneficio = (indice: number) => {
    setConteudo((atual) => {
      if (!atual) return atual;
      const lista = atual.beneficios.filter((_, i) => i !== indice);
      return {
        ...atual,
        beneficios: lista.length > 0 ? lista : [{ titulo: "", texto: "" }],
      };
    });
    setMsg("");
  };

  // Avisa antes de sair com alteração pendente (#183).
  useAlteracoesNaoSalvas(
    snapshot !== "" && conteudo !== null && serializar(conteudo) !== snapshot
  );

  const salvar = async () => {
    if (!conteudo) return;
    setSalvando(true);
    setErro("");
    setMsg("");
    try {
      const resposta = await fetch("/api/admin/lp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, conteudo }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados?.error || "Não foi possível salvar.");
        return;
      }
      setConteudo(dados.conteudo);
      setSnapshot(serializar(dados.conteudo));
      setPagina((p) => (p ? { ...p, personalizado: true, conteudo: dados.conteudo } : p));
      setMsg("Página salva. Abra a página no site para conferir.");
    } catch {
      setErro("Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const restaurarOriginal = () => {
    if (!pagina) return;
    setConteudo(pagina.original);
    setMsg(
      "Texto original carregado no formulário. Clique em Salvar para voltar ao que está no código."
    );
  };

  return (
    <AdminLayout title={pagina ? pagina.nome : "Página de solução"}>
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
        <Button
          startIcon={<ArrowBack />}
          href="/admin/lp"
          size="small"
          sx={{ mb: 2, color: "#555" }}
        >
          Páginas de solução
        </Button>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : erro && !conteudo ? (
          <Alert severity="error">{erro}</Alert>
        ) : (
          conteudo &&
          pagina && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {pagina.nome}
                </Typography>
                <Chip2 personalizado={pagina.personalizado} />
                <Box sx={{ flex: 1 }} />
                <Button
                  size="small"
                  endIcon={<OpenInNew fontSize="small" />}
                  href={pagina.href}
                  target="_blank"
                >
                  Ver página
                </Button>
              </Box>
              <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
                Edite o texto que aparece em {pagina.href}. Campo vazio volta ao
                texto original da página.
              </Typography>

              {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
              {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

              <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Topo da página
                </Typography>
                <Stack spacing={2}>
                  {pagina.extras?.includes("selo") && (
                    <TextField
                      label="Etiqueta acima do título"
                      fullWidth
                      value={conteudo.selo ?? ""}
                      onChange={(e) => alterar("selo", e.target.value)}
                      helperText="Frase curta em maiúsculas na tarja laranja"
                    />
                  )}
                  <TextField
                    label={pagina.extras?.includes("tituloDestaque") ? "Título (1ª linha)" : "Título (H1)"}
                    fullWidth
                    value={conteudo.titulo}
                    onChange={(e) => alterar("titulo", e.target.value)}
                    helperText="É o título que o Google lê como assunto da página"
                  />
                  {pagina.extras?.includes("tituloDestaque") && (
                    <TextField
                      label="Título (2ª linha, em laranja)"
                      fullWidth
                      value={conteudo.tituloDestaque ?? ""}
                      onChange={(e) => alterar("tituloDestaque", e.target.value)}
                    />
                  )}

                  <Divider textAlign="left">
                    <Typography variant="caption" sx={{ color: "#777" }}>
                      Parágrafos de introdução
                    </Typography>
                  </Divider>
                  {conteudo.intro.map((paragrafo, indice) => (
                    <Box key={indice} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TextField
                        multiline
                        minRows={3}
                        fullWidth
                        label={`Parágrafo ${indice + 1}`}
                        value={paragrafo}
                        onChange={(e) => alterarNaLista("intro", indice, e.target.value)}
                      />
                      <Tooltip title="Remover parágrafo">
                        <IconButton sx={{ width: 44, height: 44 }}
                          onClick={() => removerDaLista("intro", indice)}
                          aria-label="Remover parágrafo"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                  <Button startIcon={<Add />} size="small" onClick={() => adicionarNaLista("intro")}>
                    Adicionar parágrafo
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Benefícios
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                  Os blocos com ícone. Deixe quatro para o layout fechar na mesma
                  linha.
                </Typography>
                <Stack spacing={2}>
                  {conteudo.beneficios.map((beneficio, indice) => (
                    <Box
                      key={indice}
                      sx={{ border: "1px solid #eee", borderRadius: 2, p: 2 }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: "#777" }}>
                          Benefício {indice + 1}
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Tooltip title="Remover benefício">
                          <IconButton sx={{ width: 44, height: 44 }}
                            size="small"
                            color="error"
                            onClick={() => removerBeneficio(indice)}
                            aria-label="Remover benefício"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <TextField
                        label="Título do benefício"
                        size="small"
                        fullWidth
                        value={beneficio.titulo}
                        onChange={(e) => alterarBeneficio(indice, "titulo", e.target.value)}
                      />
                      <TextField
                        label="Explicação"
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                        sx={{ mt: 1.5 }}
                        value={beneficio.texto}
                        onChange={(e) => alterarBeneficio(indice, "texto", e.target.value)}
                      />
                    </Box>
                  ))}
                  <Button startIcon={<Add />} size="small" onClick={adicionarBeneficio}>
                    Adicionar benefício
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Serviços
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                  Lista do bloco escuro. Uma linha por serviço.
                </Typography>
                <Stack spacing={1.5}>
                  {conteudo.servicos.map((servico, indice) => (
                    <Box key={indice} sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={servico}
                        onChange={(e) => alterarNaLista("servicos", indice, e.target.value)}
                        placeholder="Ex.: Alinhamento e balanceamento"
                      />
                      <Tooltip title="Remover serviço">
                        <IconButton sx={{ width: 44, height: 44 }}
                          onClick={() => removerDaLista("servicos", indice)}
                          aria-label="Remover serviço"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                  <Button startIcon={<Add />} size="small" onClick={() => adicionarNaLista("servicos")}>
                    Adicionar serviço
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Chamada final (WhatsApp)
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Título da chamada"
                    fullWidth
                    value={conteudo.ctaTitulo}
                    onChange={(e) => alterar("ctaTitulo", e.target.value)}
                  />
                  <TextField
                    label="Texto da chamada"
                    fullWidth
                    multiline
                    minRows={2}
                    value={conteudo.ctaTexto}
                    onChange={(e) => alterar("ctaTexto", e.target.value)}
                  />
                  <TextField
                    label="Mensagem que já vai escrita no WhatsApp"
                    fullWidth
                    multiline
                    minRows={2}
                    value={conteudo.whatsMensagem}
                    onChange={(e) => alterar("whatsMensagem", e.target.value)}
                    helperText="O cliente abre a conversa com esta frase pronta"
                  />
                </Stack>
              </Paper>

              <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Google
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <TextField
                      label="Título no resultado de busca"
                      fullWidth
                      value={conteudo.seoTitulo}
                      onChange={(e) => alterar("seoTitulo", e.target.value)}
                    />
                    <Contador atual={conteudo.seoTitulo.length} limite={60} />
                  </Box>
                  <Box>
                    <TextField
                      label="Descrição no resultado de busca"
                      fullWidth
                      multiline
                      minRows={2}
                      value={conteudo.seoDescricao}
                      onChange={(e) => alterar("seoDescricao", e.target.value)}
                    />
                    <Contador atual={conteudo.seoDescricao.length} limite={160} />
                  </Box>
                </Stack>
              </Paper>

              {/* Barra fixa: o formulário é longo e o dono não pode rolar até
                  o fim só para salvar (nem perder a alteração por esquecer). */}
              <Paper
                elevation={4}
                sx={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  p: 1.5,
                  mb: 2,
                  borderTop: "1px solid #eee",
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={salvar}
                  disabled={salvando}
                  sx={{ backgroundColor: "#BF360C", "&:hover": { backgroundColor: "#8f2809" } }}
                >
                  {salvando ? "Salvando..." : "Salvar página"}
                </Button>
                <Button
                  startIcon={<Restore />}
                  onClick={restaurarOriginal}
                  sx={{ color: "#555" }}
                >
                  Voltar ao texto original
                </Button>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: "#777" }}>
                  A página pública atualiza na próxima visita
                </Typography>
              </Paper>
            </>
          )
        )}
      </Container>
    </AdminLayout>
  );
}

function Chip2({ personalizado }: { personalizado: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        fontSize: "0.7rem",
        fontWeight: 700,
        px: 1,
        py: 0.25,
        borderRadius: 1,
        backgroundColor: personalizado ? "#FFF3E0" : "#EEEEEE",
        color: personalizado ? "#BF360C" : "#555",
      }}
    >
      {personalizado ? "texto próprio" : "texto original"}
    </Box>
  );
}
