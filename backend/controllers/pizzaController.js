import Pizza from "../models/Pizza.js"
import { successResponse, errorResponse } from "../utils/responseHandler.js"
import { uploadImage } from "../utils/fileUpload.js"

// @desc    Get all pizzas
// @route   GET /api/pizza
// @access  Public
export const getAllPizzas = async (req, res, next) => {
  try {
    const { category, search, sort, page = 1, limit = 10 } = req.query

    // Build query
    const query = {}

    // Filter by category
    if (category) {
      query.category = category
    }

    // Search by name or description
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Only show available pizzas
    query.isAvailable = true

    // Count total documents
    const total = await Pizza.countDocuments(query)

    // Build sort object
    let sortObj = {}
    if (sort) {
      const [field, order] = sort.split(":")
      sortObj[field] = order === "desc" ? -1 : 1
    } else {
      sortObj = { createdAt: -1 } // Default sort by newest
    }

    // Pagination
    const skip = (page - 1) * limit

    // Get pizzas
    const pizzas = await Pizza.find(query).sort(sortObj).skip(skip).limit(Number.parseInt(limit))

    successResponse(res, "Pizzas fetched successfully", 200, {
      pizzas,
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

// @desc    Get pizza by ID
// @route   GET /api/pizza/:id
// @access  Public
export const getPizzaById = async (req, res, next) => {
  try {
    const pizza = await Pizza.findById(req.params.id)

    if (!pizza) {
      return errorResponse(res, "Pizza not found", 404)
    }

    successResponse(res, "Pizza fetched successfully", 200, { pizza })
  } catch (error) {
    next(error)
  }
}

// @desc    Create pizza
// @route   POST /api/pizza
// @access  Private/Admin
export const createPizza = async (req, res, next) => {
  try {
    const { name, description, category, basePrice, sizes, ingredients } = req.body

    // Check if pizza with same name exists
    const pizzaExists = await Pizza.findOne({ name })

    if (pizzaExists) {
      return errorResponse(res, "Pizza with this name already exists", 400)
    }

    // Upload image
    let image = ""
    if (req.file) {
      image = await uploadImage(req.file)
    } else if (req.body.image) {
      image = req.body.image
    } else {
      return errorResponse(res, "Pizza image is required", 400)
    }

    // Create pizza
    const pizza = await Pizza.create({
      name,
      description,
      image,
      category,
      basePrice,
      sizes,
      ingredients,
    })

    successResponse(res, "Pizza created successfully", 201, { pizza })
  } catch (error) {
    next(error)
  }
}

// @desc    Update pizza
// @route   PUT /api/pizza/:id
// @access  Private/Admin
export const updatePizza = async (req, res, next) => {
  try {
    const { name, description, category, basePrice, sizes, ingredients, isAvailable } = req.body

    // Find pizza
    const pizza = await Pizza.findById(req.params.id)

    if (!pizza) {
      return errorResponse(res, "Pizza not found", 404)
    }

    // Check if pizza with same name exists (except this one)
    if (name && name !== pizza.name) {
      const pizzaExists = await Pizza.findOne({ name })

      if (pizzaExists) {
        return errorResponse(res, "Pizza with this name already exists", 400)
      }
    }

    // Upload image if provided
    let image = pizza.image
    if (req.file) {
      image = await uploadImage(req.file)
    } else if (req.body.image && req.body.image !== pizza.image) {
      image = req.body.image
    }

    // Update pizza
    pizza.name = name || pizza.name
    pizza.description = description || pizza.description
    pizza.image = image
    pizza.category = category || pizza.category
    pizza.basePrice = basePrice || pizza.basePrice
    pizza.sizes = sizes || pizza.sizes
    pizza.ingredients = ingredients || pizza.ingredients
    pizza.isAvailable = isAvailable !== undefined ? isAvailable : pizza.isAvailable

    await pizza.save()

    successResponse(res, "Pizza updated successfully", 200, { pizza })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete pizza
// @route   DELETE /api/pizza/:id
// @access  Private/Admin
export const deletePizza = async (req, res, next) => {
  try {
    const pizza = await Pizza.findById(req.params.id)

    if (!pizza) {
      return errorResponse(res, "Pizza not found", 404)
    }

    await pizza.deleteOne()

    successResponse(res, "Pizza deleted successfully", 200)
  } catch (error) {
    next(error)
  }
}

// @desc    Add review
// @route   POST /api/pizza/:id/reviews
// @access  Private
export const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body

    // Find pizza
    const pizza = await Pizza.findById(req.params.id)

    if (!pizza) {
      return errorResponse(res, "Pizza not found", 404)
    }

    // Check if user already reviewed
    const alreadyReviewed = pizza.reviews.find((review) => review.user.toString() === req.user._id.toString())

    if (alreadyReviewed) {
      return errorResponse(res, "Pizza already reviewed", 400)
    }

    // Add review
    const review = {
      user: req.user._id,
      rating: Number(rating),
      comment,
    }

    pizza.reviews.push(review)

    // Update rating
    pizza.rating = pizza.reviews.reduce((acc, item) => item.rating + acc, 0) / pizza.reviews.length

    await pizza.save()

    successResponse(res, "Review added successfully", 201, { review })
  } catch (error) {
    next(error)
  }
}
