"use client"

import { useEffect, useState } from "react"
import { useQuery } from "react-query"
import { Link } from "react-router-dom"
import {
  Users,
  ShoppingBag,
  Package,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import api from "../../utils/api"
import toast from "react-hot-toast"

const AdminDashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery("dashboardStats", async () => {
    const response = await api.get("/admin/dashboard/stats")
    return response.data.data
  })

  // Fetch inventory alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery("inventoryAlerts", async () => {
    const response = await api.get("/admin/inventory/alerts")
    return response.data.data
  })

  // Fetch recent orders
  const { data: orders, isLoading: ordersLoading } = useQuery("recentOrders", async () => {
    const response = await api.get("/admin/orders/recent")
    return response.data.data
  })

  // Update order status
  const handleStatusUpdate = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status })
      toast.success("Order status updated successfully")
    } catch (error) {
      toast.error("Failed to update order status")
    }
  }

  // Update inventory item
  const handleInventoryUpdate = async (itemId, quantity) => {
    try {
      await api.put(`/admin/inventory/${itemId}`, { quantity })
      toast.success("Inventory updated successfully")
    } catch (error) {
      toast.error("Failed to update inventory")
    }
  }

  if (statsLoading || alertsLoading || ordersLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          trend={stats.ordersTrend}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Users}
          trend={stats.usersTrend}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={Package}
          trend={null}
          alert={true}
        />
        <StatCard
          title="Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          icon={TrendingUp}
          trend={stats.revenueTrend}
        />
      </div>

      {/* Inventory Alerts */}
      <section className="bg-white rounded-lg shadow mb-8">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Inventory Alerts</h2>
        </div>
        <div className="p-4">
          {alerts.length === 0 ? (
            <p className="text-gray-600">No alerts at the moment</p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <AlertTriangle className="text-red-500" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{alert.item.name}</h3>
                      <p className="text-sm text-gray-600">
                        Current stock: {alert.item.quantity} (Below threshold: {alert.threshold})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInventoryUpdate(alert.item._id, alert.item.quantity + 50)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Orders */}
      <section className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{order.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.items.length} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{order.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready for Delivery</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

// Helper component for stats cards
function StatCard({ title, value, icon: Icon, trend, alert }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div
            className={`p-3 rounded-full ${
              alert ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
            }`}
          >
            <Icon size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        {trend && (
          <div
            className={`flex items-center ${
              trend > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span className="ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

// Helper function for order status colors
function getStatusColor(status) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    ready: "bg-green-100 text-green-800",
    delivered: "bg-gray-100 text-gray-800",
  }
  return colors[status] || colors.pending
}

export default AdminDashboard
