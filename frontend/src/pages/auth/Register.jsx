import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../config/axios';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
  });

  const [otpData, setOtpData] = useState({
    otp: '',
    timer: 0,
    showOtpInput: false,
  });

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let interval;
    if (otpData.timer > 0) {
      interval = setInterval(() => {
        setOtpData(prev => ({ ...prev, timer: prev.timer - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpData.timer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = () => {
    setIsAdmin(!isAdmin);
    setFormData(prev => ({ ...prev, role: !isAdmin ? 'admin' : 'customer' }));
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtpData(prev => ({ ...prev, otp: value }));
    if (value.length === 6) e.target.blur();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/register', formData);
      toast.success('OTP sent to your email');
      setOtpData({ ...otpData, showOtpInput: true, timer: 60 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpData.otp.length !== 6) {
      toast.error('Enter a valid 6-digit OTP');
      return;
    }
    try {
      const res = await axios.post('/auth/verify-otp', {
        email: formData.email,
        otp: otpData.otp.toString(),
      });

      if (res.data.success) {
        toast.success('Registration successful!');
        localStorage.setItem('token', res.data.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
        navigate(res.data.data.user.role === 'admin' ? '/admin/dashboard' : '/');
      } else {
        toast.error(res.data.message || 'Verification failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleResendOTP = async () => {
    if (otpData.timer > 0) return;
    try {
      await axios.post('/auth/resend-otp', { email: formData.email });
      toast.success('New OTP sent');
      setOtpData(prev => ({ ...prev, timer: 60 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 px-4">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center text-orange-600 mb-2">
          {otpData.showOtpInput ? 'Verify Your Email' : 'Register an Account'}
        </h2>

        {!otpData.showOtpInput && (
          <p className="text-center text-sm text-gray-600 mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        )}

        {!otpData.showOtpInput ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />

            <div className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                id="admin-toggle"
                checked={isAdmin}
                onChange={handleRoleToggle}
                className="accent-orange-600"
              />
              <label htmlFor="admin-toggle" className="text-gray-700">
                Register as Admin
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md transition duration-300 font-medium"
            >
              Create Account
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="text-sm text-center text-gray-600 mb-2">
              Enter the OTP sent to{' '}
              <span className="font-medium text-gray-800">{formData.email}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otpData.otp}
              onChange={handleOtpChange}
              placeholder="Enter 6-digit OTP"
              className="w-full text-center px-4 py-2 border border-gray-300 rounded-md tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
              maxLength={6}
              autoFocus
            />

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={otpData.timer > 0}
                className={`text-sm ${
                  otpData.timer > 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-orange-600 hover:underline'
                }`}
              >
                {otpData.timer > 0 ? `Resend OTP in ${otpData.timer}s` : 'Resend OTP'}
              </button>
            </div>

            <button
              type="submit"
              disabled={otpData.otp.length !== 6}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md transition duration-300 font-medium disabled:bg-orange-300"
            >
              Verify OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
