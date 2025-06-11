import mongoose from "mongoose";
import User from "../models/User.js";
import Pizza from "../models/Pizza.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { pizzaId, size, quantity, price, customPizza } = req.body;
    console.log("Add to cart request:", { pizzaId, size, quantity, price, customPizza }); // Debug log

    // Find user and populate cart
    const user = await User.findById(req.user._id).populate("cart.pizza");
    console.log("Found user:", user._id); // Debug log

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Handle custom pizza
    if (pizzaId.startsWith('custom-')) {
      // For custom pizzas, we don't need to validate against the Pizza model
      const cartItem = {
        pizza: null, // No reference to Pizza model for custom pizzas
        size,
        quantity,
        price,
        customPizza: {
          base: {
            _id: customPizza.base._id,
            name: customPizza.base.name,
            cost: customPizza.base.cost,
            itemType: customPizza.base.itemType,
            image: customPizza.base.image,
            quantity: customPizza.base.quantity
          },
          sauce: {
            _id: customPizza.sauce._id,
            name: customPizza.sauce.name,
            cost: customPizza.sauce.cost,
            itemType: customPizza.sauce.itemType,
            image: customPizza.sauce.image,
            quantity: customPizza.sauce.quantity
          },
          cheese: {
            _id: customPizza.cheese._id,
            name: customPizza.cheese.name,
            cost: customPizza.cheese.cost,
            itemType: customPizza.cheese.itemType,
            image: customPizza.cheese.image,
            quantity: customPizza.cheese.quantity
          },
          veggies: customPizza.veggies.map(v => ({
            _id: v._id,
            name: v.name,
            cost: v.cost,
            itemType: v.itemType,
            image: v.image,
            quantity: v.quantity
          })),
          image: customPizza.image || "/images/custom-pizza.jpg",
          name: customPizza.name || "Custom Pizza",
          description: customPizza.description
        }
      };

      user.cart.push(cartItem);
      await user.save();

      return successResponse(res, "Custom pizza added to cart", 200, {
        items: user.cart,
      });
    }

    // Handle regular pizzas
    if (!mongoose.Types.ObjectId.isValid(pizzaId)) {
      // For testing: Accept dummy pizza IDs
      if (pizzaId === "65f2d7a51a5f8b3c58f1b123" || pizzaId === "65f2d7a51a5f8b3c58f1b124") {
        const dummyPizzas = {
          "65f2d7a51a5f8b3c58f1b123": {
            _id: "65f2d7a51a5f8b3c58f1b123",
            name: "Margherita",
            sizes: [
              { size: "small", price: 299 },
              { size: "medium", price: 399 },
              { size: "large", price: 499 }
            ],
            isAvailable: true
          },
          "65f2d7a51a5f8b3c58f1b124": {
            _id: "65f2d7a51a5f8b3c58f1b124",
            name: "Pepperoni",
            sizes: [
              { size: "small", price: 399 },
              { size: "medium", price: 499 },
              { size: "large", price: 599 }
            ],
            isAvailable: true
          }
        };

        const dummyPizza = dummyPizzas[pizzaId];
        
        // Validate size and price
        const sizeObj = dummyPizza.sizes.find(s => s.size === size);
        if (!sizeObj) {
          return errorResponse(res, `Size ${size} not available for this pizza`, 400);
        }

        if (sizeObj.price !== price) {
          return errorResponse(res, "Price mismatch. Please try again.", 400);
        }

        // Check if pizza already exists in cart
        const cartItemIndex = user.cart.findIndex(
          (item) => item.pizza?.toString() === pizzaId && item.size === size
        );

        if (cartItemIndex > -1) {
          // Update quantity if pizza exists
          user.cart[cartItemIndex].quantity += quantity;
        } else {
          // Add new item if pizza doesn't exist
          user.cart.push({
            pizza: pizzaId,
            size,
            quantity,
            price,
          });
        }

        await user.save();

        return successResponse(res, "Item added to cart", 200, {
          items: user.cart,
        });
      }
      return errorResponse(res, "Invalid pizza ID", 400);
    }

    // Find pizza
    const pizza = await Pizza.findById(pizzaId);
    console.log("Found pizza:", pizza?._id || "Not found"); // Debug log

    if (!pizza) {
      return errorResponse(res, `Pizza not found with ID: ${pizzaId}`, 404);
    }

    // Check if pizza is available
    if (!pizza.isAvailable) {
      return errorResponse(res, "Pizza is not available", 400);
    }

    // Validate size and price
    const sizeObj = pizza.sizes.find(s => s.size === size);
    if (!sizeObj) {
      return errorResponse(res, `Size ${size} not available for this pizza`, 400);
    }

    if (sizeObj.price !== price) {
      return errorResponse(res, "Price mismatch. Please try again.", 400);
    }

    // Check if pizza already exists in cart
    const cartItemIndex = user.cart.findIndex(
      (item) => item.pizza?.toString() === pizzaId && item.size === size
    );

    if (cartItemIndex > -1) {
      // Update quantity if pizza exists
      user.cart[cartItemIndex].quantity += quantity;
    } else {
      // Add new item if pizza doesn't exist
      user.cart.push({
        pizza: pizzaId,
        size,
        quantity,
        price,
      });
    }

    await user.save();

    // Populate cart items before sending response
    await user.populate("cart.pizza");

    successResponse(res, "Item added to cart", 200, {
      items: user.cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    errorResponse(res, error.message || "Failed to add item to cart", 500);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Remove item from cart
    user.cart = user.cart.filter((item) => item._id.toString() !== itemId);
    await user.save();

    // Populate cart items before sending response
    await user.populate("cart.pizza");

    successResponse(res, "Item removed from cart", 200, {
      items: user.cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    errorResponse(res, "Failed to remove item from cart", 500);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update/:itemId
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Find and update item quantity
    const cartItem = user.cart.id(itemId);
    if (!cartItem) {
      return errorResponse(res, "Cart item not found", 404);
    }

    cartItem.quantity = quantity;
    await user.save();

    // Populate cart items before sending response
    await user.populate("cart.pizza");

    successResponse(res, "Cart item updated", 200, {
      items: user.cart,
    });
  } catch (error) {
    console.error("Update cart error:", error);
    errorResponse(res, "Failed to update cart item", 500);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    user.cart = [];
    await user.save();

    successResponse(res, "Cart cleared", 200, {
      items: [],
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    errorResponse(res, "Failed to clear cart", 500);
  }
};

// @desc    Get cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.pizza");
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    successResponse(res, "Cart fetched successfully", 200, {
      items: user.cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    errorResponse(res, "Failed to fetch cart", 500);
  }
}; 