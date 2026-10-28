import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatBRL, formatData } from "@/lib/format";
import { STATUS_LABEL, type StatusPedido } from "@/lib/pedido-status";
import { Box, Chip, Container, Divider, Paper, Typography, Button } from "@mui/material";
import Header from "@/components/Header";
import { lerContatoEmpresaCache } from "@/lib/empresa";
import { linkWhatsApp } from "@/lib/empresa-contato";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acompanhar pedido",
  robots: { index: false, follow: false },
};

const ETAPAS: { status: StatusPedido; rotulo: string; descricao: string }[] = [
  { status: "aguardando_pagamento", rotulo: "Pedido recebido", descricao: "Aguardando o pagamento via PIX" },
  { status: "pago", rotulo: "Pagamento confirmado", descricao: "Recebemos o pagamento" },
  { status: "em_separacao", rotulo: "Em separação", descricao: "Estamos separando as peças" },
  { status: "enviado", rotulo: "Enviado", descricao: "Saiu para entrega" },
  { status: "entregue", rotulo: "Entregue", descricao: "Pedido concluído" },
];

export default async function PedidoPage(props: { params: Promise<{ id: string }> }) {
  const contato = await lerContatoEmpresaCache();
  const { id } = await props.params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      itens: { orderBy: { criadoEm: "asc" } },
    },
  });

  if (!pedido) notFound();

  // #72: item relacional; pedido antigo ainda lê o JSON
  const itens =
    pedido.itens.length > 0
      ? pedido.itens.map((i) => ({
          nome: i.nome,
          preco: i.preco,
          quantidade: i.quantidade,
        }))
      : ((pedido.items as { nome: string; preco: number; quantidade: number }[]) || []);
  const endereco = (pedido.enderecoEntrega || null) as
    | { logradouro?: string; numero?: string; bairro?: string; cidade?: string; uf?: string; cep?: string }
    | null;

  const cancelado = pedido.status === "cancelado";
  const indiceAtual = ETAPAS.findIndex((e) => e.status === pedido.status);
  const nomeCliente = pedido.clienteNome || pedido.user?.name || null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container maxWidth="md" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 800, color: "#1A1A1A", mb: 0.5 }}>
          Pedido #{pedido.id.slice(-6).toUpperCase()}
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
          Feito em {formatData(pedido.createdAt)}
          {nomeCliente ? ` · ${nomeCliente}` : ""}
        </Typography>

        {/* Status */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {STATUS_LABEL[pedido.status as StatusPedido] ?? pedido.status}
            </Typography>
            {cancelado && <Chip size="small" color="error" label="Cancelado" />}
          </Box>

          {cancelado ? (
            <Typography variant="body2" sx={{ color: "#666" }}>
              Este pedido foi cancelado. Se você já pagou, fale com a gente no WhatsApp para
              combinarmos o estorno.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {ETAPAS.map((etapa, i) => {
                const feito = i <= indiceAtual;
                return (
                  <Box key={etapa.status} sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          mt: 0.5,
                          backgroundColor: feito ? "primary.main" : "#e0e0e0",
                          flexShrink: 0,
                        }}
                      />
                      {i < ETAPAS.length - 1 && (
                        <Box
                          sx={{
                            width: 2,
                            flex: 1,
                            minHeight: 26,
                            backgroundColor: i < indiceAtual ? "primary.main" : "#e0e0e0",
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ pb: i < ETAPAS.length - 1 ? 2 : 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: feito ? 700 : 500, color: feito ? "#1A1A1A" : "#8a8a8a" }}
                      >
                        {etapa.rotulo}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#8a8a8a" }}>
                        {etapa.descricao}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          {pedido.status === "aguardando_pagamento" && (
            <Box sx={{ mt: 2.5, p: 2, backgroundColor: "#fff8f2", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: "#8a4b22" }}>
                O pedido é separado assim que o PIX cai. Se já pagou, mande o comprovante no
                WhatsApp que a gente confirma na hora.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Itens */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Itens
          </Typography>
          {itens.map((item, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ color: "#333" }}>
                {item.nome} <Box component="span" sx={{ color: "#888" }}>x{item.quantidade}</Box>
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                {formatBRL(item.preco * item.quantidade)}
              </Typography>
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
          {pedido.frete ? (
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" sx={{ color: "#666" }}>Frete</Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>{formatBRL(pedido.frete)}</Typography>
            </Box>
          ) : null}
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
              {formatBRL(pedido.total)}
            </Typography>
          </Box>
        </Paper>

        {/* Entrega */}
        {endereco && (
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Entrega
            </Typography>
            <Typography variant="body2" sx={{ color: "#444" }}>
              {[endereco.logradouro, endereco.numero, endereco.bairro, endereco.cidade, endereco.uf]
                .filter(Boolean)
                .join(", ")}
            </Typography>
            {endereco.cep && (
              <Typography variant="body2" sx={{ color: "#666" }}>
                CEP {endereco.cep}
              </Typography>
            )}
          </Paper>
        )}

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            href={linkWhatsApp(
              contato.telefone,
              `Olá! Sobre o pedido #${pedido.id.slice(-6).toUpperCase()}`
            )}
            target="_blank"
            sx={{ textTransform: "none", fontWeight: 600, backgroundColor: "#0E7A3F", "&:hover": { backgroundColor: "#0a5c2f" } }}
          >
            Falar no WhatsApp
          </Button>
          <Button href="/" variant="outlined" sx={{ textTransform: "none" }}>
            Continuar comprando
          </Button>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}
