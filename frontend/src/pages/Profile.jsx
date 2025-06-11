"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { useAuthStore } from "../store/authStore";
import { User, Mail, Phone, MapPin, Lock, Save, Loader2, Shield, Key, Edit } from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, updateUser } = useAuthStore();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      pincode: user?.address?.pincode || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
    watch,
  } = useForm();

  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await api.put("/auth/update-profile", data);
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        updateUser(data.user);
        toast.success("Profile updated successfully");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to update profile");
      },
    }
  );

  const changePasswordMutation = useMutation(
    async (data) => {
      const response = await api.put("/auth/change-password", data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success("Password changed successfully");
        resetPasswordForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to change password");
      },
    }
  );

  const onProfileSubmit = (data) => {
    const profileData = {
      name: data.name,
      phone: data.phone,
      address: {
        street: data.street,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
    };
    updateProfileMutation.mutate(profileData);
  };

  const onPasswordSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Security", icon: Shield },
  ];

  const passwordValue = watch("newPassword");

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">Manage your profile and security settings</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            {user?.isEmailVerified ? "Verified account" : "Account not verified"}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 text-center bg-gradient-to-r from-amber-50 to-white">
                <div className="relative mx-auto w-24 h-24 mb-4">
                  <div className="absolute inset-0 bg-amber-500 rounded-full opacity-20"></div>
                  <div className="absolute inset-2 flex items-center justify-center bg-amber-500 rounded-full shadow-md">
                    <User className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
              </div>

              <div className="divide-y divide-gray-100">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-amber-50 text-amber-600 font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? "text-amber-500" : "text-gray-400"}`} />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="ml-auto w-1 h-6 bg-amber-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                    <User className="h-6 w-6 text-amber-500" />
                    Personal Information
                  </h2>
                  <p className="text-gray-500 mt-1">Update your profile details and address</p>
                </div>

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="relative">
                        <input
                          {...registerProfile("name", {
                            required: "Name is required",
                            minLength: { value: 2, message: "Too short" },
                          })}
                          type="text"
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition"
                        />
                        <Edit className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                      {profileErrors.name && (
                        <p className="mt-1 text-sm text-red-500">{profileErrors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <input
                          value={user?.email}
                          disabled
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                        />
                        <Mail className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <input
                          {...registerProfile("phone", {
                            pattern: {
                              value: /^[6-9]\d{9}$/,
                              message: "Invalid phone number",
                            },
                          })}
                          type="tel"
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition"
                        />
                        <Phone className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                      {profileErrors.phone && (
                        <p className="mt-1 text-sm text-red-500">{profileErrors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="h-5 w-5 text-amber-500" />
                      <h3 className="text-lg font-medium text-gray-900">Delivery Address</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <input
                          {...registerProfile("street")}
                          placeholder="House no., Building, Street"
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          {...registerProfile("city")}
                          placeholder="City"
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          {...registerProfile("state")}
                          placeholder="State"
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                        <input
                          {...registerProfile("pincode", {
                            pattern: {
                              value: /^[1-9][0-9]{5}$/,
                              message: "Invalid pincode",
                            },
                          })}
                          placeholder="6-digit code"
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition"
                        />
                        {profileErrors.pincode && (
                          <p className="mt-1 text-sm text-red-500">{profileErrors.pincode.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isLoading}
                      className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {updateProfileMutation.isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "password" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                    <Shield className="h-6 w-6 text-amber-500" />
                    Security Settings
                  </h2>
                  <p className="text-gray-500 mt-1">Change your password and manage security</p>
                </div>

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="p-6 sm:p-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          {...registerPassword("currentPassword", { required: "Current password is required" })}
                          type="password"
                          placeholder="Enter current password"
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition"
                        />
                        <Key className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-500">{passwordErrors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          {...registerPassword("newPassword", {
                            required: "New password is required",
                            minLength: { value: 8, message: "Minimum 8 characters" },
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                              message: "Include uppercase, lowercase, number & special character",
                            },
                          })}
                          type="password"
                          placeholder="Create new password"
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition"
                        />
                        <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-500">{passwordErrors.newPassword.message}</p>
                      )}
                      {passwordValue && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`h-1 flex-1 rounded-full ${
                              passwordValue.length >= 8 ? 'bg-green-500' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-1 flex-1 rounded-full ${
                              /[A-Z]/.test(passwordValue) ? 'bg-green-500' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-1 flex-1 rounded-full ${
                              /\d/.test(passwordValue) ? 'bg-green-500' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-1 flex-1 rounded-full ${
                              /[@$!%*?&]/.test(passwordValue) ? 'bg-green-500' : 'bg-gray-200'
                            }`}></div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Password strength: {passwordValue.length >= 8 &&
                              /[A-Z]/.test(passwordValue) &&
                              /\d/.test(passwordValue) &&
                              /[@$!%*?&]/.test(passwordValue) ? 'Strong' : 'Weak'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                      <div className="relative">
                        <input
                          {...registerPassword("confirmPassword", {
                            required: "Confirm your password",
                            validate: (value, { newPassword }) =>
                              value === newPassword || "Passwords do not match",
                          })}
                          type="password"
                          placeholder="Re-enter new password"
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition"
                        />
                        <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end">
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isLoading}
                      className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {changePasswordMutation.isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5" />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;