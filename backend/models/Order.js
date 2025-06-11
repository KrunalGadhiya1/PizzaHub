import mongoose from "mongoose"

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        pizza: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Pizza",
        },
        customPizza: {
          base: {
            id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Inventory",
            },
            name: String,
            price: Number,
          },
          sauce: {
            id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Inventory",
            },
            name: String,
            price: Number,
          },
          cheese: {
            id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Inventory",
            },
            name: String,
            price: Number,
          },
          veggies: [
            {
              id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Inventory",
              },
              name: String,
              price: Number,
            },
          ],
          meat: [
            {
              id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Inventory",
              },
              name: String,
              price: Number,
            },
          ],
          size: {
            type: String,
            enum: ["small", "medium", "large"],
          },
          totalPrice: Number,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "out-for-delivery", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      required: true,
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    deliveryAddress: {
      type: String,
      required: true,
    },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    notes: String,
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Generate order number
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments()
    this.orderNumber = `PZ${Date.now().toString().slice(-6)}${String(count + 1).padStart(4, "0")}`
  }

  // Add status to history if it's a new status or the first status
  const lastStatus = this.statusHistory.length > 0 ? this.statusHistory[this.statusHistory.length - 1].status : null

  if (!lastStatus || lastStatus !== this.status) {
    this.statusHistory.push({
      status: this.status,
      timestamp: Date.now(),
      updatedBy: this.user, // Default to user, can be overridden
    })
  }

  next()
})

export default mongoose.model("Order", orderSchema)
