import { create } from "zustand"
import { persist } from "zustand/middleware"
import api from "../utils/api"

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      // Login
      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await api.post("/auth/login", credentials)
          const { user, token } = response.data.data

          set({ user, token, isLoading: false })

          // Set token in api headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`

          return { success: true, user }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Register and Auto Login
      register: async (userData) => {
        set({ isLoading: true })
        try {
          // Step 1: Register
          const registerResponse = await api.post("/auth/register", userData)
          
          // Step 2: Verify OTP
          if (registerResponse.data.success) {
            return { success: true, requiresOTP: true };
          }

          set({ isLoading: false })
          throw new Error("Registration failed");
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Verify OTP and Complete Registration
      verifyOTP: async (email, otp) => {
        set({ isLoading: true })
        try {
          const response = await api.post("/auth/verify-otp", { email, otp })
          const { user, token } = response.data.data

          set({ user, token, isLoading: false })

          // Set token in api headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`

          return { success: true, user }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Logout
      logout: async () => {
        try {
          // Call logout API to update server state
          const token = get().token;
          if (token) {
            // Ensure Authorization header is set before making the request
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            await api.post("/auth/logout");
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Clear auth state regardless of API call success
          set({ user: null, token: null });
          delete api.defaults.headers.common["Authorization"];
          localStorage.removeItem("auth-storage");
        }
      },

      // Check authentication
      checkAuth: async () => {
        const { token } = get()
        if (!token) return

        try {
          // Set token in api headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`

          const response = await api.get("/auth/me")
          const { user } = response.data.data

          set({ user })
        } catch (error) {
          // Token is invalid, logout
          get().logout()
        }
      },

      // Update user
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token }),
    },
  ),
)

export { useAuthStore }
