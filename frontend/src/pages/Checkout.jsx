"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useCartStore } from "../store/cartStore"
import { useAuthStore } from "../store/authStore"
import { CreditCard, Truck, MapPin } from "lucide-react"
import api from "../utils/api"
import toast from "react-hot-toast"

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState("razorpay")
  const [isProcessing, setIsProcessing] = useState(false)
  const { items, getTotal, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      pincode: user?.address?.pincode || "",
      phone: user?.phone || "",
    },
  })

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price)
  }

  const deliveryFee = getTotal() >= 299 ? 0 : 40
  const taxes = getTotal() * 0.05
  const totalAmount = getTotal() + deliveryFee + taxes

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleRazorpayPayment = async (orderData) => {
    const scriptLoaded = await loadRazorpayScript()

    if (!scriptLoaded) {
      toast.error("Failed to load payment gateway")
      return
    }

    try {
      // Create order
      const response = await api.post("/orders", orderData)
      const { order, razorpayOrder } = response.data.data

      if (!razorpayOrder) {
        toast.error("Failed to create payment order")
        return
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_1234567890",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "PizzaHub",
        description: `Order #${order.orderNumber}`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            // Verify payment
            await api.post("/payment/verify", {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })

            clearCart()
            toast.success("Payment successful! Order placed.")
            navigate(`/orders/${order._id}`)
          } catch (error) {
            toast.error("Payment verification failed")
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: orderData.deliveryAddress.phone,
        },
        theme: {
          color: "#dc2626",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create order")
      setIsProcessing(false)
    }
  }

  const onSubmit = async (data) => {
    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    setIsProcessing(true)

    const orderData = {
      items: items.map((item) => ({
        pizza: item.pizza?._id,
        customPizza: item.customPizza,
        quantity: item.quantity,
        size: item.size,
      })),
      paymentMethod,
      deliveryAddress: data,
      notes: data.notes || "",
    }

    try {
      if (paymentMethod === "razorpay") {
        await handleRazorpayPayment(orderData)
      } else {
        // Cash on Delivery
        const response = await api.post("/orders", orderData)
        const { order } = response.data.data

        clearCart()
        toast.success("Order placed successfully!")
        navigate(`/orders/${order._id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order")
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    navigate("/cart")
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Delivery Address</span>
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    {...register("street", { required: "Street address is required" })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    placeholder="Enter your street address"
                  />
                  {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      {...register("city", { required: "City is required" })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      placeholder="City"
                    />
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      {...register("state", { required: "State is required" })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      placeholder="State"
                    />
                    {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      {...register("pincode", {
                        required: "Pincode is required",
                        pattern: {
                          value: /^[1-9][0-9]{5}$/,
                          message: "Please enter a valid pincode",
                        },
                      })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      placeholder="Pincode"
                    />
                    {errors.pincode && <p className="text-red-600 text-sm mt-1">{errors.pincode.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      {...register("phone", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^[6-9]\d{9}$/,
                          message: "Please enter a valid Indian phone number",
                        },
                      })}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      placeholder="Phone Number"
                    />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    placeholder="Any special instructions for delivery..."
                  />
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Method</span>
                  </h2>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={paymentMethod === "razorpay"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-primary focus:ring-primary"
                      />
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Pay Online</p>
                        <p className="text-sm text-gray-600">Credit/Debit Card, UPI, Net Banking</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-primary focus:ring-primary"
                      />
                      <Truck className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-gray-600">Pay when your order arrives</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <div className="spinner"></div>
                  ) : (
                    <>
                      <span>Place Order - {formatPrice(totalAmount)}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.pizza ? item.pizza.name : "Custom Pizza"} x {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600">
                        Size: {item.size?.charAt(0).toUpperCase() + item.size?.slice(1)}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span>{formatPrice(taxes)}</span>
                </div>

                <hr className="my-2" />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <Truck className="h-5 w-5" />
                  <span className="font-medium">Estimated Delivery: 30-45 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
