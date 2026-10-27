"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Badge,
  Chip,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Dashboard,
  Inventory2,
  Category,
  ShoppingBag,
  People,
  Logout,
  Close,
  Store,
  LocalShipping,
  ViewCarousel,
  Payment,
  MarkEmailRead,
  Extension,
} from "@mui/icons-material";
import { MODULOS } from "@/modules/registro";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  disabled?: boolean;
  tag?: string;
  /** tela ainda não construída: aparece com a marca "em breve" */
  emBreve?: boolean;
}

/** Ícone por rota — o registro de módulos é dado puro, sem JSX. */
const ICONE_POR_ROTA: Record<string, React.ReactNode> = {
  "/admin/produtos": <Inventory2 />,
  "/admin/categorias": <Category />,
  "/admin/banners": <ViewCarousel />,
  "/admin/pedidos": <ShoppingBag />,
  "/admin/clientes": <People />,
  "/admin/leads": <MarkEmailRead />,
  "/admin/estoque": <Inventory2 />,
  "/admin/frete": <LocalShipping />,
  "/admin/pagamentos": <Payment />,
  "/admin/modulos": <Extension />,
};

// 5.3: a lista era um bloco só, sem hierarquia. Agrupada por área de
// trabalho — o que se usa junto fica junto.
//
// A partir do #73 o menu é **derivado do registro de módulos**: tela nova de
// módulo aparece aqui sozinha. Antes era lista fixa — o Estoque foi ligado e
// não apareceu no menu (a tela existia, sem porta de entrada).
const gruposMenu: { titulo: string | null; itens: MenuItem[] }[] = (() => {
  const porGrupo: Record<string, MenuItem[]> = { Catálogo: [], Operação: [], Configuração: [] };

  for (const modulo of MODULOS) {
    for (const tela of modulo.telas) {
      porGrupo[tela.grupo]?.push({
        label: tela.rotulo,
        icon: ICONE_POR_ROTA[tela.rota] ?? <Extension />,
        path: tela.rota,
        emBreve: tela.emBreve,
        // tela que ainda não existe não navega: item desabilitado com a marca
        disabled: tela.emBreve,
      });
    }
  }

  // telas que não pertencem a módulo (configuração solta do painel)
  porGrupo["Configuração"].push({
    label: "Pagamentos",
    icon: <Payment />,
    path: "/admin/pagamentos",
  });
  porGrupo["Configuração"].push({
    label: "Módulos",
    icon: <Extension />,
    path: "/admin/modulos",
  });

  return [
    { titulo: null, itens: [{ label: "Dashboard", icon: <Dashboard />, path: "/admin" }] },
    ...(["Catálogo", "Operação", "Configuração"] as const).map((titulo) => ({
      titulo,
      itens: porGrupo[titulo],
    })),
  ];
})();

// rota do painel -> módulo dono. Usado para esconder o que está desligado.
const moduloDaRota: Record<string, string> = MODULOS.reduce(
  (mapa, modulo) => {
    for (const tela of modulo.telas) mapa[tela.rota] = modulo.id;
    return mapa;
  },
  {} as Record<string, string>
);

const pageLinks: MenuItem[] = [
  { label: "Página FAQ", icon: <Category />, path: "/faq" },
  { label: "Página Off-Road", icon: <Category />, path: "/off-road" },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  // Módulo desligado não aparece no menu (as rotas dele respondem 404).
  // Sem estado ainda, mostra tudo: um menu incompleto por 200 ms assusta mais
  // do que um item a mais.
  const [modulosAtivos, setModulosAtivos] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    fetch("/api/admin/modulos")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.estado && setModulosAtivos(d.estado))
      .catch(() => setModulosAtivos(null));
  }, []);

  const visivel = (item: MenuItem) => {
    if (!modulosAtivos) return true;
    const modulo = moduloDaRota[item.path];
    if (!modulo) return true;
    return modulosAtivos[modulo] !== false;
  };
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  // 5.6: a navegação não dava nenhum sinal de trabalho pendente. Estes dois
  // números são os que param a loja: pedido para faturar e produto sem preço
  // (que não fecha pedido).
  const [pendencias, setPendencias] = useState({ pedidos: 0, semPreco: 0 });

  useEffect(() => {
    let ativo = true;
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!ativo || !d) return;
        setPendencias({
          pedidos: Number(d.pedidosAbertos ?? 0),
          semPreco: Number(d.alertas?.semPreco ?? 0),
        });
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [pathname]);

  const contadorDe = (path: string) =>
    path === "/admin/pedidos" ? pendencias.pedidos : path === "/admin/produtos" ? pendencias.semPreco : 0;

  const handleNav = (path: string) => {
    router.push(path);
    if (!isDesktop) onClose();
  };

  const content = (
    <Box
      sx={{
        width: 250,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1A1A1A",
        color: "#fff",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#BF360C", lineHeight: 1 }}
          >
            Car Crew Garage
          </Typography>
          <Typography variant="caption" sx={{ color: "#888" }}>
            Painel Admin
          </Typography>
        </Box>
        {!isDesktop && (
          <IconButton onClick={onClose} sx={{ color: "#fff" }}>
            <Close />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* Menu */}
      {/* minHeight: 0 vem do #134 (Pagamentos cortado); o filtro de módulo é do #137 */}
      <Box sx={{ flex: 1, minHeight: 0, px: 1, pt: 1, overflowY: "auto" }}>
        {gruposMenu
          .map((grupo) => ({ ...grupo, itens: grupo.itens.filter(visivel) }))
          .filter((grupo) => grupo.itens.length > 0)
          .map((grupo) => (
          <Box key={grupo.titulo ?? "principal"} sx={{ mb: grupo.titulo ? 1.5 : 0 }}>
            {grupo.titulo && (
              <Typography
                variant="caption"
                sx={{ color: "#666", px: 2, pt: 1, pb: 0.5, display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.62rem" }}
              >
                {grupo.titulo}
              </Typography>
            )}
            <List disablePadding>
              {grupo.itens.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => !item.disabled && handleNav(item.path)}
            selected={
              // "/admin" com startsWith("/admin/") casava em TODAS as telas:
              // Dashboard e a tela atual ficavam destacados juntos.
              item.path === "/admin"
                ? pathname === "/admin"
                : pathname === item.path || pathname.startsWith(item.path + "/")
            }
            disabled={item.disabled}
            sx={{
              borderRadius: 2,
              mb: 1,
              color: "#ccc",
              "&.Mui-selected": {
                backgroundColor: "rgba(191,54,12,0.18)",
                color: "#BF360C",
                "&:hover": {
                  backgroundColor: "rgba(191,54,12,0.24)",
                },
              },
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {item.label}
                  {item.emBreve && (
                    <Chip
                      size="small"
                      label="em breve"
                      sx={{ height: 16, fontSize: "0.55rem", backgroundColor: "rgba(255,255,255,0.12)", color: "#ddd" }}
                    />
                  )}
                </Box>
              }
              sx={{ "& .MuiListItemText-primary": { fontSize: "0.9rem" } }}
            />
            {contadorDe(item.path) > 0 && (
              // o número sozinho não diz o que conta (Duda apontou isso)
              <Tooltip
                title={
                  item.path === "/admin/pedidos"
                    ? `${contadorDe(item.path)} pedido(s) aberto(s)`
                    : `${contadorDe(item.path)} produto(s) sem preço`
                }
                placement="right"
              >
                <Badge
                  badgeContent={contadorDe(item.path)}
                  color="error"
                  sx={{ mr: item.tag ? 1 : 0 }}
                />
              </Tooltip>
            )}
            {item.tag && (
              <Typography
                variant="caption"
                sx={{
                  color: "#888",
                  fontSize: "0.65rem",
                  fontStyle: "italic",
                }}
              >
                {item.tag}
              </Typography>
            )}
          </ListItemButton>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      <List sx={{ px: 1, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color: "#666", px: 2, pb: 0.5, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Páginas do Site
        </Typography>
        {pageLinks.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => handleNav(item.path)}
            sx={{ borderRadius: 2, mb: 0.5, color: "#ccc",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {item.label}
                  {item.emBreve && (
                    <Chip
                      size="small"
                      label="em breve"
                      sx={{ height: 16, fontSize: "0.55rem", backgroundColor: "rgba(255,255,255,0.12)", color: "#ddd" }}
                    />
                  )}
                </Box>
              }
              sx={{ "& .MuiListItemText-primary": { fontSize: "0.85rem" } }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={() => {
            router.push("/");
          }}
          sx={{ borderRadius: 2, mb: 0.5, color: "#ccc" }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
            <Store />
          </ListItemIcon>
          <ListItemText
            primary="Ver Loja"
            sx={{ "& .MuiListItemText-primary": { fontSize: "0.9rem" } }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          sx={{ borderRadius: 2, color: "#e57373" }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Sair"
            sx={{ "& .MuiListItemText-primary": { fontSize: "0.9rem" } }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isDesktop ? "permanent" : "temporary"}
      open={isDesktop ? true : open}
      onClose={onClose}
      sx={{
        width: isDesktop ? 250 : "auto",
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 250,
          boxSizing: "border-box",
        },
      }}
    >
      {content}
    </Drawer>
  );
}
