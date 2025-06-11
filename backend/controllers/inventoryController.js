import Inventory from "../models/Inventory.js"
import { successResponse, errorResponse } from "../utils/responseHandler.js"
import { uploadImage } from "../utils/fileUpload.js"
import { sendLowStockAlert } from "../utils/sendEmail.js"

// Check and send low stock alerts
const checkLowStock = async () => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: {
        $lte: ["$quantity", "$threshold"]
      }
    }).sort({ quantity: 1 })

    if (lowStockItems.length > 0) {
      await sendLowStockAlert(lowStockItems)
    }

    return lowStockItems
  } catch (error) {
    console.error("Error checking low stock:", error)
  }
}

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private/Admin
export const getAllInventory = async (req, res, next) => {
  try {
    const { itemType, search, sort, page = 1, limit = 10 } = req.query

    // Build query
    const query = {}

    // Filter by item type
    if (itemType) {
      query.itemType = itemType
    }

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    // Count total documents
    const total = await Inventory.countDocuments(query)

    // Build sort object
    let sortObj = {}
    if (sort) {
      const [field, order] = sort.split(":")
      sortObj[field] = order === "desc" ? -1 : 1
    } else {
      sortObj = { itemType: 1, name: 1 } // Default sort by item type and name
    }

    // Pagination
    const skip = (page - 1) * limit

    // Get inventory items
    const inventory = await Inventory.find(query).sort(sortObj).skip(skip).limit(Number.parseInt(limit))

    successResponse(res, "Inventory fetched successfully", 200, {
      inventory,
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

// @desc    Get inventory item by ID
// @route   GET /api/inventory/:id
// @access  Private/Admin
export const getInventoryById = async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id)

    if (!inventory) {
      return errorResponse(res, "Inventory item not found", 404)
    }

    successResponse(res, "Inventory item fetched successfully", 200, { inventory })
  } catch (error) {
    next(error)
  }
}

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private/Admin
export const createInventory = async (req, res, next) => {
  try {
    const { itemType, name, quantity, unit, price, threshold, supplier } = req.body

    // Check if inventory item with same name and type exists
    const inventoryExists = await Inventory.findOne({ name, itemType })

    if (inventoryExists) {
      return errorResponse(res, "Inventory item with this name and type already exists", 400)
    }

    // Upload image if provided
    let image = ""
    if (req.file) {
      image = await uploadImage(req.file)
    } else if (req.body.image) {
      image = req.body.image
    }

    // Create inventory item
    const inventory = await Inventory.create({
      itemType,
      name,
      quantity,
      unit,
      price,
      threshold: threshold || process.env[`${itemType.toUpperCase()}_THRESHOLD`] || 20,
      supplier,
      image,
    })

    // Check if low stock
    inventory.checkLowStock()
    await inventory.save()

    successResponse(res, "Inventory item created successfully", 201, { inventory })
  } catch (error) {
    next(error)
  }
}

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private/Admin
export const updateInventory = async (req, res, next) => {
  try {
    const { itemType, name, quantity, unit, price, threshold, supplier } = req.body

    // Find inventory item
    const inventory = await Inventory.findById(req.params.id)

    if (!inventory) {
      return errorResponse(res, "Inventory item not found", 404)
    }

    // Check if inventory item with same name and type exists (except this one)
    if (name && itemType && (name !== inventory.name || itemType !== inventory.itemType)) {
      const inventoryExists = await Inventory.findOne({ name, itemType })

      if (inventoryExists) {
        return errorResponse(res, "Inventory item with this name and type already exists", 400)
      }
    }

    // Upload image if provided
    let image = inventory.image
    if (req.file) {
      image = await uploadImage(req.file)
    } else if (req.body.image && req.body.image !== inventory.image) {
      image = req.body.image
    }

    // Update inventory item
    inventory.itemType = itemType || inventory.itemType
    inventory.name = name || inventory.name
    inventory.quantity = quantity !== undefined ? quantity : inventory.quantity
    inventory.unit = unit || inventory.unit
    inventory.price = price !== undefined ? price : inventory.price
    inventory.threshold = threshold !== undefined ? threshold : inventory.threshold
    inventory.supplier = supplier || inventory.supplier
    inventory.image = image

    // Check if low stock
    const wasLowStock = inventory.isLowStock
    inventory.checkLowStock()

    // Send email if stock is now low but wasn't before
    if (inventory.isLowStock && !wasLowStock) {
      await sendLowStockAlert([inventory])
    }

    await inventory.save()

    successResponse(res, "Inventory item updated successfully", 200, { inventory })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private/Admin
export const deleteInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id)

    if (!inventory) {
      return errorResponse(res, "Inventory item not found", 404)
    }

    await inventory.deleteOne()

    successResponse(res, "Inventory item deleted successfully", 200)
  } catch (error) {
    next(error)
  }
}

// @desc    Get inventory by type
// @route   GET /api/inventory/type/:type
// @access  Public
export const getInventoryByType = async (req, res, next) => {
  try {
    const { type } = req.params

    // Validate type
    const validTypes = ["base", "sauce", "cheese", "veggie", "meat"]
    if (!validTypes.includes(type)) {
      return errorResponse(res, "Invalid inventory type", 400)
    }

    // Get inventory items
    const inventory = await Inventory.find({ itemType: type, quantity: { $gt: 0 } }).sort({ name: 1 })

    successResponse(res, `${type} inventory fetched successfully`, 200, { inventory })
  } catch (error) {
    next(error)
  }
}

// @desc    Get low stock inventory
// @route   GET /api/inventory/low-stock
// @access  Private/Admin
export const getLowStockInventory = async (req, res, next) => {
  try {
    const lowStockItems = await checkLowStock()
    successResponse(res, "Low stock inventory fetched successfully", 200, { inventory: lowStockItems })
  } catch (error) {
    next(error)
  }
}

// @desc    Restock inventory
// @route   PUT /api/inventory/:id/restock
// @access  Private/Admin
export const restockInventory = async (req, res, next) => {
  try {
    const { quantity } = req.body

    // Find inventory item
    const inventory = await Inventory.findById(req.params.id)

    if (!inventory) {
      return errorResponse(res, "Inventory item not found", 404)
    }

    // Update quantity
    inventory.quantity += Number(quantity)
    inventory.lastRestocked = Date.now()

    // Save and check for low stock
    await inventory.save()
    await checkLowStock()

    successResponse(res, "Inventory restocked successfully", 200, { inventory })
  } catch (error) {
    next(error)
  }
}
