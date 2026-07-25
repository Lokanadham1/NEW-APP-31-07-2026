import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { item, quantity } — item is a product row from the API

  const addToCart = useCallback((item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.item.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.item.id === item.id
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry
        );
      }
      return [...prev, { item, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((entry) => entry.item.id !== itemId);
      }
      return prev.map((entry) =>
        entry.item.id === itemId ? { ...entry, quantity } : entry
      );
    });
  }, []);

  // Like updateQuantity, but also adds a new entry if the item isn't in the
  // cart yet — needed for manual quantity entry starting from 0 (updateQuantity
  // can only update an entry that already exists).
  const setQuantity = useCallback((item, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((entry) => entry.item.id !== item.id);
      }
      const existing = prev.find((entry) => entry.item.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.item.id === item.id ? { ...entry, quantity } : entry
        );
      }
      return [...prev, { item, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setItems((prev) => prev.filter((entry) => entry.item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, e) => sum + e.item.price * e.quantity, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, e) => sum + e.quantity, 0),
    [items]
  );

  const value = {
    items,
    addToCart,
    updateQuantity,
    setQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
