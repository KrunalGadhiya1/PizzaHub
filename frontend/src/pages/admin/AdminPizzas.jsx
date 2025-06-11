"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "react-hot-toast"

const AdminPizzas = () => {
  const [pizzas, setPizzas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPizzas = async () => {
      try {
        setLoading(true)
        const response = await axios.get("/api/pizzas")
        setPizzas(response.data)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch pizzas")
        toast.error("Failed to load pizzas")
        setLoading(false)
        console.error(err)
      }
    }

    fetchPizzas()
  }, [])

  if (loading) return <div className="text-center py-10">Loading pizzas...</div>
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Pizza Management</h1>

      <div className="mb-4">
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Add New Pizza</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Image</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Price</th>
              <th className="px-4 py-2 border">Category</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pizzas.length > 0 ? (
              pizzas.map((pizza) => (
                <tr key={pizza._id}>
                  <td className="px-4 py-2 border">
                    <img src={pizza.image || "/placeholder.svg"} alt={pizza.name} className="w-16 h-16 object-cover" />
                  </td>
                  <td className="px-4 py-2 border">{pizza.name}</td>
                  <td className="px-4 py-2 border">₹{pizza.price}</td>
                  <td className="px-4 py-2 border">{pizza.category}</td>
                  <td className="px-4 py-2 border">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded mr-2">Edit</button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-2 text-center">
                  No pizzas found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPizzas
