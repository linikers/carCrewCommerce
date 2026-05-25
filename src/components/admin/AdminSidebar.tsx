"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
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
  ViewCarousel,
} from "@mui/icons-material";

const menuItems = [
  { label: "Dashboard", icon: <Dashboard />, path: "/admin" },
  { label: "Produtos", icon: <Inventory2 />, path: "/admin/produtos" },
  { label: "Categorias", icon: <Category />, path: "/admin/categorias" },
  { label: "Banners", icon: <ViewCarousel />, path: "/admin/banners" },
  { label: "Pedidos", icon: <ShoppingBag />, path: "/admin/pedidos", disabled: true, tag: "Em breve" },
  { label: "Clientes", icon: <People />, path: "/admin/clientes", disabled: true, tag: "Em breve" },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

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
            sx={{ fontWeight: 700, color: "#E65100", lineHeight: 1 }}
          >
            CarCrew
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
      <List sx={{ flex: 1, px: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => !item.disabled && handleNav(item.path)}
            selected={
              pathname === item.path ||
              pathname.startsWith(item.path + "/")
            }
            disabled={item.disabled}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: "#ccc",
              "&.Mui-selected": {
                backgroundColor: "rgba(230,81,0,0.15)",
                color: "#E65100",
                "&:hover": {
                  backgroundColor: "rgba(230,81,0,0.2)",
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
              primary={item.label}
              sx={{ "& .MuiListItemText-primary": { fontSize: "0.9rem" } }}
            />
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
