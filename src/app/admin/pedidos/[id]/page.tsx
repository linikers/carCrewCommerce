"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  CheckCircle,
  LocalShipping,
  Cancel,
  History,
  WhatsApp,
  Email,
} from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";
import ResultadoDaVenda from "@/components/admin/ResultadoDaVenda";
import { labelStatus, STATUS_COLOR } from "@/lib/pedido-status";
import { formatBRL } from "@/lib/format";
import { formatarDocumento } from "@/lib/documento";

interface PedidoItem {
  nome: string;
  preco: number;
  quantidade: number;
  /** só existe no item novo (#72); pedido antigo não tem */
  sku?: string | null;
  imgUrl?: string | null;
  /** custo da peça no fechamento (#191); null = não informado */
  custoUnitario?: number | null;
}

interface Pedido {
  id: string;
  userId: string;
  items?: PedidoItem[];
  itens?: {
    id: string;
    nome: string;
    sku: string | null;
    preco: number;
    quantidade: number;
    total: number;
    custoUnitario?: number | null;
  }[];
  total: number;
  status: string;
  // custo da venda (#191)
  canal?: string;
  comissao?: number | null;
  comissaoPercent?: number | null;
  freteVendedor?: number | null;
  imposto?: number | null;
  impostoPercent?: number | null;
  embalagem?: number | null;
  ads?: number | null;
  resultado?: number | null;
  margemPercent?: number | null;
  custosOrigem?: string;
  vendaEm?: string | null;
  createdAt: string;
  updatedAt: string;
  frete?: number | null;
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  clienteEmail?: string | null;
  clienteDocumento?: string | null;
  enderecoEntrega?: {
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    bairro?: string | null;
    cidade?: string | null;
  } | null;
  user?: { id: string; name: string | null; email: string | null };
  historico?: {
    em: string;
    acao: string;
    de: string | null;
    para: string | null;
    usuario: string;
  }[];
}

const MAPA_STATUS: Record<string, string> = {
  pendente: "aguardando_pagamento",
  preparando: "em_separacao",
  confirmado: "pago",
};

const statusColors: Record<string, "warning" | "info" | "primary" | "success" | "error"> = {
  pendente: "warning",
  pago: "info",
  preparando: "primary",
  enviado: "primary",
  entregue: "success",
  cancelado: "error",
};

