"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Container,
  IconButton,
  InputBase,
  Toolbar,
  Typography,
  Button,
  Badge,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Collapse,
  Divider,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  ShoppingCartOutlined,
  Person,
  WhatsApp,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { CategoriaSlug, Categoria } from "@/types";

interface HeaderProps {
  cartItemCount?: number;
  onCartOpen?: () => void;
  onSearch?: (term: string) => void;
}

export default function Header({
  cartItemCount = 0,
  onCartOpen,
  onSearch,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategorias)
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Barra superior */}
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: "#ffffff",
          color: "#1A1A1A",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1 }}>
            {/* Mobile menu toggle */}
            <IconButton
              sx={{ display: { xs: "flex", md: "none" } }}
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flexShrink: 0,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#E65100",
                  fontSize: { xs: "1rem", md: "1.25rem" },
                  letterSpacing: "-0.5px",
                }}
              >
                CarCrew
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#1A1A1A",
                  fontWeight: 500,
                  display: { xs: "none", sm: "block" },
                }}
              >
                Suspensões
              </Typography>
            </Box>

            {/* Busca */}
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                justifyContent: "center",
                mx: { xs: 1, md: 3 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#f5f5f5",
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  width: "100%",
                  maxWidth: 500,
                }}
              >
                <SearchIcon sx={{ color: "#999", mr: 1, fontSize: 20 }} />
                <InputBase
                  placeholder="O que deseja procurar?"
                  onChange={(e) => onSearch?.(e.target.value)}
                  sx={{ flex: 1, fontSize: { xs: "0.85rem", md: "0.95rem" } }}
                  inputProps={{ "aria-label": "buscar" }}
                />
              </Box>
            </Box>

            {/* Ícones direita */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {/* User menu */}
              <UserMenu />

              <IconButton onClick={onCartOpen} sx={{ color: "#1A1A1A" }}>
                <Badge
                  badgeContent={cartItemCount}
                  color="primary"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: "#E65100",
                      color: "#fff",
                      fontSize: 10,
                      minWidth: 18,
                      height: 18,
                    },
                  }}
                >
                  <ShoppingCartOutlined />
                </Badge>
              </IconButton>
            </Box>
          </Toolbar>
        </Container>

        {/* Nav de categorias (desktop) */}
        <Box
          sx={{
            backgroundColor: "#1A1A1A",
            display: { xs: "none", md: "block" },
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0,
              }}
            >
              {categorias.map((cat) => (
                <Button
                  key={cat.slug}
                  sx={{
                    color: "#ffffff",
                    textTransform: "none",
                    fontSize: "0.85rem",
                    px: 1.5,
                    py: 1,
                    borderRadius: 0,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  {cat.nome}
                </Button>
              ))}
              <Button
                sx={{
                  color: "#E65100",
                  textTransform: "none",
                  fontSize: "0.85rem",
                  px: 1.5,
                  py: 1,
                  borderRadius: 0,
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                + Categorias
              </Button>

              <Box sx={{ flex: 1 }} />

              <Button
                startIcon={<WhatsApp />}
                href="https://wa.me/5544991528386"
                target="_blank"
                sx={{
                  color: "#25D366",
                  textTransform: "none",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  px: 1.5,
                  py: 1,
                  borderRadius: 0,
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                Dúvidas? Fale no WhatsApp
              </Button>
            </Box>
          </Container>
        </Box>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 280, pt: 2 }}>
          <Typography
            variant="h6"
            sx={{
              px: 2,
              pb: 2,
              color: "#E65100",
              fontWeight: 700,
            }}
          >
            CarCrew Suspensões
          </Typography>
          <Divider />

          <List>
            <ListItemButton onClick={() => setCategoriesOpen(!categoriesOpen)}>
              <ListItemIcon>
                <MenuIcon />
              </ListItemIcon>
              <ListItemText primary="Categorias" />
              {categoriesOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={categoriesOpen}>
              <List disablePadding>
                {categorias.map((cat) => (
                  <ListItemButton key={cat.slug} sx={{ pl: 4 }}>
                    <ListItemText primary={cat.nome} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>

            <Divider />

            <ListItemButton onClick={() => router.push("/conta")}>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText primary="Minha Conta" />
            </ListItemButton>

            <ListItemButton
              onClick={() => router.push("https://wa.me/5544991528386")}
            >
              <ListItemIcon>
                <WhatsApp />
              </ListItemIcon>
              <ListItemText
                primary="Fale no WhatsApp"
                sx={{ color: "#25D366" }}
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
}

// Componente de menu do usuário (login / avatar)
function UserMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (session?.user) {
    return (
      <>
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ display: { xs: "none", sm: "inline-flex" } }}
        >
          <Avatar
            src={session.user.image || undefined}
            sx={{
              width: 32,
              height: 32,
              bgcolor: "#E65100",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {session.user.name?.charAt(0)?.toUpperCase() || "U"}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {session?.user?.admin && (
            <MenuItem
              onClick={() => { setAnchorEl(null); router.push("/admin"); }}
              sx={{ color: "#E65100", fontWeight: 600, borderBottom: "1px solid", borderColor: "divider", mb: 0.5 }}
            >
              Painel Admin
            </MenuItem>
          )}
          <MenuItem onClick={() => { setAnchorEl(null); router.push("/conta"); }}>
            Minha Conta
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); signOut(); }}>
            Sair
          </MenuItem>
        </Menu>
      </>
    );
  }

  return (
    <IconButton
      onClick={() => router.push("/login")}
      sx={{
        color: "#1A1A1A",
        display: { xs: "none", sm: "inline-flex" },
      }}
    >
      <Person />
    </IconButton>
  );
}
