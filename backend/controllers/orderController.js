import Order from "../models/Order.js"
import User from "../models/User.js"
import Pizza from "../models/Pizza.js"
import Inventory from "../models/Inventory.js"
import { successResponse, errorResponse } from "../utils/responseHandler.js"
import { createRazorpayOrder, verifyRazorpayPayment } from "../utils/razorpay.js"
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from "../utils/sendEmail.js"
import { updateInventory } from "../utils/updateInventory.js"

// @desc    Create order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    console.log('🔍 Create Order Request:', {
      items: req.body.items,
      paymentMethod: req.body.paymentMethod,
      deliveryAddress: req.body.deliveryAddress
    })

    const { items, paymentMethod, deliveryAddress, notes } = req.body

    // Validate items
    if (!items || items.length === 0) {
      console.log('❌ No items in order')
      return errorResponse(res, "No items in order", 400)
    }

    // Calculate total amount and process items
    let totalAmount = 0
    const processedItems = []

    for (const item of items) {
      let itemPrice = 0
      let pizzaDetails = null

      if (item.pizza) {
        // Regular pizza
        const pizza = await Pizza.findById(item.pizza)
        if (!pizza) {
          console.log('❌ Pizza not found:', item.pizza)
          return errorResponse(res, `Pizza not found: ${item.pizza}`, 404)
        }
        // Find the correct size object
        const sizeObj = pizza.sizes.find(s => s.size === item.size);
        if (!sizeObj) {
          console.log(`❌ Size ${item.size} not available for pizza:`, pizza.name);
          return errorResponse(res, `Size ${item.size} not available for this pizza`, 400);
        }
        pizzaDetails = {
          name: pizza.name,
          image: pizza.image,
          price: sizeObj.price
        }
        itemPrice = sizeObj.price
      } else if (item.customPizza) {
        // Custom pizza
        const { base, sauce, cheese, veggies, meat, size, totalPrice } = item.customPizza;

        // Validate required ingredients
        if (!base?.name || !sauce?.name || !cheese?.name) {
          console.log('❌ Missing required custom pizza ingredients:', { base, sauce, cheese });
          return errorResponse(res, "Missing required custom pizza ingredients", 400);
        }

        // Calculate custom pizza price
        itemPrice = totalPrice || (
          base.price +
          sauce.price +
          cheese.price +
          (veggies?.reduce((sum, v) => sum + (v.price || 0), 0) || 0) +
          (meat?.reduce((sum, m) => sum + (m.price || 0), 0) || 0)
        );

        pizzaDetails = {
          name: "Custom Pizza",
          image: "/images/custom-pizza.jpg",
          price: itemPrice,
          customDetails: {
            base,
            sauce,
            cheese,
            veggies: veggies || [],
            meat: meat || []
          }
        };
      }

      processedItems.push({
        pizza: item.pizza,
        customPizza: item.customPizza,
        quantity: item.quantity,
        size: item.size,
        price: itemPrice,
        pizzaDetails
      })

      totalAmount += itemPrice * item.quantity
    }

    console.log('✅ Order items processed:', {
      totalAmount,
      itemCount: processedItems.length
    })

    // Generate order number
    const count = await Order.countDocuments()
    const orderNumber = `PZ${Date.now().toString().slice(-6)}${String(count + 1).padStart(4, "0")}`

    // Convert deliveryAddress object to string if needed
    const formattedAddress = typeof deliveryAddress === 'object' ? 
      `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}` : 
      deliveryAddress

    // Create order
    const order = new Order({
      orderNumber,
      user: req.user._id,
      items: processedItems,
      totalAmount,
      paymentMethod,
      deliveryAddress: formattedAddress,
      notes,
      status: paymentMethod === "cod" ? "confirmed" : "pending",
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
    })

    // If payment method is Razorpay, create Razorpay order
    let razorpayOrder = null
    if (paymentMethod === "razorpay") {
      try {
        console.log('🔍 Creating Razorpay order:', {
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          receipt: orderNumber,
          env: {
            keyIdExists: !!process.env.RAZORPAY_KEY_ID,
            keySecretExists: !!process.env.RAZORPAY_KEY_SECRET,
            nodeEnv: process.env.NODE_ENV
          }
        })

        razorpayOrder = await createRazorpayOrder({
          amount: Math.round(totalAmount * 100), // Convert to paise and ensure it's an integer
          currency: "INR",
          receipt: orderNumber,
          notes: {
            orderId: order._id.toString(),
            userId: req.user._id.toString(),
          },
        })

        if (!razorpayOrder || !razorpayOrder.id) {
          console.error('❌ Failed to create Razorpay order:', razorpayOrder)
          throw new Error("Failed to create Razorpay order")
        }

        console.log('✅ Razorpay order created:', {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount
        })

        order.razorpayOrderId = razorpayOrder.id
      } catch (error) {
        console.error("❌ Razorpay order creation failed:", {
          error: error.message,
          stack: error.stack,
          code: error.code,
          statusCode: error.statusCode,
          details: error.error?.description || "No additional details"
        })
        return errorResponse(res, "Failed to create payment order", 500)
      }
    }

    // Save order
    await order.save()
    console.log('✅ Order saved:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status
    })

    // Add order to user's orders
    await User.findByIdAndUpdate(req.user._id, {
      $push: { orders: order._id },
    })

    // Update inventory for custom pizza
    if (paymentMethod === "cod") {
      await updateInventory(order)
    }

    // Skip email notification for now
    // await sendOrderConfirmationEmail(req.user.email, order)

    successResponse(res, "Order created successfully", 201, {
      order,
      razorpayOrder: razorpayOrder
        ? {
            id: razorpayOrder.id,
            amount: Math.round(totalAmount * 100),
            currency: "INR",
          }
        : null,
    })
  } catch (error) {
    console.error('❌ Order creation error:', error)
    next(error)
  }
}

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, search, sort, page = 1, limit = 10 } = req.query

    // Build query
    const query = {}

    // Filter by status
    if (status) {
      query.status = status
    }

    // Search by order number
    if (search) {
      query.orderNumber = { $regex: search, $options: "i" }
    }

    // Count total documents
    const total = await Order.countDocuments(query)

    // Build sort object
    let sortObj = {}
    if (sort) {
      const [field, order] = sort.split(":")
      sortObj[field] = order === "desc" ? -1 : 1
    } else {
      sortObj = { createdAt: -1 } // Default sort by newest
    }

    // Pagination
    const skip = (page - 1) * limit

    // Get orders
    const orders = await Order.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate("user", "name email")
      .populate("items.pizza", "name image")

    successResponse(res, "Orders fetched successfully", 200, {
      orders,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getUserOrders = async (req, res, next) => {
  try {
    const { status, sort, page = 1, limit = 10 } = req.query

    // Build query
    const query = { user: req.user._id }

    // Filter by status
    if (status) {
      query.status = status
    }

    // Count total documents
    const total = await Order.countDocuments(query)

    // Build sort object
    let sortObj = {}
    if (sort) {
      const [field, order] = sort.split(":")
      sortObj[field] = order === "desc" ? -1 : 1
    } else {
      sortObj = { createdAt: -1 } // Default sort by newest
    }

    // Pagination
    const skip = (page - 1) * limit

    // Get orders
    const orders = await Order.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate("items.pizza", "name image")

    successResponse(res, "Orders fetched successfully", 200, {
      orders,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.pizza", "name image")

    if (!order) {
      return errorResponse(res, "Order not found", 404)
    }

    // Check if user is authorized to view this order
    if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, "Not authorized to access this order", 403)
    }

    successResponse(res, "Order fetched successfully", 200, { order })
  } catch (error) {
    next(error)
  }
}

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body

    // Find order
    const order = await Order.findById(req.params.id)

    if (!order) {
      return errorResponse(res, "Order not found", 404)
    }

    // Validate status
    const validStatuses = ["confirmed", "preparing", "ready", "out-for-delivery", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return errorResponse(res, "Invalid status", 400)
    }

    // Update status
    order.status = status

    // Add status to history
    order.statusHistory.push({
      status,
      timestamp: Date.now(),
      updatedBy: req.user._id,
    })

    // If status is cancelled, refund payment if paid
    if (status === "cancelled" && order.paymentStatus === "completed") {
      order.paymentStatus = "refunded"
    }

    // If status is delivered, update payment status for COD
    if (status === "delivered" && order.paymentMethod === "cod") {
      order.paymentStatus = "completed"
    }

    // Update actual delivery time if delivered
    if (status === "delivered") {
      order.actualDeliveryTime = Date.now()
    }

    // Save updated order
    await order.save()

    // Populate user data for email
    const populatedOrder = await Order.findById(order._id).populate("user", "email")

    // Send order status update email
    await sendOrderStatusUpdateEmail(populatedOrder)

    successResponse(res, "Order status updated successfully", 200, { order })
  } catch (error) {
    next(error)
  }
}

// @desc    Verify Razorpay payment
// @route   POST /api/orders/verify-payment
// @access  Private
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Verify the payment signature
    const isValid = verifyRazorpayPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return errorResponse(res, "Invalid payment signature", 400);
    }

    // Update order status
    order.status = "confirmed";
    order.paymentStatus = "completed";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    // Update inventory for the order
    await updateInventory(order);

    // Skip email notification for now
    // await sendOrderConfirmationEmail(req.user.email, order);

    successResponse(res, "Payment verified successfully", 200, { order });
  } catch (error) {
    next(error);
  }
};
