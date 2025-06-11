import mongoose from "mongoose"
import Inventory from "../models/Inventory.js"
import { config } from "dotenv"

config()

const inventoryData = [
  // Pizza Bases
  {
    name: "Thin Crust",
    itemType: "base",
    quantity: 100,
    unit: "pieces",
    threshold: 20,
    cost: 100,
    supplier: {
      name: "Base Suppliers Ltd",
      contact: "+91-9876543210",
      email: "bases@supplier.com",
    },
  },
  {
    name: "Thick Crust",
    itemType: "base",
    quantity: 100,
    unit: "pieces",
    threshold: 20,
    cost: 120,
    supplier: {
      name: "Base Suppliers Ltd",
      contact: "+91-9876543210",
      email: "bases@supplier.com",
    },
  },
  {
    name: "Cheese Burst",
    itemType: "base",
    quantity: 80,
    unit: "pieces",
    threshold: 15,
    cost: 150,
    supplier: {
      name: "Base Suppliers Ltd",
      contact: "+91-9876543210",
      email: "bases@supplier.com",
    },
  },
  {
    name: "Whole Wheat",
    itemType: "base",
    quantity: 80,
    unit: "pieces",
    threshold: 15,
    cost: 130,
    supplier: {
      name: "Base Suppliers Ltd",
      contact: "+91-9876543210",
      email: "bases@supplier.com",
    },
  },
  {
    name: "Gluten Free",
    itemType: "base",
    quantity: 50,
    unit: "pieces",
    threshold: 10,
    cost: 140,
    supplier: {
      name: "Base Suppliers Ltd",
      contact: "+91-9876543210",
      email: "bases@supplier.com",
    },
  },

  // Sauces
  {
    name: "Tomato Basil",
    itemType: "sauce",
    quantity: 50,
    unit: "l",
    threshold: 10,
    cost: 50,
    supplier: {
      name: "Sauce Kings",
      contact: "+91-9876543211",
      email: "sauces@supplier.com",
    },
  },
  {
    name: "Barbecue",
    itemType: "sauce",
    quantity: 40,
    unit: "l",
    threshold: 8,
    cost: 60,
    supplier: {
      name: "Sauce Kings",
      contact: "+91-9876543211",
      email: "sauces@supplier.com",
    },
  },
  {
    name: "Pesto",
    itemType: "sauce",
    quantity: 30,
    unit: "l",
    threshold: 6,
    cost: 70,
    supplier: {
      name: "Sauce Kings",
      contact: "+91-9876543211",
      email: "sauces@supplier.com",
    },
  },
  {
    name: "Alfredo",
    itemType: "sauce",
    quantity: 30,
    unit: "l",
    threshold: 6,
    cost: 80,
    supplier: {
      name: "Sauce Kings",
      contact: "+91-9876543211",
      email: "sauces@supplier.com",
    },
  },
  {
    name: "Garlic Ranch",
    itemType: "sauce",
    quantity: 35,
    unit: "l",
    threshold: 7,
    cost: 65,
    supplier: {
      name: "Sauce Kings",
      contact: "+91-9876543211",
      email: "sauces@supplier.com",
    },
  },

  // Cheeses
  {
    name: "Mozzarella",
    itemType: "cheese",
    quantity: 100,
    unit: "kg",
    threshold: 20,
    cost: 100,
    supplier: {
      name: "Cheese Masters",
      contact: "+91-9876543212",
      email: "cheese@supplier.com",
    },
  },
  {
    name: "Cheddar",
    itemType: "cheese",
    quantity: 80,
    unit: "kg",
    threshold: 15,
    cost: 110,
    supplier: {
      name: "Cheese Masters",
      contact: "+91-9876543212",
      email: "cheese@supplier.com",
    },
  },
  {
    name: "Parmesan",
    itemType: "cheese",
    quantity: 60,
    unit: "kg",
    threshold: 12,
    cost: 120,
    supplier: {
      name: "Cheese Masters",
      contact: "+91-9876543212",
      email: "cheese@supplier.com",
    },
  },
  {
    name: "Vegan Cheese",
    itemType: "cheese",
    quantity: 40,
    unit: "kg",
    threshold: 8,
    cost: 130,
    supplier: {
      name: "Cheese Masters",
      contact: "+91-9876543212",
      email: "cheese@supplier.com",
    },
  },
  {
    name: "Ricotta",
    itemType: "cheese",
    quantity: 50,
    unit: "kg",
    threshold: 10,
    cost: 115,
    supplier: {
      name: "Cheese Masters",
      contact: "+91-9876543212",
      email: "cheese@supplier.com",
    },
  },

  // Veggies
  {
    name: "Bell Pepper",
    itemType: "veggie",
    quantity: 50,
    unit: "kg",
    threshold: 10,
    cost: 20,
    supplier: {
      name: "Fresh Veggies Inc",
      contact: "+91-9876543213",
      email: "veggies@supplier.com",
    },
  },
  {
    name: "Onions",
    itemType: "veggie",
    quantity: 80,
    unit: "kg",
    threshold: 15,
    cost: 15,
    supplier: {
      name: "Fresh Veggies Inc",
      contact: "+91-9876543213",
      email: "veggies@supplier.com",
    },
  },
  {
    name: "Mushrooms",
    itemType: "veggie",
    quantity: 40,
    unit: "kg",
    threshold: 8,
    cost: 25,
    supplier: {
      name: "Fresh Veggies Inc",
      contact: "+91-9876543213",
      email: "veggies@supplier.com",
    },
  },
  {
    name: "Olives",
    itemType: "veggie",
    quantity: 30,
    unit: "kg",
    threshold: 6,
    cost: 30,
    supplier: {
      name: "Fresh Veggies Inc",
      contact: "+91-9876543213",
      email: "veggies@supplier.com",
    },
  },
  {
    name: "Tomatoes",
    itemType: "veggie",
    quantity: 60,
    unit: "kg",
    threshold: 12,
    cost: 20,
    supplier: {
      name: "Fresh Veggies Inc",
      contact: "+91-9876543213",
      email: "veggies@supplier.com",
    },
  },
  {
    name: "Spinach",
    itemType: "veggie",
    quantity: 45,
    unit: "kg",
    threshold: 9,
    cost: 18,
    supplier: {
      name: "Fresh Veggies Inc",
      contact: "+91-9876543213",
      email: "veggies@supplier.com",
    },
  },
]

async function seedInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB...")

    // Clear existing inventory
    await Inventory.deleteMany({})
    console.log("Cleared existing inventory...")

    // Insert new inventory data
    await Inventory.insertMany(inventoryData)
    console.log("Seeded inventory data successfully!")

    await mongoose.disconnect()
    console.log("Disconnected from MongoDB...")
  } catch (error) {
    console.error("Error seeding inventory:", error)
    process.exit(1)
  }
}

seedInventory() 