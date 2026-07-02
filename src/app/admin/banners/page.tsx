"use client";

import { useState, useEffect } from "react";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, CircularProgress, Alert, Chip,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";
import CloudinaryUpload from "@/components/CloudinaryUpload";

interface Banner {
  id: number; titulo: string; subtitulo: string; link: string;
  imgDesktop: string; imgMobile: string;
  corFundo: string; corTexto: string; ativo: boolean; ordem: number;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Banner | null>(null);
  const [form, setForm] = useState({
    titulo: "", subtitulo: "", link: "",
    imgDesktop: "", imgMobile: "",
    corFundo: "#1A1A1A", corTexto: "#ffffff", ativo: true,
  });
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const carregar = async () => {
    const data = await (await fetch("/api/admin/banners")).json();
    setBanners(data);
    setLoading(false);
  };
  useEffect(() => { carregar(); }, []);

  const resetForm = () => ({
    titulo: "", subtitulo: "", link: "",
    imgDesktop: "", imgMobile: "",
    corFundo: "#1A1A1A", corTexto: "#ffffff", ativo: true,
  });

  const abrirNovo = () => {
    setEditando(null);
    setForm(resetForm());
    setError(""); setModalOpen(true);
  };

  const abrirEditar = (b: Banner) => {
    setEditando(b);
    setForm({
      titulo: b.titulo, subtitulo: b.subtitulo || "", link: b.link || "",
      imgDesktop: b.imgDesktop || "", imgMobile: b.imgMobile || "",
      corFundo: b.corFundo, corTexto: b.corTexto, ativo: b.ativo,
    });
    setError(""); setModalOpen(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.titulo) { setError("Título é obrigatório"); return; }
    try {
      const url = editando ? `/api/admin/banners/${editando.id}` : "/api/admin/banners";
      const res = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      setModalOpen(false); carregar();
    } catch { setError("Erro de conexão"); }
  };

  const excluir = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/banners/${deleteId}`, { method: "DELETE" });
    setDeleteId(null); carregar();
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Banners</Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>{banners.length} banner(s)</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={abrirNovo}
            sx={{ backgroundColor: "#E65100", textTransform: "none" }}>Novo Banner</Button>
        </Box>
        {loading ? <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress sx={{ color: "#E65100" }} /></Box> : (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead><TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 600 }}>Ordem</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Imagem</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Link</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ativo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ações</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {banners.sort((a,b) => a.ordem - b.ordem).map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell>{b.ordem}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{b.titulo}</TableCell>
                    <TableCell>
                      {b.imgDesktop ? (
                        <Box
                          component="img"
                          src={b.imgDesktop}
                          alt={b.titulo}
                          sx={{ width: 120, height: 45, objectFit: "cover", borderRadius: 1, border: "1px solid #e0e0e0" }}
                        />
                      ) : (
                        <Chip label={b.corFundo} size="small" sx={{ bgcolor: b.corFundo, color: b.corTexto }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#666" }}>{b.link || "—"}</TableCell>
                    <TableCell><Chip label={b.ativo ? "Sim" : "Não"} size="small" color={b.ativo ? "success" : "default"} /></TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => abrirEditar(b)}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setDeleteId(b.id)} sx={{ color: "#d32f2f" }}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {/* Modal Criar/Editar */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={salvar}>
          <DialogTitle>{editando ? "Editar Banner" : "Novo Banner"}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField label="Título" required value={form.titulo} onChange={(e) => setForm({...form, titulo: e.target.value})} />
              <TextField label="Subtítulo" value={form.subtitulo} onChange={(e) => setForm({...form, subtitulo: e.target.value})} />
              <TextField label="Link" value={form.link} onChange={(e) => setForm({...form, link: e.target.value})} helperText="URL para onde o banner leva" />

              {/* Upload Imagem Desktop */}
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Imagem Desktop (1600×600)</Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <CloudinaryUpload
                    onUpload={(url) => setForm({...form, imgDesktop: url})}
                    label="Upload Desktop"
                  />
                  {form.imgDesktop && (
                    <Box
                      component="img"
                      src={form.imgDesktop}
                      alt="Preview"
                      sx={{ width: 120, height: 45, objectFit: "cover", borderRadius: 1, border: "1px solid #e0e0e0" }}
                    />
                  )}
                </Box>
                <TextField
                  size="small"
                  placeholder="Ou cole a URL da imagem"
                  value={form.imgDesktop}
                  onChange={(e) => setForm({...form, imgDesktop: e.target.value})}
                  sx={{ mt: 0.5 }}
                  fullWidth
                />
              </Box>

              {/* Upload Imagem Mobile */}
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Imagem Mobile (800×400)</Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <CloudinaryUpload
                    onUpload={(url) => setForm({...form, imgMobile: url})}
                    label="Upload Mobile"
                  />
                  {form.imgMobile && (
                    <Box
                      component="img"
                      src={form.imgMobile}
                      alt="Preview"
                      sx={{ width: 120, height: 45, objectFit: "cover", borderRadius: 1, border: "1px solid #e0e0e0" }}
                    />
                  )}
                </Box>
                <TextField
                  size="small"
                  placeholder="Ou cole a URL da imagem"
                  value={form.imgMobile}
                  onChange={(e) => setForm({...form, imgMobile: e.target.value})}
                  sx={{ mt: 0.5 }}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField label="Cor de fundo" value={form.corFundo} onChange={(e) => setForm({...form, corFundo: e.target.value})} sx={{ flex: 1 }} />
                <TextField label="Cor do texto" value={form.corTexto} onChange={(e) => setForm({...form, corTexto: e.target.value})} sx={{ flex: 1 }} />
              </Box>
              <FormControlLabel control={<Switch checked={form.ativo} onChange={(e) => setForm({...form, ativo: e.target.checked})} />} label="Banner ativo" />
              {error && <Alert severity="error">{error}</Alert>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: "#E65100", textTransform: "none" }}>{editando ? "Salvar" : "Criar"}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Excluir banner?</DialogTitle>
        <DialogContent><Typography>Esta ação não pode ser desfeita.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button onClick={excluir} color="error" variant="contained">Excluir</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
