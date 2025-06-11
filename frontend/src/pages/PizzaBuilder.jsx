"use client"
import { useState } from "react"
import { ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "react-query"
import api from "../utils/api"
import { useCartStore } from "../store/cartStore"
import { useAuthStore } from "../store/authStore"
import toast from "react-hot-toast"

// Step definitions
const steps = [
  { title: "Choose Base", type: "base", multiSelect: false },
  { title: "Choose Sauce", type: "sauce", multiSelect: false },
  { title: "Choose Cheese", type: "cheese", multiSelect: false },
  { title: "Choose Veggies", type: "veggies", multiSelect: true },
]

// Pizza ingredients with real images
const pizzaIngredients = {
  base: [
    {
      _id: "base-1",
      name: "Classic Hand-Tossed",
      cost: 80,
      itemType: "base",
      image: "https://th.bing.com/th/id/OIP.OgRzOyN6zLZlBNLm4GFj8gHaE7?rs=1&pid=ImgDetMain",
      quantity: 10
    },
    {
      _id: "base-2",
      name: "Thin Crust",
      cost: 70,
      itemType: "base",
      image: "https://thecafesucrefarine.com/wp-content/uploads/20-Minute-Thin-Crust-PIzza-2.jpg",
      quantity: 10
    },
    {
      _id: "base-3",
      name: "Whole Wheat",
      cost: 90,
      itemType: "base",
      image: "https://i0.wp.com/www.kitchenkathukutty.com/wp-content/uploads/2020/04/whole-wheat-pizza-base-recipe-scaled.jpg?resize=830%2C1111&ssl=1",
      quantity: 10
    },
    {
      _id: "base-4",
      name: "Gluten-Free",
      cost: 100,
      itemType: "base",
      image: "https://buvetti.com.au/wp-content/uploads/2024/07/Buvetti-GF-base-720.jpg",
      quantity: 10
    },
    {
      _id: "base-5",
      name: "Deep Dish",
      cost: 110,
      itemType: "base",
      image: "https://th.bing.com/th/id/OIP.bgVuGOJvfWwpnK4eJu0w_QHaGK?rs=1&pid=ImgDetMain",
      quantity: 10
    }
  ],
  sauce: [
    {
      _id: "sauce-1",
      name: "Classic Tomato",
      cost: 30,
      itemType: "sauce",
      image: "https://th.bing.com/th/id/R.810a0a47985df8db422280c24880caa2?rik=e6eXRfbORSUFCw&riu=http%3a%2f%2fwww.yumsome.com%2fwp-content%2fuploads%2f2015%2f05%2fclassic-italian-tomato-sauce-square.jpg&ehk=YWJx11oY57%2bJyAFIZCVyCtYEsjSvuk1F6xRCvImab9U%3d&risl=&pid=ImgRaw&r=0",
      quantity: 10
    },
    {
      _id: "sauce-2",
      name: "Pesto Sauce",
      cost: 40,
      itemType: "sauce",
      image: "https://th.bing.com/th/id/OIP.e-4nDiIbehp5A50UDx_BQgHaJQ?rs=1&pid=ImgDetMain",
      quantity: 10
    },
    {
      _id: "sauce-3",
      name: "Alfredo Sauce",
      cost: 45,
      itemType: "sauce",
      image: "https://img.freepik.com/premium-photo/alfredo-sauce-isolated-white-background_847439-61113.jpg",
      quantity: 10
    },
    {
      _id: "sauce-4",
      name: "BBQ Sauce",
      cost: 35,
      itemType: "sauce",
      image: "https://www.cookingclassy.com/wp-content/uploads/2020/05/bbq-sauce-01.jpg",
      quantity: 10
    },
    {
      _id: "sauce-5",
      name: "Buffalo Sauce",
      cost: 40,
      itemType: "sauce",
      image: "https://www.myforkinglife.com/wp-content/uploads/2023/01/buffalo-sauce-recipe-0052.jpg",
      quantity: 10
    }
  ],
  cheese: [
    {
      _id: "cheese-1",
      name: "Mozzarella",
      cost: 50,
      itemType: "cheese",
      image: "https://shop.classicfinefoods.ae/13088-large_default/grana-padano-wheel-10-months-35-kg-.jpg",
      quantity: 10
    },
    {
      _id: "cheese-2",
      name: "Cheddar",
      cost: 45,
      itemType: "cheese",
      image: "https://th.bing.com/th/id/OIP.i8im3jnQMznlT2AAE0AK8wHaHd?rs=1&pid=ImgDetMain",
      quantity: 10
    },
    {
      _id: "cheese-3",
      name: "Parmesan",
      cost: 60,
      itemType: "cheese",
      image: "https://th.bing.com/th/id/OIP.vh4EqonxTQ0ku4YgskaQqgHaE7?rs=1&pid=ImgDetMain",
      quantity: 10
    },
    {
      _id: "cheese-4",
      name: "Provolone",
      cost: 55,
      itemType: "cheese",
      image: "https://thumbs.dreamstime.com/z/provolone-cheese-white-background-top-view-38757054.jpg",
      quantity: 10
    },
    {
      _id: "cheese-5",
      name: "Vegan Cheese",
      cost: 65,
      itemType: "cheese",
      image: "https://www.noracooks.com/wp-content/uploads/2020/05/square.jpg",
      quantity: 10
    }
  ],
  veggies: [
    {
      _id: "veggie-1",
      name: "Bell Peppers",
      cost: 20,
      itemType: "veggies",
      image: "https://img.freepik.com/premium-photo/vibrant-medley-fresh-slices-red-green-yellow-bell-peppers_42667-3916.jpg",
      quantity: 10
    },
    {
      _id: "veggie-2",
      name: "Mushrooms",
      cost: 25,
      itemType: "veggies",
      image: "https://res.cloudinary.com/hksqkdlah/image/upload/ar_1:1,c_fill,dpr_2.0,f_auto,fl_lossy.progressive.strip_profile,g_faces:auto,q_auto:low,w_344/28343_sfs-sauteed-mushroom-topping-007",
      quantity: 10
    },
    {
      _id: "veggie-3",
      name: "Black Olives",
      cost: 30,
      itemType: "veggies",
      image: "https://www.hotrodsrecipes.com/wp-content/uploads/2022/06/pizza-black-olives-capers-2-768x1024.jpg",
      quantity: 10
    },
    {
      _id: "veggie-4",
      name: "Onions",
      cost: 15,
      itemType: "veggies",
      image: "https://realitybakes.com/wp-content/uploads/2020/01/Roasted-Red-Pepper-and-Red-Onion-Pizza-8.jpg",
      quantity: 10
    },
    {
      _id: "veggie-5",
      name: "Spinach",
      cost: 20,
      itemType: "veggies",
      image: "https://www.acouplecooks.com/wp-content/uploads/2019/05/Spinach-Artichoke-Pizza-004-735x919.jpg",
      quantity: 10
    }
  ]
}

export default function PizzaBuilder() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addToCart } = useCartStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState({
    base: null,
    sauce: null,
    cheese: null,
    veggies: [],
  })

  const { data: inventory, isLoading } = useQuery("inventory", async () => {
    try {
      const response = await api.get("/inventory")
      return response.data.data
    } catch (error) {
      console.error("Error fetching inventory, using fallback data", error)
      return null
    }
  })

  const getItemsByType = (type) => {
    if (!inventory || inventory.length === 0) return pizzaIngredients[type]
    const filtered = inventory.filter(item => item.itemType === type && item.quantity > 0)
    return filtered.length ? filtered.slice(0, 5) : pizzaIngredients[type]
  }

  const currentStepData = () => {
    const type = steps[currentStep].type
    return getItemsByType(type)
  }

  const selectItem = (item) => {
    const stepInfo = steps[currentStep]
    const selectedItem = { ...item } // clone

    if (!stepInfo.multiSelect) {
      setSelections((prev) => ({ ...prev, [stepInfo.type]: selectedItem }))
    } else {
      setSelections((prev) => {
        const arr = [...prev.veggies]
        const exists = arr.find((v) => v._id === item._id)
        if (exists) return { ...prev, veggies: arr.filter((v) => v._id !== item._id) }
        if (arr.length >= 4) {
          toast.error("You can select up to 4 veggies")
          return prev
        }
        return { ...prev, veggies: [...arr, selectedItem] }
      })
    }
  }

  const canProceed = () => {
    const stepInfo = steps[currentStep]
    if (stepInfo.type === "veggies") return true
    return selections[stepInfo.type] !== null
  }

  const goNext = () => {
    if (!canProceed()) {
      toast.error(`Please select a ${steps[currentStep].type} to continue`)
      return
    }
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
  }

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const calculatePrice = () => {
    let price = 0
    if (selections.base) price += selections.base.cost || 0
    if (selections.sauce) price += selections.sauce.cost || 0
    if (selections.cheese) price += selections.cheese.cost || 0
    if (Array.isArray(selections.veggies)) {
      price += selections.veggies.reduce((acc, v) => acc + (v.cost || 0), 0)
    }
    return price
  }

  const isPizzaValid = () => {
    return (
      selections.base &&
      selections.sauce &&
      selections.cheese &&
      selections.veggies.length > 0
    )
  }

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart")
      navigate("/login")
      return
    }

    if (!isPizzaValid()) {
      toast.error("Please complete your pizza before adding to cart.")
      return
    }

    const customPizza = {
      pizzaId: `custom-${Date.now()}`,
      size: "medium",
      quantity: 1,
      price: calculatePrice(),
      customPizza: {
        base: selections.base,
        sauce: selections.sauce,
        cheese: selections.cheese,
        veggies: selections.veggies,
        image: "https://media.karousell.com/media/photos/products/2024/2/1/corrugated_customize_pizza_box_1706770517_15e9240d_progressive", // Default pizza image
        name: "Custom Pizza",
        description: `Custom pizza with ${selections.base.name} base, ${selections.sauce.name} sauce, ${selections.cheese.name} cheese, and ${selections.veggies.map(v => v.name).join(", ")}.`,
      },
    }

    try {
      await addToCart(customPizza)
      toast.success("Custom pizza added to cart!")
      navigate("/cart")
    } catch (error) {
      console.error("Failed to add custom pizza to cart:", error)
      toast.error("Failed to add pizza to cart. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-yellow-50 rounded-lg shadow-lg mt-10">
      <h1 className="text-4xl font-bold text-amber-700 mb-6 text-center">Build Your Pizza 🍕</h1>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`flex-1 text-center ${index <= currentStep ? "text-amber-600" : "text-gray-400"}`}
            >
              <div className="relative">
                <div className={`h-2 ${index <= currentStep ? "bg-amber-600" : "bg-gray-200"}`}></div>
                <div className="mt-2 text-sm font-medium">{step.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-amber-600">{steps[currentStep].title}</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {currentStepData().map((item) => {
          const selected = steps[currentStep].multiSelect
            ? selections.veggies.some((v) => v._id === item._id)
            : selections[steps[currentStep].type]?._id === item._id

          return (
            <div
              key={item._id}
              onClick={() => selectItem(item)}
              className={`cursor-pointer rounded-lg border-4 p-3 shadow-md flex flex-col items-center transition-transform
                ${selected ? "border-amber-500 scale-105 bg-amber-100" : "border-transparent hover:border-amber-400"}`}
            >
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-28 h-28 object-cover rounded-lg mb-2" 
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = "https://via.placeholder.com/150?text=Pizza+Ingredient"
                }}
              />
              <div className="font-semibold text-lg text-gray-800">{item.name}</div>
              <div className="text-amber-600 font-bold">₹{item.cost}</div>
              {selected && <div className="text-amber-700 mt-1 font-semibold">Selected ✓</div>}
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className="bg-gray-300 text-gray-700 rounded-md px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition"
        >
          <ArrowLeft className="inline-block mr-2" />
          Back
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className={`px-6 py-3 font-semibold rounded-md text-white transition ${
              canProceed() ? "bg-amber-600 hover:bg-amber-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Next
            <ArrowRight className="inline-block ml-2" />
          </button>
        ) : (
          <div className="flex flex-col items-end w-full gap-4">
            {isPizzaValid() ? (
              <>
                <div className="text-right font-bold text-amber-700 text-xl">
                  Total: ₹{calculatePrice()}
                </div>
                <button
                  onClick={handleAddToCart}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-md px-6 py-3 font-semibold transition flex items-center gap-2"
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
              </>
            ) : (
              <div className="text-red-600 font-medium">
                Please select base, sauce, cheese and at least 1 veggie to continue.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}