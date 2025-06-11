import Inventory from "../models/Inventory.js"
import Pizza from "../models/Pizza.js"

// Update inventory quantities after order placement
export const updateInventory = async (order) => {
    if (!order || !Array.isArray(order.items)) {
        console.error("updateInventory: order.items is not an array or missing", order);
        return;
    }
    try {
        for (const item of order.items) {
            if (item.customPizza) {
                // Update base inventory
                await Inventory.findByIdAndUpdate(item.customPizza.base.id, {
                    $inc: { quantity: -item.quantity },
                })

                // Update sauce inventory
                await Inventory.findByIdAndUpdate(item.customPizza.sauce.id, {
                    $inc: { quantity: -item.quantity },
                })

                // Update cheese inventory
                await Inventory.findByIdAndUpdate(item.customPizza.cheese.id, {
                    $inc: { quantity: -item.quantity },
                })

                // Update veggies inventory
                for (const veggie of item.customPizza.veggies) {
                    await Inventory.findByIdAndUpdate(veggie.id, {
                        $inc: { quantity: -item.quantity },
                    })
                }

                // Update meat inventory if any
                if (item.customPizza.meat && item.customPizza.meat.length > 0) {
                    for (const meat of item.customPizza.meat) {
                        await Inventory.findByIdAndUpdate(meat.id, {
                            $inc: { quantity: -item.quantity },
                        })
                    }
                }
            } else if (item.pizza) {
                // For pre-defined pizzas, update their ingredients
                const pizza = await Pizza.findById(item.pizza).populate("ingredients")
                for (const ingredient of pizza.ingredients) {
                    await Inventory.findByIdAndUpdate(ingredient.id, {
                        $inc: { quantity: -item.quantity },
                    })
                }
            }
        }

        // Check for low stock after updates
        const lowStockItems = await Inventory.find({
            $expr: {
                $lte: ["$quantity", "$threshold"],
            },
        })

        if (lowStockItems.length > 0) {
            await sendLowStockAlert(lowStockItems)
        }
    } catch (error) {
        console.error("Error updating inventory:", error)
        throw error
    }
}