export default function PedidoDetalhe() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
    if (authStatus === "authenticated" && !session?.user?.admin) {
      router.push("/");
      return;
    }
    if (authStatus === "authenticated" && id) {
      carregarPedido();
    }
  }, [authStatus, session, id]);

  async function carregarPedido() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/pedidos/${id}`);
      if (!res.ok) throw new Error("Pedido não encontrado");
      const data = await res.json();
      setPedido(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function alterarStatus(novoStatus: string) {
    if (!pedido) return;
    try {
      setUpdating(true);
      setError("");
      const res = await fetch("/api/admin/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pedido.id, status: novoStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar");
      }
      await carregarPedido();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdating(false);
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Contato com o cliente (#122 — versão barata): abre o WhatsApp ou o e-mail
  // com uma mensagem pronta do status atual. Não guarda a conversa; histórico
  // de mensagens depende de decisão de canal (ver #122).
  const soDigitos = (valor?: string | null) => (valor || "").replace(/\D/g, "");

  const telefoneParaWhatsApp = (valor?: string | null) => {
    const d = soDigitos(valor);
    if (!d) return null;
    return d.length <= 11 ? `55${d}` : d;
  };

  const mensagemDoStatus = (p: Pedido) => {
    const numero = p.id.slice(-6).toUpperCase();
    const nome = (p.clienteNome || p.user?.name || "").split(" ")[0] || "tudo bem";
    const valor = formatPrice(p.total);
    const base: Record<string, string> = {
      pendente: `Olá ${nome}! Recebemos seu pedido #${numero} (${valor}) na Car Crew Garage. Podemos confirmar o pagamento?`,
      aguardando_pagamento: `Olá ${nome}! Seu pedido #${numero} (${valor}) está aguardando o pagamento. Se precisar de ajuda com o PIX, me chama aqui.`,
      pago: `Olá ${nome}! Pagamento do pedido #${numero} confirmado. Já estamos separando as peças.`,
      em_separacao: `Olá ${nome}! Seu pedido #${numero} está sendo separado e sai para envio em breve.`,
      enviado: `Olá ${nome}! Seu pedido #${numero} foi enviado. Assim que tiver o rastreio, te mando aqui.`,
      entregue: `Olá ${nome}! Seu pedido #${numero} consta como entregue. Se ficou alguma dúvida na instalação, é só falar.`,
      cancelado: `Olá ${nome}! Seu pedido #${numero} foi cancelado. Se quiser, refaço o pedido com você por aqui.`,
    };
    return base[p.status] || `Olá ${nome}! Falando sobre o seu pedido #${numero} na Car Crew Garage.`;
  };

  const emailDoCliente = (p: Pedido) => p.user?.email || p.clienteEmail || null;

  if (authStatus === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user?.admin) return null;

  const proximoStatus = (): { status: string; label: string; color: "info" | "success"; icon: React.ReactNode } | null => {
    if (!pedido) return null;
    // acompanha o vocabulário de src/lib/pedido-status.ts
    const map: Record<string, { status: string; label: string; color: "info" | "success"; icon: React.ReactNode }> = {
      pendente: { status: "pago", label: "Marcar como Pago", color: "info", icon: <CheckCircle /> },
      aguardando_pagamento: { status: "pago", label: "Marcar como Pago", color: "info", icon: <CheckCircle /> },
      pago: { status: "em_separacao", label: "Separar para envio", color: "info", icon: <LocalShipping /> },
      em_separacao: { status: "enviado", label: "Marcar como Enviado", color: "info", icon: <LocalShipping /> },
      enviado: { status: "entregue", label: "Marcar como Entregue", color: "success", icon: <LocalShipping /> },
    };
    return map[pedido.status] || null;
  };

  // Links de contato prontos (#122). Sem telefone/e-mail válido, o botão fica
  // desabilitado — melhor do que abrir uma conversa sem destino.
  const numeroCliente = pedido ? telefoneParaWhatsApp(pedido.clienteTelefone) : null;
  const linkWhatsApp =
    pedido && numeroCliente
      ? `https://wa.me/${numeroCliente}?text=${encodeURIComponent(mensagemDoStatus(pedido))}`
      : null;

  const emailCliente = pedido ? emailDoCliente(pedido) : null;
  const linkEmail = pedido && emailCliente
    ? `mailto:${emailCliente}?subject=${encodeURIComponent(
        `Pedido #${pedido.id.slice(-6).toUpperCase()} — Car Crew Garage`
      )}&body=${encodeURIComponent(mensagemDoStatus(pedido))}`
    : null;

  return (
    <>
      <AdminLayout title="Pedido">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push("/admin/pedidos")}
            sx={{ mb: 2, color: "#BF360C" }}
          >
            Voltar para Pedidos
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : !pedido ? (
            <Alert severity="warning">Pedido não encontrado</Alert>
          ) : (
            <>
              {/* Cabeçalho */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
                      Pedido #{pedido.id.slice(-6).toUpperCase()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
                      Criado em {formatDate(pedido.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Chip
                      label={labelStatus(pedido.status)}
                      color={STATUS_COLOR[pedido.status as keyof typeof STATUS_COLOR] ?? "default"}
                      sx={{ fontWeight: 600, fontSize: "0.85rem", py: 1 }}
                    />
                  </Box>
                </Box>
              </Paper>

              {/* Cliente */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1A1A1A" }}>
                  Cliente
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      Nome
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {pedido.clienteNome || pedido.user?.name || "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {pedido.user?.email || "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      Telefone
                    </Typography>
                    <Typography variant="body1">
                      {pedido.clienteTelefone || "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      E-mail do pedido
                    </Typography>
                    <Typography variant="body1">
                      {pedido.clienteEmail || "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ color: "#888" }}>
                      CPF / CNPJ
                    </Typography>
                    <Typography variant="body1">
                      {pedido.clienteDocumento
                        ? formatarDocumento(pedido.clienteDocumento)
                        : "—"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Contato com o cliente (#122) */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: "#1A1A1A" }}>
                  Falar com o cliente
                </Typography>
                <Typography variant="body2" sx={{ color: "#777", mb: 2 }}>
                  Abre a conversa com a mensagem do status atual já escrita. O histórico da conversa não fica no pedido.
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  {linkWhatsApp ? (
                    <Button
                      variant="contained"
                      startIcon={<WhatsApp />}
                      href={linkWhatsApp}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ backgroundColor: "#25D366", "&:hover": { backgroundColor: "#1eb257" }, textTransform: "none" }}
                    >
                      WhatsApp
                    </Button>
                  ) : (
                    <Button variant="contained" startIcon={<WhatsApp />} disabled sx={{ textTransform: "none" }}>
                      Sem telefone
                    </Button>
                  )}

                  {linkEmail ? (
                    <Button
                      variant="outlined"
                      startIcon={<Email />}
                      href={linkEmail}
                      sx={{ textTransform: "none", borderColor: "#BF360C", color: "#BF360C" }}
                    >
                      E-mail
                    </Button>
                  ) : (
                    <Button variant="outlined" startIcon={<Email />} disabled sx={{ textTransform: "none" }}>
                      Sem e-mail
                    </Button>
                  )}
                </Box>
              </Paper>

              {/* Entrega — 6.1 */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1A1A1A" }}>
                  Entrega
                </Typography>
                {pedido.enderecoEntrega ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    <Box sx={{ flex: "2 1 320px" }}>
                      <Typography variant="caption" sx={{ color: "#888" }}>Endereço</Typography>
                      <Typography variant="body1">
                        {[
                          pedido.enderecoEntrega.logradouro,
                          pedido.enderecoEntrega.numero,
                          pedido.enderecoEntrega.bairro,
                          pedido.enderecoEntrega.cidade,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: "1 1 120px" }}>
                      <Typography variant="caption" sx={{ color: "#888" }}>CEP</Typography>
                      <Typography variant="body1">{pedido.enderecoEntrega.cep || "—"}</Typography>
                    </Box>
                    <Box sx={{ flex: "1 1 120px" }}>
                      <Typography variant="caption" sx={{ color: "#888" }}>Frete</Typography>
                      <Typography variant="body1">{formatBRL(pedido.frete ?? 0)}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Este pedido não tem endereço registrado (anterior à correção do checkout).
                  </Typography>
                )}
              </Paper>

              {/* Itens */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1A1A1A" }}>
                  Itens do Pedido
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Qtd</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Preço</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* #72: item relacional; pedido antigo ainda vem do JSON */}
                      {(pedido.itens?.length
                        ? pedido.itens.map((i) => ({
                            nome: i.nome,
                            sku: i.sku,
                            quantidade: i.quantidade,
                            preco: i.preco,
                          }))
                        : (pedido.items as PedidoItem[]) || []
                      ).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.nome}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#888" }}>
                            {item.sku || "—"}
                          </TableCell>
                          <TableCell align="center">{item.quantidade}</TableCell>
                          <TableCell align="right">{formatBRL(item.preco)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatBRL(item.preco * item.quantidade)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                  {pedido.frete ? (
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Frete: {formatBRL(pedido.frete)}
                    </Typography>
                  ) : null}
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#BF360C" }}>
                    Total: {formatBRL(pedido.total)}
                  </Typography>
                </Box>
              </Paper>


              {/* Resultado da venda (#191) — mesma conta do relatório */}
              <ResultadoDaVenda pedido={pedido} onAtualizado={carregarPedido} />

              {/* Linha do tempo (#123) — vem da auditoria, com autor e horário */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <History sx={{ fontSize: 18, color: "#BF360C" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#1A1A1A" }}>
                    Histórico
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "baseline", flexWrap: "wrap" }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "#888", minWidth: 118 }}>
                      {formatDate(pedido.createdAt)}
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#444" }}>
                      Pedido criado
                    </Typography>
                  </Box>

                  {(pedido.historico ?? []).length === 0 && (
                    <Typography sx={{ fontSize: "0.8rem", color: "#999" }}>
                      Nenhuma mudança de status registrada ainda.
                    </Typography>
                  )}

                  {(pedido.historico ?? []).map((h, i) => (
                    <Box
                      key={`${h.em}-${i}`}
                      sx={{ display: "flex", gap: 1.5, alignItems: "baseline", flexWrap: "wrap" }}
                    >
                      <Typography sx={{ fontSize: "0.75rem", color: "#888", minWidth: 118 }}>
                        {formatDate(h.em)}
                      </Typography>
                      <Typography sx={{ fontSize: "0.85rem", color: "#444" }}>
                        {h.de ? (
                          <>
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              {labelStatus(h.de)}
                            </Box>
                            {" → "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              {labelStatus(h.para ?? h.de)}
                            </Box>
                          </>
                        ) : h.para ? (
                          <>
                            Status alterado para{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                              {labelStatus(h.para)}
                            </Box>
                          </>
                        ) : (
                          "Pedido atualizado"
                        )}
                        <Box component="span" sx={{ color: "#999" }}>
                          {" "}
                          por {h.usuario}
                        </Box>
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Ações */}
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1A1A1A" }}>
                  Ações
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {proximoStatus() && (
                    <Button
                      variant="contained"
                      color={proximoStatus()!.color}
                      startIcon={proximoStatus()!.icon}
                      onClick={() => alterarStatus(proximoStatus()!.status)}
                      disabled={updating}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      {proximoStatus()!.label}
                    </Button>
                  )}
                  {(pedido.status === "pendente" || pedido.status === "aguardando_pagamento" || pedido.status === "pago" || pedido.status === "em_separacao") && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => alterarStatus("cancelado")}
                      disabled={updating}
                      sx={{ textTransform: "none" }}
                    >
                      Cancelar Pedido
                    </Button>
                  )}
                </Box>
              </Paper>
            </>
          )}
        </Container>
      </AdminLayout>
    </>
  );
}
