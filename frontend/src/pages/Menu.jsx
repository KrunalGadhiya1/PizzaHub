"use client"

import { useQuery } from "react-query"
import { Link } from "react-router-dom"
import { Star, Plus, ShoppingCart, ChevronRight, X } from "lucide-react"
import { useCartStore } from "../store/cartStore"
import { useAuthStore } from "../store/authStore"
import toast from "react-hot-toast"
import { useState } from "react"

const Menu = () => {
  const { addToCart, syncCart } = useCartStore()
  const { user } = useAuthStore()
  const [selectedPizza, setSelectedPizza] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [hoveredPizza, setHoveredPizza] = useState(null)

  const {
    data: pizzasData,
    isLoading,
    error,
  } = useQuery(
    ["pizzas"],
    async () => {
      const res = await import("../utils/api").then(m => m.default.get("/pizzas?limit=100"))
      return { data: { pizzas: res.data.data.pizzas } }
    },
    {
      keepPreviousData: true,
      onError: (error) => {
        console.error("Query Error:", error)
        toast.error("Failed to load menu. Please try again.")
      },
    }
  )

  const pizzas = pizzasData?.data?.pizzas || []

  const handleAddToCartClick = (pizza) => {
    setSelectedPizza(pizza)
    setSelectedSize(null)
    setShowModal(true)
  }

  const handleSizeSelect = (sizeObj) => {
    setSelectedSize(sizeObj)
  }

  const handleConfirmAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart")
      setShowModal(false)
      return
    }
    if (!selectedSize) return
    const cartItem = {
      pizzaId: selectedPizza._id,
      size: selectedSize.size,
      quantity: 1,
      price: selectedSize.price,
    }
    try {
      await addToCart(cartItem)
      await syncCart()
      toast.success(`${selectedPizza.name} (${selectedSize.size}) added to cart!`)
    } catch (error) {
      console.error("Add to cart error:", error)
      toast.error("Failed to add to cart")
    }
    setShowModal(false)
    setSelectedPizza(null)
    setSelectedSize(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading our delicious menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 bg-white rounded-xl shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Menu Loading Failed</h3>
          <p className="text-gray-600">We couldn't load our menu at this time. Please try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Artisan Pizzas Crafted with Love</h1>
          <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto">
            Hand-tossed dough, premium ingredients, and authentic flavors
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Pizza Builder CTA */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
          <div className="md:flex">
            <div className="md:w-2/3 p-8 md:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Create Your Masterpiece</h2>
              <p className="text-gray-600 mb-6">
                Unleash your creativity with our pizza builder. Choose from our fresh ingredients to craft your perfect pizza.
              </p>
              <Link
                to="/pizza-builder"
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-white font-medium shadow-md hover:from-orange-600 hover:to-red-600 transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Build Your Pizza
              </Link>
            </div>
            <div className="hidden md:block md:w-1/3 bg-[url('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38')] bg-cover bg-center"></div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Our Signature Pizzas</h2>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                Popular
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                All Pizzas
              </button>
            </div>
          </div>

          {/* Pizza Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pizzas.map((pizza) => (
              <div 
                key={pizza._id} 
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                onMouseEnter={() => setHoveredPizza(pizza._id)}
                onMouseLeave={() => setHoveredPizza(null)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={pizza.image}
                    alt={pizza.name}
                    className={`w-full h-48 object-cover transition-transform duration-300 ${hoveredPizza === pizza._id ? 'scale-105' : ''}`}
                  />
                  <div className="absolute top-3 left-3 flex items-center space-x-1 bg-white/90 px-2 py-1 rounded-full text-xs font-semibold">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{pizza.rating.toFixed(1)}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white font-bold text-lg">{pizza.name}</h3>
                    <p className="text-orange-200 text-sm line-clamp-1">{pizza.ingredients.join(", ")}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{pizza.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      {pizza.sizes.map((size) => (
                        <div key={size.size} className="flex items-center text-sm">
                          <span className="capitalize mr-2 text-gray-600">{size.size}:</span>
                          <span className="font-medium">₹{size.price}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleAddToCartClick(pizza)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Size Selection Modal - Keeping your original implementation */}
      {showModal && selectedPizza && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4">Select Size for {selectedPizza.name}</h3>
            <div className="space-y-2 mb-4">
              {selectedPizza.sizes.map((sizeObj) => (
                <button
                  key={sizeObj.size}
                  onClick={() => handleSizeSelect(sizeObj)}
                  className={`w-full flex justify-between items-center px-4 py-2 rounded-md font-semibold shadow-md mb-2 transition-all
                    ${selectedSize?.size === sizeObj.size
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-2 border-orange-700 scale-105'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 border border-transparent'}`}
                >
                  <span className="capitalize">{sizeObj.size}</span>
                  <span>₹{sizeObj.price}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleConfirmAddToCart}
              disabled={!selectedSize}
              className={`w-full py-2 rounded-md font-bold flex items-center justify-center gap-2 transition-all
                ${selectedSize
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md hover:from-orange-600 hover:to-red-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-2 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Menu