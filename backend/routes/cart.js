import express from "express";
import {
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
  getCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Protect all cart routes
router.use(protect);

// Cart routes
router.get("/", getCart);
router.post("/add", addToCart);
router.delete("/remove/:itemId", removeFromCart);
router.put("/update/:itemId", updateCartItem);
router.delete("/clear", clearCart);

export default router; 