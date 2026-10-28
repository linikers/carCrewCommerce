"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Close,
} from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import { Categoria } from "@/types";
import type { ItemMenu } from "@/lib/menu-loja";
import CarCrewLogoText from "@/components/CarCrewLogoText";

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
  // Menu vem do painel (/admin/menu): item desligado não aparece na barra.
  const [menu, setMenu] = useState<{
    barra: ItemMenu[];
    solucoes: ItemMenu[];
    categoriasOcultas: string[];
  }>({ barra: [], solucoes: [], categoriasOcultas: [] });
  const [searchValue, setSearchValue] = useState("");
  const [categoriesMenuAnchor, setCategoriesMenuAnchor] =
    useState<null | HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/categorias").then((r) => r.json()),
      fetch("/api/menu").then((r) => r.json()),
    ])
      .then(([cats, cfg]) => {
        setCategorias(cats);
        setMenu({
          barra: Array.isArray(cfg?.barra) ? cfg.barra : [],
          solucoes: Array.isArray(cfg?.solucoes) ? cfg.solucoes : [],
          categoriasOcultas: Array.isArray(cfg?.categoriasOcultas)
            ? cfg.categoriasOcultas
            : [],
        });
      })
      .catch(() => {});
  }, []);

  // Categoria escondida no painel continua com página no ar — só sai do menu.
  const categoriasVisiveis = categorias.filter(
    (c) => !menu.categoriasOcultas.includes(c.slug)
  );

  const fireSearch = (term: string) => {
    setSearchValue(term);
    onSearch?.(term);
  };

  // Fora da home não existe filtro local: Enter/Submit leva para a home com o termo.
  // (antes, o campo de busca não fazia nada em /produto, /faq, /checkout etc.)
  const submitSearch = (term: string) => {
    if (onSearch) {
      onSearch(term);
      return;
    }
    const q = term.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitSearch(searchValue);
      searchInputRef.current?.blur();
    }
    if (e.key === "Escape") {
      fireSearch("");
      searchInputRef.current?.focus();
    }
  };

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
              position: "relative",
            }}
          >
            {/* Hamburger (mobile only) */}
            <IconButton
              sx={{
                display: { xs: "flex", lg: "none" },
                position: "absolute",
                left: 0,
                zIndex: 1,
              }}
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo — perfeitamente centralizado */}
            <Link
              href="/"
              style={{
                textDecoration: "none",
                lineHeight: 0,
                margin: "0 auto",
              }}
            >
              <CarCrewLogoText />
            </Link>

            {/* Ícones — alinhados à direita */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0, sm: 0.5 },
                position: "absolute",
                right: 0,
                zIndex: 1,
              }}
            >
              <UserMenu />
              <IconButton
                onClick={onCartOpen}
                sx={{
                  color: "#1A1A1A",
                  transition: "color 0.2s ease",
                  "&:hover": { color: "primary.main" },
                }}
              >
                <Badge
                  badgeContent={cartItemCount}
                  color="primary"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: "primary.main",
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
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(searchValue);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: searchValue ? "primary.main" : "#e0e0e0",
                px: 1.5,
                py: 0.5,
                maxWidth: 600,
                mx: { xs: "auto" },
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                boxShadow: searchValue
                  ? "0 0 0 3px rgba(230, 81, 0, 0.1)"
                  : "none",
                "&:focus-within": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 0 3px rgba(230, 81, 0, 0.1)",
                },
              }}
            >
              <IconButton
                size="small"
                type="submit"
                sx={{ color: searchValue ? "primary.main" : "#999", mr: 0.5, p: 0.5 }}
                aria-label="Buscar"
              >
                <SearchIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <InputBase
                placeholder="O que deseja procurar?"
                value={searchValue}
                onChange={(e) => fireSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                inputRef={searchInputRef}
                sx={{ flex: 1, fontSize: { xs: "0.85rem", md: "0.925rem" } }}
                inputProps={{ "aria-label": "buscar" }}
              />
              {searchValue && (
                <IconButton
                  size="small"
                  onClick={() => {
                    fireSearch("");
                    searchInputRef.current?.focus();
                  }}
                  sx={{ color: "#999", ml: 0.5, p: 0.5 }}
                  aria-label="Limpar busca"
                >
                  <Close sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Box>
          </Container>
        </Box>

        {/* === Row 3: Nav de categorias (desktop) === */}
        <Box
          sx={{
            backgroundColor: "#1A1A1A",
            display: { xs: "none", lg: "block" },
          }}
        >
          <Container maxWidth="xl">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                minHeight: 44,
              }}
            >
              {/* Categorias — centralizadas no espaço disponível */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: "nowrap",
                }}
              >
                {categoriasVisiveis.map((cat) => (
                  <Button
                    key={cat.slug}
                    onClick={() => {
                      // Redireciona pra home filtrada se não estiver na página principal
                      if (!onCategorySelect) {
                        router.push("/categoria/" + cat.slug);
                        return;
                      }
                      onCategorySelect(activeCategory === cat.slug ? null : cat.slug);
                    }}
                    sx={{
                      color:
                        activeCategory === cat.slug ? "primary.main" : "#ffffff",
                      textTransform: "none",
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      px: { lg: 1.25, xl: 2 },
                      py: 1.25,
                      minHeight: 44,
                      borderRadius: 0,
                      fontWeight: activeCategory === cat.slug ? 600 : 400,
                      borderBottom:
                        activeCategory === cat.slug
                          ? "2px solid #E65100"
                          : "2px solid transparent",
                      letterSpacing: "0.01em",
                      transition:
                        "color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.08)",
                        color: "primary.main",
                      },
                    }}
                  >
                    {cat.nome}
                  </Button>
                ))}

                {/* Dropdown "Soluções" — os itens vêm do painel (/admin/menu) */}
                {menu.solucoes.length > 0 && (
                <Button
                  onClick={(e) => setCategoriesMenuAnchor(e.currentTarget)}
                  endIcon={
                    <ExpandMore
                      sx={{
                        fontSize: 18,
                        transition: "transform 0.2s ease",
                        transform: categoriesMenuAnchor
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    />
                  }
                  sx={{
                    color: categoriesMenuAnchor ? "primary.main" : "#ffffff",
                    textTransform: "none",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    px: { lg: 1.25, xl: 2 },
                    py: 1.25,
                    minHeight: 44,
                    borderRadius: 0,
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    borderBottom: categoriesMenuAnchor
                      ? "2px solid #E65100"
                      : "2px solid transparent",
                    transition:
                      "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: "primary.main",
                    },
                  }}
                >
                  Soluções
                </Button>
                )}

                {/* Itens diretos da barra (Blog por padrão) — painel /admin/menu */}
                {menu.barra.map((item) => (
                  <Button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    sx={{
                      color: "#ffffff",
                      textTransform: "none",
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      px: { lg: 1.25, xl: 2 },
                      py: 1.25,
                      minHeight: 44,
                      borderRadius: 0,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", color: "primary.main" },
                    }}
                  >
                    {item.rotulo}
                  </Button>
                ))}

                <Menu
                  anchorEl={categoriesMenuAnchor}
                  open={Boolean(categoriesMenuAnchor)}
                  onClose={() => setCategoriesMenuAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 0.5,
                        borderRadius: 1.5,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        minWidth: 240,
                        maxHeight: 360,
                      },
                    },
                  }}
                >
                  {menu.solucoes.map((item) => (
                    <MenuItem
                      key={item.id}
                      component={Link}
                      href={item.href}
                      onClick={() => setCategoriesMenuAnchor(null)}
                      sx={{ py: 1.25, px: 2.5, display: "block" }}
                    >
                      <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.3, color: "#1A1A1A" }}>
                        {item.rotulo}
                      </Typography>
                      {item.descricao && (
                        <Typography sx={{ fontSize: "0.72rem", lineHeight: 1.35, color: "#666", mt: 0.25 }}>
                          {item.descricao}
                        </Typography>
                      )}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
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
              sx={{ mb: 0.5 }}
            >
              <ListItemIcon>
                <MenuIcon />
              </ListItemIcon>
              <ListItemText primary="Categorias" />
              {categoriesOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={categoriesOpen}>
              <List disablePadding>
                {categoriasVisiveis.map((cat) => (
                  <ListItemButton
                    key={cat.slug}
                    sx={{ pl: 4 }}
                    onClick={() => {
                      if (!onCategorySelect) {
                        router.push("/categoria/" + cat.slug);
                        setMobileMenuOpen(false);
                        return;
                      }
                      onCategorySelect?.(cat.slug);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <ListItemText
                      primary={cat.nome}
                      sx={{
                        color:
                          activeCategory === cat.slug ? "primary.main" : "inherit",
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>

            {/* 3.3 — as páginas que mais convertem também no mobile
                (itens vêm do painel /admin/menu, com a descrição de cada um) */}
            {menu.barra.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => {
                  router.push(item.href);
                  setMobileMenuOpen(false);
                }}
              >
                <ListItemIcon>
                  <ExpandMore sx={{ transform: "rotate(-90deg)", fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.rotulo}
                  secondary={item.descricao || undefined}
                />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 1 }} />
            {menu.solucoes.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => {
                  router.push(item.href);
                  setMobileMenuOpen(false);
                }}
              >
                <ListItemIcon>
                  <ExpandMore sx={{ transform: "rotate(-90deg)", fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.rotulo}
                  secondary={item.descricao || undefined}
                />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 1 }} />

            <Divider />

            <ListItemButton
              onClick={() => {
                router.push("/conta");
                setMobileMenuOpen(false);
              }}
              sx={{ mb: 0.5 }}
            >
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText primary="Minha Conta" />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                window.open("https://wa.me/5544998133182", "_blank");
                setMobileMenuOpen(false);
              }}
              sx={{ mb: 0.5 }}
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

      {/* WhatsApp FAB — sempre visível, canto inferior direito */}
      <IconButton
        href="https://wa.me/5544998133182"
        target="_blank"
        aria-label="Fale no WhatsApp"
        sx={{
          position: "fixed",
          // sobe 96 px no mobile: a PDP tem barra de compra fixa de ~76 px e
          // os dois se sobrepunham no canto inferior direito
          bottom: { xs: 96, md: 24 },
          right: { xs: 16, md: 24 },
          zIndex: 1300,
          backgroundColor: "#25D366",
          color: "#fff",
          width: { xs: 56, md: 64 },
          height: { xs: 56, md: 64 },
          boxShadow: "0 4px 12px rgba(37, 211, 102, 0.4)",
          transition: "background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
          "&:hover": {
            backgroundColor: "#20ba5a",
            boxShadow: "0 6px 16px rgba(37, 211, 102, 0.5)",
            transform: "scale(1.05)",
          },
        }}
      >
        <WhatsApp sx={{ fontSize: { xs: 28, md: 32 } }} />
      </IconButton>
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
              bgcolor: "primary.main",
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
                color: "primary.main",
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
        "&:hover": { color: "primary.main" },
      }}
    >
      <Person />
    </IconButton>
  );
}
