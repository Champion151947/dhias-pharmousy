import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api/client';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const data = await cartApi.get();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (productId, quantity = 1) => {
    await cartApi.add(productId, quantity);
    await fetchCart();
    setDrawerOpen(true);
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    await cartApi.update(itemId, quantity);
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity } : item));
  };

  const removeItem = async (itemId) => {
    await cartApi.remove(itemId);
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = async () => {
    await cartApi.clear();
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = {
    items,
    loading,
    drawerOpen,
    setDrawerOpen,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
    totalItems,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}