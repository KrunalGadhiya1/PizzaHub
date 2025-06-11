import express from "express"
import {
    createOrder,
    getAllOrders,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    verifyPayment
} from "../controllers/orderController.js"
import { protect, authorize } from "../middleware/auth.js"
import { orderValidation, paymentVerificationValidation, validate } from "../middleware/validator.js"

const router = express.Router()

// Protected routes
router.use(protect)
router.post("/", orderValidation, validate, createOrder)
router.post("/verify-payment", paymentVerificationValidation, validate, verifyPayment)
router.get("/my-orders", getUserOrders)
router.get("/:id", getOrderById)

// Admin routes
router.get("/", authorize("admin"), getAllOrders)
router.put("/:id/status", authorize("admin"), updateOrderStatus)

export default router