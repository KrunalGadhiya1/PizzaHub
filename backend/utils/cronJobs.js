import cron from "node-cron"
import Inventory from "../models/Inventory.js"
import * as emailUtils from "./sendEmail.js"

// Check for low stock every day at 9 AM
cron.schedule("0 9 * * *", async() => {
    try {
        console.log("Running low stock check...")

        const lowStockItems = await Inventory.find({ isLowStock: true })

        if (lowStockItems.length > 0) {
            await emailUtils.sendLowStockAlert(lowStockItems)
        }

        console.log(`Low stock check completed. Found ${lowStockItems.length} items.`)
    } catch (error) {
        console.error("Error in low stock check:", error)
    }
})

console.log("Cron jobs initialized")