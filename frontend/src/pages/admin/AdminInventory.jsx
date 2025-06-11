"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { Plus, Search, Filter, Edit, Trash2, Package, AlertTriangle } from "lucide-react"
import api from "../../utils/api"
import toast from "react-hot-toast"

const AdminInventory = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const queryClient = useQueryClient()

  const {
    data: inventoryData,
    isLoading,
    error,
  } = useQuery(
    ["admin-inventory", { itemType: typeFilter !== "all" ? typeFilter : "", search: searchTerm }],
    async () => {
      const params = new URLSearchParams()
      if (typeFilter !== "all") params.append("itemType", typeFilter)
      if (searchTerm) params.append("search", searchTerm)

      const response = await api.get(`/inventory?${params.toString()}`)
      return response.data.data
    },
    {
      keepPreviousData: true,
    },
  )

  const deleteItemMutation = useMutation(
    async (itemId) => {
      await api.delete(`/inventory/${itemId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("admin-inventory")
        toast.success("Item deleted successfully")
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to delete item")
      },
    },
  )

  const restockMutation = useMutation(
    async ({ itemId, quantity }) => {
      await api.put(`/inventory/${itemId}/restock`, { quantity })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("admin-inventory")
        toast.success("Item restocked successfully")
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to restock item")
      },
    },
  )

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "base", label: "Pizza Base" },
    { value: "sauce", label: "Sauce" },
    { value: "cheese", label: "Cheese" },
    { value: "veggie", label: "Vegetables" },
    { value: "meat", label: "Meat" },
  ]

  const getTypeColor = (type) => {
    switch (type) {
      case "base":
        return "bg-yellow-100 text-yellow-800"
      case "sauce":
        return "bg-red-100 text-red-800"
      case "cheese":
        return "bg-orange-100 text-orange-800"
      case "veggie":
        return "bg-green-100 text-green-800"
      case "meat":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price)
  }

  const handleDelete = (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate(itemId)
    }
  }

  const handleRestock = (itemId) => {
    const quantity = prompt("Enter quantity to add:")
    if (quantity && !isNaN(quantity) && Number(quantity) > 0) {
      restockMutation.mutate({ itemId, quantity: Number(quantity) })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load inventory</p>
          <button onClick={() => window.location.reload()} className="text-primary hover:underline">
            Try again
          </button>
        </div>
      </div>
    )
  }

  const inventory = inventoryData?.inventory || []
  const lowStockItems = inventory.filter((item) => item.isLowStock)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Inventory Management</h1>
            <p className="text-gray-600">Manage your pizza ingredients and supplies</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-red-800">Low Stock Alert</h3>
            </div>
            <p className="text-red-700 mb-3">{lowStockItems.length} items are running low on stock:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockItems.map((item) => (
                <div key={item._id} className="bg-white p-3 rounded border">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-red-600">
                    {item.quantity} {item.unit} remaining (threshold: {item.threshold})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary appearance-none"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Grid */}
        {inventory.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No items found</h2>
            <p className="text-gray-600">No inventory items match your current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventory.map((item) => (
              <div
                key={item._id}
                className={`bg-white rounded-lg shadow-md overflow-hidden ${
                  item.isLowStock ? "border-2 border-red-200" : ""
                }`}
              >
                {item.image && (
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-32 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.itemType)}`}>
                      {item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className={`font-medium ${item.isLowStock ? "text-red-600" : "text-gray-900"}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-gray-900">{formatPrice(item.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Threshold:</span>
                      <span className="font-medium text-gray-900">{item.threshold}</span>
                    </div>
                  </div>

                  {item.isLowStock && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-4">
                      <p className="text-red-800 text-sm font-medium">⚠️ Low Stock Alert</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRestock(item._id)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Restock
                    </button>
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-gray-600 hover:text-primary transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {inventoryData?.pagination && inventoryData.pagination.pages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: inventoryData.pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-4 py-2 rounded-md ${
                    page === inventoryData.pagination.page
                      ? "bg-primary text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminInventory
