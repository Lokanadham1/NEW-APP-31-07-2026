import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { item, quantity }
  const [orders, setOrders] = useState([]); // past placed orders
  const [user, setUser] = useState(null); // { name, phone }

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

  const removeFromCart = useCallback((itemId) => {
    setItems((prev) => prev.filter((entry) => entry.item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const placeOrder = useCallback(() => {
    const total = items.reduce((sum, e) => sum + e.item.price * e.quantity, 0);
    const order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      items,
      total,
      placedAt: new Date().toISOString(),
      status: 'Preparing',
    };
    setOrders((prev) => [order, ...prev]);
    setItems([]);
    return order;
  }, [items]);

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
    removeFromCart,
    clearCart,
    subtotal,
    itemCount,
    orders,
    placeOrder,
    user,
    setUser,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
