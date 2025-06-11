"use client"

import { useQuery } from "react-query"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Clock, Package, Truck, CheckCircle, XCircle, MapPin, Phone, CreditCard } from "lucide-react"
import api from "../utils/api"

const OrderDetails = () => {
  const { id } = useParams()

  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery(
    ["order", id],
    async () => {
      const response = await api.get(`/orders/${id}`)
      return response.data.data.order
    },
    {
      enabled: !!id,
    },
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-500" />
      case "confirmed":
      case "preparing":
        return <Package className="h-6 w-6 text-blue-500" />
      case "ready":
      case "out-for-delivery":
        return <Truck className="h-6 w-6 text-orange-500" />
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "cancelled":
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmed":
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "ready":
      case "out-for-delivery":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Order not found</p>
          <Link to="/orders" className="text-primary hover:underline">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  const order = orderData

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/orders"
            className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Orders</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              {getStatusIcon(order.status)}
              <span className={`px-4 py-2 rounded-lg border font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace("-", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Status</h2>
              <div className="space-y-4">
                {order.statusHistory.map((status, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === order.statusHistory.length - 1 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {status.status.charAt(0).toUpperCase() + status.status.slice(1).replace("-", " ")}
                      </p>
                      <p className="text-sm text-gray-600">{formatDate(status.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {item.pizza ? (
                        <img
                          src={item.pizza ? (item.pizza.image || "/placeholder.svg?height=80&width=80") : ("https://media.karousell.com/media/photos/products/2024/2/1/corrugated_customize_pizza_box_1706770517_15e9240d_progressive")}
                          alt={item.pizza ? item.pizza.name : "Custom Pizza"}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xs">Custom</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.pizza ? item.pizza.name : "Custom Pizza"}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.customPizza && (
                        <div className="text-sm text-gray-600 mt-1">
                          <p>
                            Size: {item.customPizza.size?.charAt(0).toUpperCase() + item.customPizza.size?.slice(1)}
                          </p>
                          <div className="mt-1">
                            {item.customPizza.base && <span>Base: {item.customPizza.base.name}</span>}
                            {item.customPizza.sauce && <span>, Sauce: {item.customPizza.sauce.name}</span>}
                            {item.customPizza.cheese && <span>, Cheese: {item.customPizza.cheese.name}</span>}
                            {item.customPizza.veggies.length > 0 && (
                              <span>, Veggies: {item.customPizza.veggies.map((v) => v.name).join(", ")}</span>
                            )}
                            {item.customPizza.meat.length > 0 && (
                              <span>, Meat: {item.customPizza.meat.map((m) => m.name).join(", ")}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Delivery Address</span>
              </h2>
              <div className="text-gray-700">
                <p>{order.deliveryAddress.street}</p>
                <p>
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Phone className="h-4 w-4" />
                  <span>{order.deliveryAddress.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(order.totalAmount * 0.9)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span>{order.totalAmount >= 299 ? "Free" : formatPrice(40)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span>{formatPrice(order.totalAmount * 0.05)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Information</span>
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Method:</span> {order.paymentMethod.toUpperCase()}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`${
                        order.paymentStatus === "completed"
                          ? "text-green-600"
                          : order.paymentStatus === "failed"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </p>
                  {order.razorpayPaymentId && (
                    <p>
                      <span className="font-medium">Payment ID:</span> {order.razorpayPaymentId}
                    </p>
                  )}
                </div>
              </div>

              {/* Estimated Delivery */}
              {order.estimatedDeliveryTime && !["delivered", "cancelled"].includes(order.status) && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Estimated Delivery</h3>
                  <p className="text-sm text-gray-600">{formatDate(order.estimatedDeliveryTime)}</p>
                </div>
              )}

              {/* Actual Delivery */}
              {order.actualDeliveryTime && order.status === "delivered" && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Delivered On</h3>
                  <p className="text-sm text-gray-600">{formatDate(order.actualDeliveryTime)}</p>
                </div>
              )}

              {/* Special Instructions */}
              {order.notes && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails
