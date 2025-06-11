import mongoose from "mongoose"

const pizzaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["veg", "non-veg", "premium"],
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sizes: [
      {
        size: {
          type: String,
          enum: ["small", "medium", "large"],
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    ingredients: [
      {
        type: String,
        required: true,
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("Pizza", pizzaSchema)
