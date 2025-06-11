import { Navigate } from "react-router-dom"
import { useAuthStore } from "../store/authStore"

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />
  }

  if (!user.isEmailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verification Required</h2>
          <p className="text-gray-600 mb-4">Please verify your email address to access the admin panel.</p>
        </div>
      </div>
    )
  }

  return children
}

export default AdminRoute
