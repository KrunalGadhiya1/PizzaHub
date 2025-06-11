import { body, validationResult } from "express-validator"
import { errorResponse } from "../utils/responseHandler.js"

// Validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array()
    })
  }
  next()
}

// Register validation rules
export const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    )
]

// Login validation rules
export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
]

// Reset password validation rules
export const validateResetPassword = [
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    )
]

// Pizza validation rules
export const pizzaValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("category").isIn(["veg", "non-veg", "premium"]).withMessage("Category must be veg, non-veg, or premium"),
  body("basePrice").isNumeric().withMessage("Base price must be a number"),
  body("sizes").isArray().withMessage("Sizes must be an array"),
  body("sizes.*.size").isIn(["small", "medium", "large"]).withMessage("Size must be small, medium, or large"),
  body("sizes.*.price").isNumeric().withMessage("Price must be a number"),
  body("ingredients").isArray().withMessage("Ingredients must be an array"),
]

// Order validation rules
export const orderValidation = [
  body("items").isArray().withMessage("Items must be an array"),
  body("items.*.quantity").isNumeric().withMessage("Quantity must be a number"),
  body("items.*.size").isIn(["small", "medium", "large"]).withMessage("Size must be small, medium, or large"),
  body("paymentMethod").isIn(["razorpay", "cod"]).withMessage("Payment method must be razorpay or cod"),
  body("deliveryAddress").notEmpty().withMessage("Delivery address is required"),
  body("notes").optional().isString().withMessage("Notes must be a string")
]

// Payment verification validation rules
export const paymentVerificationValidation = [
  body("orderId").notEmpty().withMessage("Order ID is required"),
  body("razorpayOrderId").notEmpty().withMessage("Razorpay Order ID is required"),
  body("razorpayPaymentId").notEmpty().withMessage("Razorpay Payment ID is required"),
  body("razorpaySignature").notEmpty().withMessage("Razorpay Signature is required")
]

// Inventory validation rules
export const inventoryValidation = [
  body("itemType")
    .isIn(["base", "sauce", "cheese", "veggie", "meat"])
    .withMessage("Item type must be base, sauce, cheese, veggie, or meat"),
  body("name").notEmpty().withMessage("Name is required"),
  body("quantity").isNumeric().withMessage("Quantity must be a number"),
  body("unit").notEmpty().withMessage("Unit is required"),
  body("price").isNumeric().withMessage("Price must be a number"),
  body("threshold").isNumeric().withMessage("Threshold must be a number"),
]

// Payment validation rules
export const paymentValidation = [
  body("orderId").notEmpty().withMessage("Order ID is required"),
  body("razorpayOrderId").notEmpty().withMessage("Razorpay Order ID is required"),
  body("razorpayPaymentId").notEmpty().withMessage("Razorpay Payment ID is required"),
  body("razorpaySignature").notEmpty().withMessage("Razorpay Signature is required")
]
