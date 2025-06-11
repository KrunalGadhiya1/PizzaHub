"use client"

import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import api from "../../utils/api"
import toast from "react-hot-toast"

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch("password")

  const validatePassword = (value) => {
    const hasUpperCase = /[A-Z]/.test(value)
    const hasLowerCase = /[a-z]/.test(value)
    const hasNumbers = /\d/.test(value)
    const hasSpecialChar = /[@$!%*?&]/.test(value)
    const hasMinLength = value.length >= 8

    if (!hasMinLength) return "Password must be at least 8 characters long"
    if (!hasUpperCase) return "Password must contain at least one uppercase letter"
    if (!hasLowerCase) return "Password must contain at least one lowercase letter"
    if (!hasNumbers) return "Password must contain at least one number"
    if (!hasSpecialChar) return "Password must contain at least one special character (@$!%*?&)"

    return true
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: data.password,
      })
      toast.success("Password reset successfully!")
      navigate("/login")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" }

    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[@$!%*?&]/.test(password)) score++

    if (score <= 2) return { strength: score, label: "Weak", color: "bg-red-500" }
    if (score <= 3) return { strength: score, label: "Fair", color: "bg-yellow-500" }
    if (score <= 4) return { strength: score, label: "Good", color: "bg-blue-500" }
    return { strength: score, label: "Strong", color: "bg-green-500" }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Lock className="h-12 w-12 text-primary mx-auto" />
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below to complete the reset process.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register("password", {
                      required: "Password is required",
                      validate: validatePassword,
                    })}
                    type={showPassword ? "text" : "password"}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary pr-10"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{passwordStrength.label}</span>
                    </div>
                  </div>
                )}

                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) => value === password || "Passwords do not match",
                    })}
                    type={showConfirmPassword ? "text" : "password"}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary pr-10"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Password must contain:</p>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle
                      className={`h-4 w-4 ${password && password.length >= 8 ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span>At least 8 characters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle
                      className={`h-4 w-4 ${password && /[A-Z]/.test(password) ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span>One uppercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle
                      className={`h-4 w-4 ${password && /[a-z]/.test(password) ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span>One lowercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle
                      className={`h-4 w-4 ${password && /\d/.test(password) ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span>One number</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle
                      className={`h-4 w-4 ${password && /[@$!%*?&]/.test(password) ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span>One special character (@$!%*?&)</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <div className="spinner"></div> : "Reset Password"}
                </button>
              </div>

              <div className="text-center">
                <Link to="/login" className="text-primary hover:text-primary/80 transition-colors">
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
