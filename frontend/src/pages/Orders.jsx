"use client"

import { useState } from "react"
import { useQuery } from "react-query"
import { Link } from "react-router-dom"
import { Clock, Package, CheckCircle, XCircle, Eye, ChevronRight } from "lucide-react"
import { useAuthStore } from "../store/authStore"
import api from "../utils/api"

const Orders = () => {
  const [statusFilter, setStatusFilter] = useState("all")
  const { user } = useAuthStore()

  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery(
    ["orders", statusFilter],
    async () => {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await api.get(`/orders/my-orders?${params.toString()}`)
      return response.data.data
    },
    {
      enabled: !!user,
    },
  )

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "confirmed", label: "Confirmed" },
    { value: "pending", label: "Pending" },
  ]

  const getStatusDetails = (status) => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="h-5 w-5" />,
          color: "bg-amber-50 text-amber-800",
          text: "Pending",
          progress: 20
        }
      case "confirmed":
        return {
          icon: <Package className="h-5 w-5" />,
          color: "bg-blue-50 text-blue-800",
          text: "Confirmed",
          progress: 40
        }
      case "preparing":
        return {
          icon: <Package className="h-5 w-5" />,
          color: "bg-indigo-50 text-indigo-800",
          text: "Preparing",
          progress: 60
        }
      case "ready":
        return {
          icon: <Package className="h-5 w-5" />,
          color: "bg-purple-50 text-purple-800",
          text: "Ready",
          progress: 80
        }
      case "out-for-delivery":
        return {
          icon: <Package className="h-5 w-5" />,
          color: "bg-violet-50 text-violet-800",
          text: "On the way",
          progress: 90
        }
      case "delivered":
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: "bg-green-50 text-green-800",
          text: "Delivered",
          progress: 100
        }
      case "cancelled":
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: "bg-red-50 text-red-800",
          text: "Cancelled",
          progress: 0
        }
      default:
        return {
          icon: <Clock className="h-5 w-5" />,
          color: "bg-gray-50 text-gray-800",
          text: "Processing",
          progress: 10
        }
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getShortDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 bg-white rounded-lg shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Failed to load orders</h3>
          <p className="text-gray-600">We couldn't load your orders at this time. Please try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const orders = ordersData?.orders || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600">Track and manage all your pizza orders in one place</p>
        </div>

        {/* Filter */}
        <div className="mb-8">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === option.value
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100 mb-6">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {statusFilter === "all" 
                ? "You haven't placed any orders yet. Ready to order your favorite pizza?" 
                : `You don't have any ${statusFilter} orders at the moment.`}
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = getStatusDetails(order.status)
              return (
                <div key={order._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  {/* Order Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} flex items-center space-x-1`}>
                            {status.icon}
                            <span>{status.text}</span>
                          </span>
                          <span className="text-xs text-gray-500">{getShortDate(order.createdAt)}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                      </div>
                      <span className="text-lg font-bold text-primary">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                        <ul className="space-y-1">
                          {order.items.slice(0, 2).map((item, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              {item.pizza ? item.pizza.name : "Custom Pizza"} × {item.quantity}
                            </li>
                          ))}
                          {order.items.length > 2 && (
                            <li className="text-sm text-gray-500">+{order.items.length - 2} more items</li>
                          )}
                        </ul>
                      </div>
                      <Link
                        to={`/orders/${order._id}`}
                        className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium"
                      >
                        View details <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {!["delivered", "cancelled"].includes(order.status) && (
                    <div className="px-5 pb-5">
                      <div className="mb-2 flex justify-between text-xs text-gray-500">
                        <span>Order placed</span>
                        <span>On the way</span>
                        <span>Delivered</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${status.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders