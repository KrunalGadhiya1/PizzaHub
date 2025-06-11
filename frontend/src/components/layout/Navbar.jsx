"use client"

import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { useCartStore } from "../../store/cartStore"
import {
  Pizza,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Settings,
  Package,
  Shield,
} from "lucide-react"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const { getCount } = useCartStore()
  const navigate = useNavigate()
  const location = useLocation()
  const cartCount = getCount?.() || 0

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate("/")
    setIsUserMenuOpen(false)
  }

  return (
    <nav className="bg-white/80 backdrop-blur shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-90 transition">
            <Pizza className="h-8 w-8 text-red-500" />
            <span className="text-2xl font-bold text-gray-800">PizzaHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 font-medium">
            {user?.role === "admin"
              ? [
                  { to: "/", label: "Home" },
                  { to: "/admin/orders", label: "Orders" },
                  { to: "/profile", label: "Profile" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`transition-colors hover:text-red-500 ${
                      isActive(item.to) ? "text-red-500 underline underline-offset-4" : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))
              : [
                  { to: "/", label: "Home" },
                  { to: "/menu", label: "Menu" },
                  { to: "/pizza-builder", label: "Build Pizza" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`transition-colors hover:text-red-500 ${
                      isActive(item.to) ? "text-red-500 underline underline-offset-4" : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

            {user && user.role !== "admin" && (
              <Link
                to="/orders"
                className={`transition-colors hover:text-red-500 ${
                  isActive("/orders") ? "text-red-500 underline underline-offset-4" : "text-gray-700"
                }`}
              >
                My Orders
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {user && user.role !== "admin" && (
              <Link to="/cart" className="relative text-gray-700 hover:text-red-500 transition">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition"
                >
                  <User className="h-6 w-6" />
                  <span className="hidden md:inline">{user.name}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg overflow-hidden z-50">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-red-500 transition font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-red-500"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t pt-4 pb-6 space-y-3 text-center font-medium">
            {(user?.role === "admin"
              ? [
                  { to: "/", label: "Home" },
                  { to: "/admin/orders", label: "Orders" },
                  { to: "/profile", label: "Profile" },
                ]
              : [
                  { to: "/", label: "Home" },
                  { to: "/menu", label: "Menu" },
                  { to: "/pizza-builder", label: "Build Pizza" },
                ]
            ).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className="block text-gray-700 hover:text-red-500 transition"
              >
                {item.label}
              </Link>
            ))}

            {user && user.role !== "admin" && (
              <>
                <Link
                  to="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-700 hover:text-red-500 transition"
                >
                  My Orders
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-700 hover:text-red-500 transition"
                >
                  Profile
                </Link>
              </>
            )}

            {!user && (
              <div className="pt-4 border-t space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-700 hover:text-red-500 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block bg-red-500 text-white py-2 rounded-full hover:bg-red-600 transition mx-auto w-5/6"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
