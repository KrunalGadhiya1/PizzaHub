"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { Search, Filter, Eye, Clock, Package, Truck, CheckCircle, XCircle, X } from "lucide-react"
import api from "../../utils/api"
import toast from "react-hot-toast"

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt:desc")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const queryClient = useQueryClient()

  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery(
    ["admin-orders", { status: statusFilter !== "all" ? statusFilter : "", search: searchTerm, sort: sortBy }],
    async () => {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (searchTerm) params.append("search", searchTerm)
      if (sortBy) params.append("sort", sortBy)

      const response = await api.get(`/orders?${params.toString()}`)
      return response.data.data
    },
    { keepPreviousData: true },
  )

  const updateStatusMutation = useMutation(
    async ({ orderId, status }) => {
      const response = await api.put(`/orders/${orderId}/status`, { status })
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("admin-orders")
        toast.success("Order status updated successfully")
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to update order status")
      },
    },
  )

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "out-for-delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ]

  const sortOptions = [
    { value: "createdAt:desc", label: "Newest First" },
    { value: "createdAt", label: "Oldest First" },
    { value: "totalAmount:desc", label: "Highest Amount" },
    { value: "totalAmount", label: "Lowest Amount" },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock className="h-5 w-5 text-yellow-500" />
      case "confirmed":
      case "preparing": return <Package className="h-5 w-5 text-blue-500" />
      case "ready":
      case "out-for-delivery": return <Truck className="h-5 w-5 text-orange-500" />
      case "delivered": return <CheckCircle className="h-5 w-5 text-green-500" />
      case "cancelled": return <XCircle className="h-5 w-5 text-red-500" />
      default: return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-900"
      case "confirmed":
      case "preparing": return "bg-blue-100 text-blue-900"
      case "ready":
      case "out-for-delivery": return "bg-orange-100 text-orange-900"
      case "delivered": return "bg-green-100 text-green-900"
      case "cancelled": return "bg-red-100 text-red-900"
      default: return "bg-gray-100 text-gray-900"
    }
  }

  const getNextStatus = (status) => {
    const flow = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
      ready: "out-for-delivery",
      "out-for-delivery": "delivered",
    }
    return flow[status]
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus })
  }

  const orders = ordersData?.orders || []

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">Loading orders...</div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <p>Failed to load orders. <button onClick={() => window.location.reload()} className="text-blue-600 underline ml-2">Retry</button></p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Management</h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No orders match the current filters.</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full text-sm text-left text-gray-800">
              <thead className="bg-gray-100 text-xs uppercase font-semibold text-gray-600">
                <tr>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">#{order.orderNumber}</div>
                      <div className="text-gray-500 text-xs">{order.paymentMethod.toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.user?.name}</div>
                      <div className="text-gray-500 text-xs">{order.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{order.items.length} item(s)</div>
                      <div className="text-gray-500 text-xs truncate">
                        {order.items.slice(0, 2).map((i) => i.pizza?.name || "Custom Pizza").join(", ")}
                        {order.items.length > 2 && "..."}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{formatPrice(order.totalAmount)}</div>
                      <div className="text-gray-500 text-xs">{order.paymentStatus === "completed" ? "Paid" : "Pending"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace("-", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 space-x-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {getNextStatus(order.status) && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, getNextStatus(order.status))}
                          disabled={updateStatusMutation.isLoading}
                          className="bg-orange-500 text-white px-3 py-1 text-xs rounded hover:bg-orange-600 disabled:opacity-50"
                        >
                          {updateStatusMutation.isLoading ? "..." : "Next"}
                        </button>
                      )}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, "cancelled")}
                          disabled={updateStatusMutation.isLoading}
                          className="bg-red-600 text-white px-3 py-1 text-xs rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Order #{selectedOrder.orderNumber}</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Customer Info */}
                  <div>
                    <h3 className="font-medium text-gray-900">Customer Information</h3>
                    <p className="text-gray-600">{selectedOrder.user?.name}</p>
                    <p className="text-gray-600">{selectedOrder.user?.email}</p>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-medium text-gray-900">Order Items</h3>
                    <div className="mt-2 space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.pizza?.name || "Custom Pizza"} x {item.quantity}</span>
                          <span>{formatPrice(item.price)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>{formatPrice(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status History */}
                  <div>
                    <h3 className="font-medium text-gray-900">Status History</h3>
                    <div className="mt-2 space-y-2">
                      {selectedOrder.statusHistory?.map((history, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                          <span className="font-medium">{history.status.charAt(0).toUpperCase() + history.status.slice(1).replace("-", " ")}</span>
                          <span className="text-gray-500">{formatDate(history.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <h3 className="font-medium text-gray-900">Delivery Address</h3>
                    <p className="text-gray-600 mt-1">{selectedOrder.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {ordersData?.pagination?.pages > 1 && (
          <div className="mt-6 flex justify-center">
            {Array.from({ length: ordersData.pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`px-4 py-2 rounded-md mx-1 text-sm ${
                  page === ordersData.pagination.page
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOrders