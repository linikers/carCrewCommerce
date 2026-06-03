"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CarCrewLogoText from "@/components/CarCrewLogoText";
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
import { Categoria } from "@/types";

interface HeaderProps {
  cartItemCount?: number;
  onCartOpen?: () => void;
  onSearch?: (term: string) => void;
  activeCategory?: string | null;
  onCategorySelect?: (slug: string | null) => void;
}

export default function Header({
  cartItemCount = 0,
  onCartOpen,
  onSearch,
  activeCategory,
  onCategorySelect,
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
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: "#ffffff",
          color: "#1A1A1A",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        {/* === Row 1: Logo central + ícones === */}
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 56, md: 64 },
              gap: 0,
            }}
          >
            {/* Hamburger (mobile only) */}
            <IconButton
              sx={{ display: { xs: "flex", md: "none" } }}
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>

            {/* Spacer left — empurra logo pro centro */}
            <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />

            {/* Hamburger spacer on mobile */}
            <Box sx={{ flex: { xs: 1, md: 0 } }} />

            {/* Logo */}
            <Link
              href="/"
              style={{ textDecoration: "none", lineHeight: 0 }}
            >
              <CarCrewLogoText />
            </Link>

            {/* Spacer right */}
            <Box sx={{ flex: 1 }} />

            {/* Ícones */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0, sm: 0.5 } }}>
              <UserMenu />
              <IconButton
                onClick={onCartOpen}
                sx={{
                  color: "#1A1A1A",
                  transition: "color 0.2s ease",
                  "&:hover": { color: "#E65100" },
                }}
              >
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
                      fontWeight: 600,
                    },
                  }}
                >
                  <ShoppingCartOutlined />
                </Badge>
              </IconButton>
            </Box>
          </Toolbar>
        </Container>

        {/* === Row 2: Busca === */}
        <Box
          sx={{
            backgroundColor: "#fafafa",
            borderTop: "1px solid #f0f0f0",
            borderBottom: "1px solid #f0f0f0",
            py: { xs: 1, md: 1.25 },
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 1.5,
                border: "1px solid #e0e0e0",
                px: 1.5,
                py: 0.5,
                maxWidth: 600,
                mx: { xs: "auto" },
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                "&:focus-within": {
                  borderColor: "#E65100",
                  boxShadow: "0 0 0 3px rgba(230, 81, 0, 0.1)",
                },
              }}
            >
              <SearchIcon
                sx={{ color: "#999", mr: 1, fontSize: 20, flexShrink: 0 }}
              />
              <InputBase
                placeholder="O que deseja procurar?"
                onChange={(e) => onSearch?.(e.target.value)}
                sx={{ flex: 1, fontSize: { xs: "0.85rem", md: "0.925rem" } }}
                inputProps={{ "aria-label": "buscar" }}
              />
            </Box>
          </Container>
        </Box>

        {/* === Row 3: Nav de categorias (desktop) === */}
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
                  onClick={() =>
                    onCategorySelect?.(
                      activeCategory === cat.slug ? null : cat.slug,
                    )
                  }
                  sx={{
                    color:
                      activeCategory === cat.slug ? "#E65100" : "#ffffff",
                    textTransform: "none",
                    fontSize: "0.825rem",
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 0,
                    fontWeight: activeCategory === cat.slug ? 600 : 400,
                    borderBottom:
                      activeCategory === cat.slug
                        ? "2px solid #E65100"
                        : "2px solid transparent",
                    letterSpacing: "0.01em",
                    transition: "color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: "#fff",
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
                  fontSize: "0.825rem",
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 0,
                  fontWeight: 600,
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                + Categorias
              </Button>

              <Box sx={{ flex: 1 }} />

              <Button
                startIcon={
                  <WhatsApp sx={{ fontSize: 16 }} />
                }
                href="https://wa.me/5544998133182"
                target="_blank"
                sx={{
                  color: "#25D366",
                  textTransform: "none",
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 0,
                  letterSpacing: "0.01em",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "#2ee87a",
                  },
                }}
              >
                Dúvidas? Fale no WhatsApp
              </Button>
            </Box>
          </Container>
        </Box>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        slotProps={{
          paper: {
            sx: { width: 280 },
          },
        }}
      >
        <Box sx={{ pt: 2 }}>
          {/* Logo no drawer */}
          <Box sx={{ px: 2, pb: 2 }}>
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <CarCrewLogoText />
            </Link>
          </Box>
          <Divider />

          <List>
            <ListItemButton
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              <ListItemIcon>
                <MenuIcon />
              </ListItemIcon>
              <ListItemText primary="Categorias" />
              {categoriesOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={categoriesOpen}>
              <List disablePadding>
                {categorias.map((cat) => (
                  <ListItemButton
                    key={cat.slug}
                    sx={{ pl: 4 }}
                    onClick={() => {
                      onCategorySelect?.(cat.slug);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <ListItemText
                      primary={cat.nome}
                      sx={{
                        color:
                          activeCategory === cat.slug
                            ? "#E65100"
                            : "inherit",
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>

            <Divider />

            <ListItemButton
              onClick={() => {
                router.push("/conta");
                setMobileMenuOpen(false);
              }}
            >
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText primary="Minha Conta" />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                router.push("https://wa.me/5544998133182");
                setMobileMenuOpen(false);
              }}
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
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            transition: "opacity 0.2s ease",
            "&:hover": { opacity: 0.8 },
          }}
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
          sx={{
            "& .MuiPaper-root": {
              borderRadius: 1.5,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              mt: 0.5,
            },
          }}
        >
          {session?.user?.admin && (
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                router.push("/admin");
              }}
              sx={{
                color: "#E65100",
                fontWeight: 600,
                borderBottom: "1px solid",
                borderColor: "divider",
                mb: 0.5,
                fontSize: "0.9rem",
              }}
            >
              Painel Admin
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              router.push("/conta");
            }}
            sx={{ fontSize: "0.9rem" }}
          >
            Minha Conta
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              signOut();
            }}
            sx={{ fontSize: "0.9rem" }}
          >
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
        transition: "color 0.2s ease",
        "&:hover": { color: "#E65100" },
      }}
    >
      <Person />
    </IconButton>
  );
}
