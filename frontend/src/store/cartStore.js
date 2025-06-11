// store/cartStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../utils/api";

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            isLoading: false,

            getCount: () => get().items.reduce((count, item) => count + item.quantity, 0),

            addToCart: async(item) => {
                console.log("Cart store: Adding item to cart:", item); // Debug log
                if (!item || !item.pizzaId) {
                    console.error("Cart store: Invalid item data:", item);
                    throw new Error("Invalid item data");
                }

                set({ isLoading: true });
                try {
                    const response = await api.post("/cart/add", item);
                    console.log("Cart store: Add to cart response:", response.data); // Debug log
                    set({ items: response.data.data.items, isLoading: false });
                } catch (error) {
                    console.error("Cart store: Add to cart error:", error.response?.data || error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            removeItem: async(itemId) => {
                set({ isLoading: true });
                try {
                    const response = await api.delete(`/cart/remove/${itemId}`);
                    set({ items: response.data.data.items, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            updateQuantity: async(itemId, quantity) => {
                set({ isLoading: true });
                try {
                    const response = await api.put(`/cart/update/${itemId}`, { quantity });
                    set({ items: response.data.data.items, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            clearCart: async() => {
                set({ isLoading: true });
                try {
                    await api.delete("/cart/clear");
                    set({ items: [], isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            getTotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),

            syncCart: async() => {
                set({ isLoading: true });
                try {
                    const response = await api.get("/cart");
                    set({ items: response.data.data.items, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },
        }), {
            name: "cart-storage",
            partialize: (state) => ({ items: state.items }),
        }
    )
);