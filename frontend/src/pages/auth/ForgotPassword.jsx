"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", data);
      setEmailSent(true);
      toast.success("Password reset email sent successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {emailSent ? (
          <div className="text-center space-y-4">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-800">Check your Email</h2>
            <p className="text-gray-600">
              A password reset link has been sent to your email address. Please follow the instructions there.
            </p>
            <Link
              to="/login"
              className="inline-block mt-4 bg-orange-500 text-white px-6 py-2 rounded-full font-medium shadow hover:bg-orange-600 transition"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <Mail className="h-10 w-10 mx-auto text-orange-500 mb-2" />
              <h2 className="text-2xl font-bold text-gray-800">Forgot your password?</h2>
              <p className="text-sm text-gray-600">
                Enter your email below and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                      message: "Enter a valid email",
                    },
                  })}
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="flex items-center justify-center text-orange-500 hover:underline text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
