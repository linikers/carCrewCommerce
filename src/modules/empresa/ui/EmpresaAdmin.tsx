"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Save } from "@mui/icons-material";

/**
 * Dados da empresa em um lugar só (#os-pdf).
 *
 * Fonte única do que leva o nome da loja: PDF da OS, orçamento e nota fiscal.
 * A aba **Fiscal** edita a mesma tabela — não existe cadastro duplicado.
 * O CNPJ é opcional: quem cobra o dado é a emissão da nota, no momento de
 * emitir, nunca o cadastro.
 */

interface Empresa {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  logo: string;
  site: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
}

const VAZIA: Empresa = {
  razaoSocial: "Car Crew Garage",
  nomeFantasia: "Car Crew Garage",
  cnpj: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "Maringá",
  uf: "PR",
  cep: "",
  telefone: "44998133182",
  email: "",
  logo: "",
  site: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  youtube: "",
};

const LIMITE_LOGO = 400 * 1024;

export default function EmpresaAdmin() {
  const [empresa, setEmpresa] = useState<Empresa>(VAZIA);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");
  const arquivoRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/admin/empresa");
      const d = await res.json();
      if (d?.empresa) {
        const redes = d.empresa.redesSociais ?? {};
        const simples: Record<string, string> = {};

        for (const [chave, valor] of Object.entries(d.empresa)) {
          if (valor === null || valor === undefined) continue;
          if (typeof valor === "object") continue;
          simples[chave] = String(valor);
        }

        setEmpresa({
          ...VAZIA,
          ...simples,
          site: redes.site ?? "",
          instagram: redes.instagram ?? "",
          facebook: redes.facebook ?? "",
          tiktok: redes.tiktok ?? "",
          youtube: redes.youtube ?? "",
        } as Empresa);
      }
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // Carregar no mount é o padrão desta tela (o formulário nasce vazio e é
    // preenchido com o cadastro); o setState acontece depois do fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, []);

  function escolherLogo(arquivo: File | undefined) {
    setErro("");
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/jpeg")) {
      setErro("O logo precisa ser JPG. Converta a imagem antes de enviar.");
      return;
    }
    if (arquivo.size > LIMITE_LOGO) {
      setErro("Logo muito grande (máximo 400 KB). Reduza antes de enviar.");
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => setEmpresa((e) => ({ ...e, logo: String(leitor.result) }));
    leitor.readAsDataURL(arquivo);
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      const { site, instagram, facebook, tiktok, youtube, ...resto } = empresa;
      const res = await fetch("/api/admin/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...resto,
          redesSociais: { site, instagram, facebook, tiktok, youtube },
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao salvar");
      setAviso(
        "Dados salvos. O site, o PDF da OS e o orçamento já usam estas informações."
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const campo = (chave: keyof Empresa, rotulo: string, extra: Record<string, unknown> = {}) => (
    <TextField
      size="small"
      label={rotulo}
      value={empresa[chave]}
      onChange={(e) => setEmpresa({ ...empresa, [chave]: e.target.value })}
      fullWidth
      {...extra}
    />
  );

  const titulo = (texto: string, sub?: string) => (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{texto}</Typography>
      {sub && <Typography sx={{ fontSize: "0.76rem", color: "#777" }}>{sub}</Typography>}
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 920 }}>
      <Alert severity="info" sx={{ mb: 3, fontSize: "0.82rem" }}>
        Aqui ficam a identidade e o contato da loja — o que aparece no site, no
        PDF da OS e no orçamento. <strong>CNPJ, inscrições, regime, série e
        numeração da nota são da aba Fiscal</strong>, para as duas telas não
        sobrescreverem uma à outra.
      </Alert>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        {titulo("Identificação", "Como a empresa aparece no documento")}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {campo("razaoSocial", "Razão social")}
          {campo("nomeFantasia", "Nome fantasia")}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        {titulo("Contato e redes", "Aparecem no cabeçalho do PDF")}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {campo("telefone", "WhatsApp / telefone", { helperText: "Só números, com DDD" })}
          {campo("email", "E-mail")}
          {campo("site", "Site", { placeholder: "carcrew.com.br" })}
          {campo("instagram", "Instagram", { placeholder: "@carcrewgarage" })}
          {campo("facebook", "Facebook")}
          {campo("tiktok", "TikTok")}
          {campo("youtube", "YouTube")}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        {titulo("Endereço")}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" }, gap: 2 }}>
          {campo("logradouro", "Rua")}
          {campo("numero", "Número")}
          {campo("cep", "CEP")}
          {campo("complemento", "Complemento")}
          {campo("bairro", "Bairro")}
          {campo("cidade", "Cidade")}
          {campo("uf", "UF")}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        {titulo("Logo", "JPG, até 400 KB — aparece no topo do PDF")}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          {empresa.logo ? (
            <Box
              component="img"
              src={empresa.logo}
              alt="Logo atual"
              sx={{ width: 96, height: 96, objectFit: "contain", border: "1px solid #e0e0e0", borderRadius: 2, backgroundColor: "#fff" }}
            />
          ) : (
            <Box sx={{ width: 96, height: 96, border: "1px dashed #ccc", borderRadius: 2, display: "grid", placeItems: "center", color: "#999", fontSize: "0.7rem" }}>
              sem logo
            </Box>
          )}

          <input
            ref={arquivoRef}
            type="file"
            accept="image/jpeg"
            hidden
            onChange={(e) => escolherLogo(e.target.files?.[0])}
          />
          <Button variant="outlined" onClick={() => arquivoRef.current?.click()} sx={{ textTransform: "none" }}>
            Escolher JPG
          </Button>
          {empresa.logo && (
            <Button
              onClick={() => setEmpresa({ ...empresa, logo: "" })}
              sx={{ textTransform: "none", color: "#b3261e" }}
            >
              Remover
            </Button>
          )}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        {titulo("Dados fiscais", "CNPJ, inscrições, regime e numeração da nota")}
        <Typography sx={{ fontSize: "0.85rem", color: "#555", mb: 2 }}>
          {empresa.cnpj
            ? `CNPJ cadastrado: ${empresa.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}`
            : "CNPJ ainda não cadastrado."}
        </Typography>
        <Button
          variant="outlined"
          href="/admin/fiscal"
          sx={{ textTransform: "none" }}
        >
          Abrir cadastro fiscal
        </Button>
        <Typography sx={{ fontSize: "0.78rem", color: "#777", mt: 1.5 }}>
          O certificado A1 e a política de emissão também ficam lá.
        </Typography>
      </Paper>

      {erro && <Alert severity="error" sx={{ mb: 2, fontSize: "0.82rem" }}>{erro}</Alert>}
      {aviso && <Alert severity="success" sx={{ mb: 2, fontSize: "0.82rem" }}>{aviso}</Alert>}

      <Button
        variant="contained"
        startIcon={<Save />}
        onClick={salvar}
        disabled={salvando}
        sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
      >
        {salvando ? "Salvando…" : "Salvar dados"}
      </Button>
    </Box>
  );
}
