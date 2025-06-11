"use client"

import { Link, useNavigate } from "react-router-dom"
import { useCartStore } from "../store/cartStore"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ChevronRight } from "lucide-react"
import { useEffect } from "react"
import { useAuthStore } from "../store/authStore"
import toast from "react-hot-toast"
import api from "../utils/api"

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

const Cart = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { items, removeItem, updateQuantity, clearCart, getTotal, getCount, syncCart, isLoading } = useCartStore()

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    
    const loadCart = async () => {
      try {
        await syncCart()
      } catch (error) {
        console.error("Failed to load cart:", error)
        toast.error("Failed to load cart. Please try again.")
      }
    }
    
    loadCart()
  }, [user, navigate, syncCart])

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        await removeItem(itemId)
        return
      }
      await updateQuantity(itemId, newQuantity)
    } catch (error) {
      console.error("Failed to update quantity:", error)
      toast.error("Failed to update quantity. Please try again.")
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price)

  const handleCheckout = async () => {
    try {
      if (!user.address) {
        toast.error("Please update your delivery address in your profile before proceeding.");
        navigate("/profile");
        return;
      }

      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_ID.startsWith('rzp_')) {
        toast.error("Payment system is not properly configured. Please contact support.");
        return;
      }

      // Format address if it's an object
      const formattedAddress = typeof user.address === 'object' ? 
        `${user.address.street}, ${user.address.city}, ${user.address.state} - ${user.address.pincode}` :
        user.address;

      // First, create the order
      const orderResponse = await api.post("/orders", {
        items: items.map(item => ({
          pizza: item.pizza?._id,
          customPizza: item.customPizza ? {
            base: {
              name: item.customPizza.base?.name,
              price: item.customPizza.base?.cost
            },
            sauce: {
              name: item.customPizza.sauce?.name,
              price: item.customPizza.sauce?.cost
            },
            cheese: {
              name: item.customPizza.cheese?.name,
              price: item.customPizza.cheese?.cost
            },
            veggies: (item.customPizza.veggies || []).map(v => ({
              name: v.name,
              price: v.cost
            })),
            meat: (item.customPizza.meat || []).map(m => ({
              name: m.name,
              price: m.cost
            })),
            size: item.size,
            totalPrice: item.price
          } : undefined,
          quantity: item.quantity,
          size: item.size
        })),
        paymentMethod: "razorpay",
        deliveryAddress: formattedAddress,
        notes: ""
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Failed to create order");
      }

      if (!orderResponse.data.data.razorpayOrder) {
        throw new Error("Failed to create Razorpay order");
      }

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderResponse.data.data.razorpayOrder.amount,
        currency: orderResponse.data.data.razorpayOrder.currency,
        name: "Pizza King",
        description: "Pizza Order Payment",
        order_id: orderResponse.data.data.razorpayOrder.id,
        handler: async function (response) {
          try {
            const verifyResponse = await api.post("/payment/verify", {
              orderId: orderResponse.data.data.order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (!verifyResponse.data.success) {
              throw new Error(verifyResponse.data.message || "Payment verification failed");
            }

            // Clear cart after successful payment
            await clearCart();
            toast.success("Payment successful! Your order has been placed.");
            navigate("/orders");
          } catch (error) {
            toast.error(error.response?.data?.message || "Payment verification failed. Please contact support if amount was deducted.");
            navigate("/orders");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ""
        },
        theme: {
          color: "#d97706"
        },
        modal: {
          ondismiss: function() {
            toast.error("Payment cancelled. You can try again from your orders page.");
            navigate("/orders");
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to initiate payment. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4 py-12">
        <section className="text-center max-w-md w-full">
          <div className="relative mx-auto w-48 h-48 mb-8">
            <div className="absolute inset-0 bg-amber-100 rounded-full opacity-30"></div>
            <div className="absolute inset-4 flex items-center justify-center">
              <ShoppingBag className="h-32 w-32 text-amber-500" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8 text-lg">Looks like you haven't added any delicious pizzas yet!</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-medium shadow-md transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
            >
              Browse Menu
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              to="/pizza-builder"
              className="inline-flex items-center justify-center gap-2 border-2 border-amber-500 text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
            >
              Build Custom Pizza
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Your Cart</h1>
            <p className="text-amber-600 mt-2">{getCount()} {getCount() === 1 ? 'item' : 'items'}</p>
          </div>
          <button
            onClick={clearCart}
            aria-label="Clear Cart"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full transition-all"
          >
            <Trash2 className="h-5 w-5" />
            <span className="font-medium">Clear Cart</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <section className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <article
                key={item._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-all duration-300"
              >
                {/* Item Image */}
                <div className="flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  {item.pizza ? (
                    <img
                      src={item.pizza.image || "https://media.karousell.com/media/photos/products/2024/2/1/corrugated_customize_pizza_box_1706770517_15e9240d_progressive"}
                      alt={item.pizza.name}
                      className="w-full h-full object-cover"
                    />
                  ) : item.customPizza ? (
                    <img
                      src={item.customPizza ? (item.customPizza.image || "https://media.karousell.com/media/photos/products/2024/2/1/corrugated_customize_pizza_box_1706770517_15e9240d_progressive") : (item.pizza?.image || "/placeholder.svg")}
                      alt={item.pizza ? item.pizza.name : item.customPizza?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-amber-800 font-bold text-sm select-none">Pizza</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between h-full w-full">
                  <div>
                    {item.pizza ? (
                      <>
                        <h3 className="text-xl font-bold text-gray-900">{item.pizza.name}</h3>
                        <p className="mt-1 text-gray-600 text-sm">
                          Size: <span className="capitalize font-medium text-gray-700">{item.size}</span>
                        </p>
                        <p className="mt-2 text-gray-500 text-sm line-clamp-2">
                          {item.pizza.description}
                        </p>
                      </>
                    ) : item.customPizza ? (
                      <>
                        <h3 className="text-xl font-bold text-gray-900">Custom Pizza</h3>
                        <div className="mt-1 text-gray-600 text-sm space-y-1">
                          <p>Size: <span className="capitalize font-medium text-gray-700">{item.size}</span></p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                              {item.customPizza.base.name}
                            </span>
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                              {item.customPizza.sauce.name}
                            </span>
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                              {item.customPizza.cheese.name}
                            </span>
                            {item.customPizza.veggies.map((v, i) => (
                              <span key={i} className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                                {v.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <h3 className="text-xl font-semibold text-gray-900">Pizza</h3>
                    )}
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 transition"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-lg font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 transition"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">{formatPrice(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-500">{formatPrice(item.price)} each</p>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item._id)}
                  aria-label="Remove item"
                  className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </article>
            ))}
          </section>

          {/* Order Summary */}
          <aside className="lg:col-span-1 sticky top-8 self-start">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-amber-100">Order Summary</h2>

              <dl className="space-y-4 text-gray-700 mb-6">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Subtotal ({getCount()} {getCount() === 1 ? 'item' : 'items'})</dt>
                  <dd className="font-medium">{formatPrice(getTotal())}</dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-gray-600">Delivery</dt>
                  <dd className="font-medium">
                    {getTotal() >= 299 ? (
                      <span className="text-green-600 font-semibold">Free</span>
                    ) : (
                      formatPrice(40)
                    )}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-gray-600">Taxes (5%)</dt>
                  <dd className="font-medium">{formatPrice(getTotal() * 0.05)}</dd>
                </div>

                <div className="pt-4 mt-4 border-t border-amber-100">
                  <div className="flex justify-between text-xl font-bold">
                    <dt>Total</dt>
                    <dd className="text-amber-600">
                      {formatPrice(getTotal() + (getTotal() >= 299 ? 0 : 40) + getTotal() * 0.05)}
                    </dd>
                  </div>
                </div>
              </dl>

              <button
                onClick={handleCheckout}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Free delivery on orders over {formatPrice(299)}
              </p>
            </div>

            <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
              <h3 className="font-bold text-gray-900 mb-3">Delivery Address</h3>
              {user?.address ? (
                <div className="text-gray-600 text-sm">
                  {typeof user.address === 'object' ? (
                    <>
                      <p className="font-medium">{user.name}</p>
                      <p>{user.address.street}</p>
                      <p>{user.address.city}, {user.address.state} - {user.address.pincode}</p>
                    </>
                  ) : (
                    <p>{user.address}</p>
                  )}
                  <Link 
                    to="/profile" 
                    className="text-amber-600 hover:text-amber-700 font-medium text-xs mt-2 inline-block"
                  >
                    Change address
                  </Link>
                </div>
              ) : (
                <div className="text-gray-600 text-sm">
                  <p className="text-red-500 mb-2">No delivery address set</p>
                  <Link 
                    to="/profile" 
                    className="text-amber-600 hover:text-amber-700 font-medium text-sm inline-flex items-center gap-1"
                  >
                    Add delivery address
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default Cart