"use client";

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add,
  Remove,
} from "@mui/icons-material";
import { ItemCarrinho } from "@/types";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: ItemCarrinho[];
  onAdd: (item: ItemCarrinho) => void;
  onRemove: (item: ItemCarrinho) => void;
  onClear: () => void;
}

export default function CartDrawer({
  open,
  onClose,
  items,
  onAdd,
  onRemove,
  onClear,
}: CartDrawerProps) {
  const total = items.reduce(
    (sum, item) => sum + item.produto.preco * item.quantidade,
    0
  );

  const totalItens = items.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: { xs: "100vw", sm: 400 },
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header do carrinho */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Carrinho ({totalItens})
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {items.length > 0 && (
              <Button
                size="small"
                onClick={onClear}
                sx={{
                  color: "#999",
                  textTransform: "none",
                  fontSize: "0.8rem",
                }}
              >
                Limpar
              </Button>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Lista de itens */}
        {items.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
              color: "#999",
            }}
          >
            <ShoppingCartOutlinedIcon
              sx={{ fontSize: 64, mb: 2, color: "#ddd" }}
            />
            <Typography variant="body1" sx={{ mb: 1 }}>
              Seu carrinho está vazio
            </Typography>
            <Typography variant="body2" sx={{ color: "#bbb", mb: 3 }}>
              Adicione produtos para começar
            </Typography>
            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                backgroundColor: "#E65100",
                "&:hover": { backgroundColor: "#BF360C" },
                textTransform: "none",
              }}
            >
              Continuar Comprando
            </Button>
          </Box>
        ) : (
          <List sx={{ flex: 1, overflow: "auto", px: 1 }}>
            {items.map((item, index) => (
              <ListItem key={`${item.produto.id}-${index}`} sx={{ gap: 1 }}>
                <ListItemAvatar>
                  <Avatar
                    variant="rounded"
                    src={item.produto.imgUrl}
                    sx={{ width: 64, height: 64 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.produto.nome}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{ color: "#E65100", fontWeight: 600 }}
                    >
                      R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                    </Typography>
                  }
                />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => onRemove(item)}
                    sx={{ color: "#999" }}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, minWidth: 20, textAlign: "center" }}
                  >
                    {item.quantidade}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => onAdd(item)}
                    sx={{ color: "#999" }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}

        {/* Footer do carrinho */}
        {items.length > 0 && (
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              px: 2,
              py: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography variant="body1">Total</Typography>
              <Typography
                variant="h6"
                sx={{ color: "#E65100", fontWeight: 700 }}
              >
                R$ {total.toFixed(2)}
              </Typography>
            </Box>
            {total > 0 && (
              <Typography variant="caption" sx={{ color: "#999", mb: 2 }}>
                ou 12x de R$ {(total / 12).toFixed(2)} sem juros
              </Typography>
            )}
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 1,
                backgroundColor: "#E65100",
                "&:hover": { backgroundColor: "#BF360C" },
                textTransform: "none",
                py: 1.5,
                fontWeight: 600,
              }}
            >
              Finalizar Compra
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

// Workaround pra import inline de ícone
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
