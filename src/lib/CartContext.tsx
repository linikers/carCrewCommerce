"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Produto, ItemCarrinho } from "@/types";

interface CartContextType {
  items: ItemCarrinho[];
  total: number;
  totalItens: number;
  addToCart: (produto: Produto) => void;
  removeFromCart: (item: ItemCarrinho) => void;
  updateQuantidade: (produtoId: number, quantidade: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "carcrew-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrinho[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Corrupted data, start fresh
    }
    setHydrated(true);
  }, []);

  // Sync to localStorage whenever items change
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Storage full or unavailable
      }
    }
  }, [items, hydrated]);

  const addToCart = useCallback((produto: Produto) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.produto.id === produto.id);
      if (existing) {
        return prev.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((item: ItemCarrinho) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.produto.id === item.produto.id);
      if (existing && existing.quantidade <= 1) {
        return prev.filter((i) => i.produto.id !== item.produto.id);
      }
      return prev.map((i) =>
        i.produto.id === item.produto.id
          ? { ...i, quantidade: i.quantidade - 1 }
          : i
      );
    });
  }, []);

  const updateQuantidade = useCallback(
    (produtoId: number, quantidade: number) => {
      if (quantidade <= 0) {
        setItems((prev) => prev.filter((i) => i.produto.id !== produtoId));
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.produto.id === produtoId ? { ...item, quantidade } : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce(
    (sum, item) => sum + item.produto.preco * item.quantidade,
    0
  );
  const totalItens = items.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        totalItens,
        addToCart,
        removeFromCart,
        updateQuantidade,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
