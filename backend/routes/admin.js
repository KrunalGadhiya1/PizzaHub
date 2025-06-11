import express from "express"
import { protect } from "../middleware/auth.js"
import { requireAdmin } from "../middleware/roleMiddleware.js"
import Order from "../models/Order.js"
import User from "../models/User.js"
import Pizza from "../models/Pizza.js"
import Inventory from "../models/Inventory.js"
import { successResponse } from "../utils/responseHandler.js"

const router = express.Router()

// Admin only routes
router.use(protect, requireAdmin)

// Dashboard stats
router.get("/dashboard", async(req, res, next) => {
    try {
        const totalOrders = await Order.countDocuments()
        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: "completed" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ])
        const activeUsers = await User.countDocuments({ isEmailVerified: true })
        const pendingOrders = await Order.countDocuments({ status: "pending" })
        const lowStockItems = await Inventory.find({ quantity: { $lt: "$threshold" } })

        const stats = {
            totalOrders,
            totalRevenue: totalRevenue[0] && totalRevenue[0].total ? totalRevenue[0].total : 0,
            activeUsers,
            pendingOrders,
            lowStockItems,
        }

        successResponse(res, "Dashboard stats fetched successfully", 200, stats)
    } catch (error) {
        next(error)
    }
})

export default router