import express from "express"
import {
    getAllPizzas,
    getPizzaById,
    createPizza,
    updatePizza,
    deletePizza,
    addReview,
} from "../controllers/pizzaController.js"
import { protect, authorize } from "../middleware/auth.js"
import { pizzaValidation, validate } from "../middleware/validator.js"
import { upload } from "../utils/fileUpload.js"

const router = express.Router()

// Public routes
router.get("/", getAllPizzas)
router.get("/:id", getPizzaById)

// Protected routes
router.use(protect)
router.post("/:id/reviews", addReview)

// Admin routes
router.post("/", authorize("admin"), upload.single("image"), pizzaValidation, validate, createPizza)
router.put("/:id", authorize("admin"), upload.single("image"), updatePizza)
router.delete("/:id", authorize("admin"), deletePizza)

export default router