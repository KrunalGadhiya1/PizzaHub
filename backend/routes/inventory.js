import express from "express"
import {
    getAllInventory,
    getInventoryById,
    createInventory,
    updateInventory,
    deleteInventory,
    getInventoryByType,
    getLowStockInventory,
    restockInventory,
} from "../controllers/inventoryController.js"
import { protect, authorize } from "../middleware/auth.js"
import { inventoryValidation, validate } from "../middleware/validator.js"
import { upload } from "../utils/fileUpload.js"

const router = express.Router()

// Public routes
router.get("/type/:type", getInventoryByType)

// Admin routes
router.use(protect, authorize("admin"))
router.get("/", getAllInventory)
router.get("/low-stock", getLowStockInventory)
router.get("/:id", getInventoryById)
router.post("/", upload.single("image"), inventoryValidation, validate, createInventory)
router.put("/:id", upload.single("image"), updateInventory)
router.put("/:id/restock", restockInventory)
router.delete("/:id", deleteInventory)

export default router