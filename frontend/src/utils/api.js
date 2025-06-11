import axios from "axios"
import toast from "react-hot-toast"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("auth-storage")
    if (token) {
      try {
        const parsedToken = JSON.parse(token)?.state?.token
        if (parsedToken) {
          config.headers.Authorization = `Bearer ${parsedToken}`
        }
      } catch (error) {
        console.error("Error parsing auth token:", error)
        localStorage.removeItem("auth-storage")
      }
    }
    return config
  },
  (error) => {
    console.error("Request error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Network error
    if (!error.response) {
      console.error("Network error:", error)
      toast.error("Unable to connect to server. Please check your internet connection.")
      return Promise.reject(error)
    }

    // Server error
    const message = error.response?.data?.message || "Something went wrong"
    const status = error.response?.status

    // Don't show toast for certain errors
    const silentErrors = [401, 403]
    if (!silentErrors.includes(status)) {
      toast.error(message)
    }

    // Handle specific status codes
    switch (status) {
      case 401:
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem("auth-storage")
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
        break
      case 403:
        // Forbidden - might need email verification
        if (error.response?.data?.message?.includes("verify")) {
          toast.error("Please verify your email to continue")
        }
        break
      case 429:
        // Too many requests
        toast.error("Too many attempts. Please try again later.")
        break
      case 503:
        // Service unavailable
        toast.error("Service is temporarily unavailable. Please try again later.")
        break
    }

    return Promise.reject(error)
  },
)

export default api
