import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env vars from the root directory
dotenv.config({ path: path.join(__dirname, "..", ".env") })

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://gadhiyakunal7:iaSjWnw6w3aj9Lm8@cluster0.l2pqbni.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

export const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB at:", MONGODB_URI)
    const conn = await mongoose.connect(MONGODB_URI)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
} 