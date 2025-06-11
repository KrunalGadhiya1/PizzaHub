"use client"

import { Link } from "react-router-dom"
import { ArrowRight, Clock, Truck, Star, Pizza, ShoppingCart } from "lucide-react"
import { motion } from "framer-motion"
import { useCartStore } from "../store/cartStore"
import { useAuthStore } from "../store/authStore"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import { useQuery } from "react-query"
import api from "../utils/api"

const HOME_PIZZA_IDS = [
  "68481a66eec0d7934819d8bc", // Margherita
  "68481a76eec0d7934819d8be", // Pepperoni
  "68481a84eec0d7934819d8c0", // Veggie Supreme
]

const Home = () => {
  const { addToCart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: pizzasData, isLoading, error } = useQuery([
    "pizzas-home"
  ], async () => {
    const res = await api.get("/pizzas?limit=100")
    return res.data.data.pizzas
  })

  // Filter and order pizzas for home page
  const popularPizzas = (pizzasData || [])
    .filter(pizza => HOME_PIZZA_IDS.includes(pizza._id))
    .sort((a, b) => HOME_PIZZA_IDS.indexOf(a._id) - HOME_PIZZA_IDS.indexOf(b._id))

  const handleAddToCart = async (pizza) => {
    if (!user) {
      toast.error("Please login to add items to cart")
      navigate("/login")
      return
    }

    // Find medium size or fallback to first size
    const sizeObj = pizza.sizes?.find(s => s.size === "medium") || pizza.sizes?.[0]
    if (!sizeObj) {
      toast.error("No size available for this pizza")
      return
    }

    const cartItem = {
      pizzaId: pizza._id,
      size: sizeObj.size,
      quantity: 1,
      price: sizeObj.price,
    }

    try {
      await addToCart(cartItem)
      toast.success("Pizza added to cart!")
    } catch (error) {
      console.error("Failed to add pizza to cart:", error)
      toast.error("Failed to add pizza to cart. Please try again.")
    }
  }

  const features = [
    {
      icon: <Clock className="h-8 w-8 text-yellow-500" />,
      title: "Fast Delivery",
      description: "Get your pizza delivered in 30 minutes or less",
    },
    {
      icon: <Pizza className="h-8 w-8 text-yellow-500" />,
      title: "Fresh Ingredients",
      description: "Made with the finest and freshest ingredients",
    },
    {
      icon: <Star className="h-8 w-8 text-yellow-500" />,
      title: "5-Star Quality",
      description: "Rated 5 stars by thousands of happy customers",
    },
    {
      icon: <Truck className="h-8 w-8 text-yellow-500" />,
      title: "Free Delivery",
      description: "Free delivery on orders above ₹299",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
                Delicious Pizza
                <br />
                <span className="text-yellow-200">Delivered Hot & Fast</span>
              </h1>
              <p className="text-xl text-white/90 max-w-lg drop-shadow-md">
                Craving the perfect pizza? We've got you covered with fresh ingredients, authentic flavors, and lightning-fast delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  to="/menu"
                  className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-100 transition-colors flex items-center justify-center space-x-3 shadow-md hover:shadow-lg"
                >
                  <span>Order Now</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/pizza-builder"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors shadow-md hover:shadow-lg text-center"
                >
                  Build Your Pizza
                </Link>
              </div>
            </motion.div>

            {/* Right - Pizza Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm shadow-2xl"
            >
              <img
                src="https://images7.alphacoders.com/596/596343.jpg"
                alt="Pizza Hero"
                className="w-full max-w-xs md:max-w-sm lg:max-w-md object-cover rounded-2xl shadow-xl"
              />
              <div className="absolute bottom-4 left-4 bg-yellow-400 text-black px-5 py-2 rounded-full font-bold shadow-lg animate-pulse">
                30 Min Delivery!
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-red-600 mb-4">Why Choose PizzaHub?</h2>
            <p className="text-xl text-gray-600">We're committed to delivering the best pizza experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Pizzas Section */}
      <section className="py-16 bg-gradient-to-tr from-white via-yellow-100 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-red-600 mb-4">Popular Pizzas</h2>
            <p className="text-xl text-gray-700">Try our customer favorites</p>
          </div>
          {isLoading ? (
            <div className="text-center text-lg text-gray-600">Loading pizzas...</div>
          ) : error ? (
            <div className="text-center text-red-600">Failed to load pizzas.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {popularPizzas.map((pizza) => (
                <motion.div
                  key={pizza._id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:scale-105 transition-transform"
                >
                  <img
                    src={pizza.image}
                    alt={pizza.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{pizza.name}</h3>
                    <p className="text-gray-600 mb-4">{pizza.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-red-600">₹{pizza.basePrice}</span>
                      <button
                        onClick={() => handleAddToCart(pizza)}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-red-500 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-xl mb-8">Join thousands of satisfied customers and order your perfect pizza today!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-100 transition-colors flex items-center justify-center space-x-3 shadow-md hover:shadow-lg"
            >
              <span>Browse Menu</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/pizza-builder"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
            >
              Build Custom Pizza
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
