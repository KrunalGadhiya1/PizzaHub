"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Pizza, User, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("user");
  const { login: loginUser, isLoading } = useAuthStore();
  const { addToCart } = useCartStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const result = await loginUser({ ...data, role: userType });
      if (result.success) {
        // Check for pending custom pizza
        const pendingPizza = localStorage.getItem('pendingCustomPizza');
        if (pendingPizza) {
          const customPizza = JSON.parse(pendingPizza);
          addToCart(customPizza);
          localStorage.removeItem('pendingCustomPizza');
          toast.success("Custom pizza added to cart!");
          navigate("/cart");
        } else {
          toast.success("Login successful!");
          navigate("/");
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-rose-100 flex justify-center items-center px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-center mb-4">
          <Pizza className="h-10 w-10 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800">Welcome Back</h2>
        <p className="text-center text-sm text-gray-600 mt-1">
          Don't have an account?{" "}
          <Link to="/register" className="text-orange-500 hover:underline font-medium">
            Sign up here
          </Link>
        </p>

        {/* Role Selector */}
        <div className="flex gap-2 mt-6">
          {["user", "admin"].map((role) => (
            <button
              key={role}
              onClick={() => setUserType(role)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition ${
                userType === role
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              type="button"
            >
              {role === "user" ? <User className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {role === "user" ? "Customer" : "Admin"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email format",
                },
              })}
              placeholder="Enter your email"
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                {...register("password", {
                  required: "Password is required",
                })}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full mt-1 px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 transition disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : `Login as ${userType === "admin" ? "Admin" : "Customer"}`}
          </button>
        </form>

        {/* Forgot Password */}
        <div className="text-center mt-4">
          <Link
            to="/forgot-password"
            className="text-sm text-orange-500 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
