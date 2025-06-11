import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// Load env vars
dotenv.config()

import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { connectDB } from "./config/db.js"

// Route imports
import authRoutes from "./routes/auth.js"
import pizzaRoutes from "./routes/pizza.js"
import orderRoutes from "./routes/order.js"
import adminRoutes from "./routes/admin.js"
import inventoryRoutes from "./routes/inventory.js"
import paymentRoutes from "./routes/payment.js"
import cartRoutes from "./routes/cart.js"

// Import cron jobs
import "./utils/cronJobs.js"

// Connect to database
connectDB()

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Body parser
app.use(express.json())

// Get directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Mount routes
app.use("/api/auth", authRoutes)
app.use("/api/pizzas", pizzaRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/inventory", inventoryRoutes)
app.use("/api/payment", paymentRoutes)
app.use("/api/cart", cartRoutes)

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Pizza Delivery API is running!",
    status: "success",
    timestamp: new Date().toISOString(),
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

export default app
