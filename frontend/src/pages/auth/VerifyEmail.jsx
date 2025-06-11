"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"
import api from "../../utils/api"

const VerifyEmail = () => {
  const { token } = useParams()
  const [status, setStatus] = useState("verifying") // verifying, success, error
  const [message, setMessage] = useState("")
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (token) {
      verifyEmail()
    }
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`)
      setStatus("success")
      setMessage(response.data.message)
    } catch (error) {
      setStatus("error")
      setMessage(error.response?.data?.message || "Email verification failed")
    }
  }

  const resendVerificationEmail = async () => {
    setIsResending(true)
    try {
      await api.post("/auth/resend-verification-email")
      setMessage("Verification email sent successfully! Please check your inbox.")
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to resend verification email")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === "verifying" && (
              <>
                <div className="spinner mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying Email</h2>
                <p className="text-gray-600">Please wait while we verify your email address...</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <Link
                  to="/login"
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Continue to Login
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-4">
                  <button
                    onClick={resendVerificationEmail}
                    disabled={isResending}
                    className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isResending ? (
                      <div className="spinner"></div>
                    ) : (
                      <>
                        <RefreshCw className="h-5 w-5" />
                        <span>Resend Verification Email</span>
                      </>
                    )}
                  </button>
                  <Link to="/login" className="block text-center text-primary hover:text-primary/80 transition-colors">
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
