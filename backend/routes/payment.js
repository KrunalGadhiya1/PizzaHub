import express from "express"
import { protect } from "../middleware/auth.js"
import { verifyRazorpayPayment } from "../utils/razorpay.js"
import { paymentValidation, validate } from "../middleware/validator.js"
import Order from "../models/Order.js"
import { successResponse, errorResponse } from "../utils/responseHandler.js"
import { updateInventory } from "../utils/updateInventory.js"
import { initializeRazorpay } from "../utils/razorpay.js"

const router = express.Router()

// Debug middleware
router.use((req, res, next) => {
    console.log('🔍 Payment Route Hit:', {
        method: req.method,
        path: req.path,
        body: req.body,
        headers: {
            authorization: req.headers.authorization ? 'Bearer [HIDDEN]' : 'No token'
        }
    })
    next()
})

// Test Razorpay configuration
router.get("/test-config", protect, async (req, res) => {
    try {
        console.log('🔍 Testing Razorpay configuration...');
        
        // Log environment variables (masked)
        console.log('Environment variables:', {
            keyIdExists: !!process.env.RAZORPAY_KEY_ID,
            keyIdStart: process.env.RAZORPAY_KEY_ID?.substring(0, 8),
            keySecretExists: !!process.env.RAZORPAY_KEY_SECRET,
            nodeEnv: process.env.NODE_ENV
        });

        // Initialize Razorpay
        const razorpay = initializeRazorpay();
        
        // Test connection by fetching orders
        const orders = await razorpay.orders.all();
        
        successResponse(res, "Razorpay configuration is working", 200, {
            config: {
                keyIdExists: !!process.env.RAZORPAY_KEY_ID,
                keyIdStart: process.env.RAZORPAY_KEY_ID?.substring(0, 8),
                keySecretExists: !!process.env.RAZORPAY_KEY_SECRET,
                nodeEnv: process.env.NODE_ENV
            },
            connection: "success",
            ordersCount: orders.items?.length || 0
        });
    } catch (error) {
        console.error('❌ Razorpay configuration test failed:', {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            details: error.error?.description || "No additional details"
        });
        
        errorResponse(res, "Razorpay configuration test failed: " + error.message, 500);
    }
});

// Protected routes
router.use(protect)

// Verify payment
router.post("/verify", paymentValidation, validate, async(req, res, next) => {
    try {
        console.log('🔍 Payment Verification Request:', req.body)
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body

        // Find the order
        const order = await Order.findById(orderId)
        if (!order) {
            console.log('❌ Order not found:', orderId)
            return errorResponse(res, "Order not found", 404)
        }

        console.log('✅ Order found:', {
            orderId: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus
        })

        // Verify payment signature
        const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)
        console.log('🔍 Payment signature verification:', { isValid })

        if (!isValid) {
            console.log('❌ Invalid payment signature')
            return errorResponse(res, "Invalid payment signature", 400)
        }

        // Update order
        order.paymentStatus = "completed"
        order.razorpayPaymentId = razorpayPaymentId
        order.status = "confirmed"
        await order.save()

        console.log('✅ Order updated:', {
            orderId: order._id,
            newStatus: order.status,
            newPaymentStatus: order.paymentStatus
        })

        // Update inventory
        await updateInventory(order)

        successResponse(res, "Payment verified successfully", 200, { order })
    } catch (error) {
        console.error('❌ Payment verification error:', error)
        next(error)
    }
})

export default router