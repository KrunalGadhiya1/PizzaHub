import User from "../models/User.js"
import OTP from "../models/OTP.js"
import { successResponse, errorResponse } from "../utils/responseHandler.js"
import { generateToken } from "../utils/generateToken.js"
import { sendEmail } from "../utils/sendEmail.js"
import crypto from "crypto"

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// @desc    Start registration process
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const normalizedEmail = email.toLowerCase()

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      })
    }

    // Generate OTP
    const otp = generateOTP()
    
    try {
      // Send OTP email first
      console.log('Starting registration process for:', normalizedEmail);
      
      await sendEmail({
        to: normalizedEmail,
        subject: "Email Verification OTP - Pizza King",
        html: `
          <h1>Welcome to Pizza King!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for registering with Pizza King. Your verification code is:</p>
          <div style="margin: 20px 0;">
            <h2 style="font-size: 36px; letter-spacing: 5px; background-color: #f5f5f5; padding: 20px; text-align: center; font-family: monospace;">${otp}</h2>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't register for a Pizza King account, please ignore this email.</p>
        `
      });

      // Only store OTP if email was sent successfully
      await OTP.create({
        email: normalizedEmail,
        otp,
        registrationData: {
          name,
          email: normalizedEmail,
          password,
          role: role === 'admin' ? 'admin' : 'customer' // Default to customer if not admin
        }
      });

      res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please verify to complete registration."
      });
    } catch (emailError) {
      // Delete any created OTP document if email fails
      await OTP.deleteOne({ email: normalizedEmail });
      
      console.error("Email sending error:", {
        error: emailError.message,
        code: emailError.code,
        response: emailError.response?.body?.errors
      });
      
      // Check for specific SendGrid errors
      const sgError = emailError.response?.body?.errors?.[0];
      let errorMessage = "Failed to send OTP email. Please try again later.";
      
      if (sgError) {
        switch(sgError.message) {
          case "The from address does not match a verified Sender Identity":
            errorMessage = "Email service not properly configured. Please contact support.";
            break;
          case "Rate Limit Exceeded":
            errorMessage = "Too many attempts. Please try again in a few minutes.";
            break;
          default:
            if (process.env.NODE_ENV === "development") {
              errorMessage = sgError.message;
            }
        }
      }
      
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body
    const normalizedEmail = email.toLowerCase()
    const normalizedOTP = otp.toString()

    console.log("Verifying OTP:", { email: normalizedEmail, otp: normalizedOTP })

    // Get registration data
    const otpDoc = await OTP.findOne({ email: normalizedEmail })
    console.log("Found OTP document:", otpDoc)

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP request"
      })
    }

    // Check if OTP matches
    console.log("Comparing OTPs:", {
      received: normalizedOTP,
      stored: otpDoc.otp,
      matches: otpDoc.otp === normalizedOTP
    })

    if (otpDoc.otp !== normalizedOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      })
    }

    // Create user
    const user = await User.create({
      name: otpDoc.registrationData.name,
      email: otpDoc.registrationData.email,
      password: otpDoc.registrationData.password,
      role: otpDoc.registrationData.role,
      isEmailVerified: true
    })

    // Remove OTP document
    await otpDoc.deleteOne()

    // Generate JWT
    const authToken = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: "Registration completed successfully",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: true
        },
        token: authToken
      }
    })
  } catch (error) {
    console.error("OTP verification error:", error)
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body
    const normalizedEmail = email.toLowerCase()

    // Check if there's a pending registration
    const otpDoc = await OTP.findOne({ email: normalizedEmail })
    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found"
      })
    }

    // Generate new OTP
    const newOTP = generateOTP()
    
    // Update OTP
    otpDoc.otp = newOTP
    otpDoc.createdAt = Date.now()
    await otpDoc.save()

    // Send new OTP email
    await sendEmail({
      to: normalizedEmail,
      subject: "New OTP - Pizza King",
      html: `
        <h1>New Verification Code</h1>
        <p>Hi ${otpDoc.registrationData.name},</p>
        <p>Your new verification code is:</p>
        <div style="margin: 20px 0;">
          <h2 style="font-size: 36px; letter-spacing: 5px; background-color: #f5f5f5; padding: 20px; text-align: center; font-family: monospace;">${newOTP}</h2>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `
    })

    res.status(200).json({
      success: true,
      message: "New OTP sent to your email"
    })
  } catch (error) {
    console.error("Resend OTP error:", error)
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = email.toLowerCase()

    console.log("Login attempt for:", normalizedEmail)

    // Find user and include password for comparison
    const user = await User.findOne({ email: normalizedEmail }).select("+password")

    if (!user) {
      console.log("User not found:", normalizedEmail)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    console.log("Password match result:", isMatch)

    if (!isMatch) {
      console.log("Invalid password for user:", normalizedEmail)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    // Log login
    await user.logLogin(
      req.headers['user-agent'] || 'Unknown Device',
      req.ip || 'Unknown IP'
    )

    // Generate JWT
    const token = generateToken(user._id)

    // Remove password from response
    user.password = undefined

    console.log("Login successful for:", normalizedEmail)

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params

    // Hash token
    const emailVerificationToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    // Find user with token
    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      })
    }

    // Update user
    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: "Email verified successfully"
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification/:email
// @access  Public
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.params

    // Find pending registration
    let found = false
    let foundToken = null
    
    for (const [token, data] of otpStorage.entries()) {
      if (data.email === email) {
        found = true
        foundToken = token
        break
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        message: "No pending registration found for this email"
      })
    }

    const registrationData = otpStorage.get(foundToken)

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${foundToken}`

    // Send verification email
    await sendEmail({
      to: email,
      subject: "Email Verification - Pizza King",
      html: `
        <h1>Welcome to Pizza King!</h1>
        <p>Hi ${registrationData.name},</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="margin: 20px 0;">
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't register for a Pizza King account, please ignore this email.</p>
      `
    })

    res.status(200).json({
      success: true,
      message: "Verification email resent. Please check your inbox."
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const normalizedEmail = email.toLowerCase()

    console.log("Forgot password request for:", normalizedEmail)

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken()
    await user.save()

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    console.log("Reset URL generated:", resetUrl)

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      html: `
        <h1>Reset Your Password</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
      `
    })

    res.status(200).json({
      success: true,
      message: "Password reset email sent"
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    console.log("Reset password attempt with token:", token)

    // Hash token
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    console.log("Hashed token:", passwordResetToken)

    // Find user with token
    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select("+password")

    if (!user) {
      console.log("No user found with token or token expired")
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      })
    }

    console.log("User found, updating password")

    // Update password
    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    console.log("Password updated successfully")

    res.status(200).json({
      success: true,
      message: "Password reset successful"
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return errorResponse(res, "User not found", 404)
    }

    successResponse(res, "User fetched successfully", 200, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        phone: user.phone,
        address: user.address,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body

    // Find user
    const user = await User.findById(req.user._id)

    if (!user) {
      return errorResponse(res, "User not found", 404)
    }

    // Update user
    if (name) user.name = name
    if (phone) user.phone = phone
    if (address) user.address = address

    await user.save()

    successResponse(res, "Profile updated successfully", 200, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        phone: user.phone,
        address: user.address,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Find user
    const user = await User.findById(req.user._id).select("+password")

    if (!user) {
      return errorResponse(res, "User not found", 404)
    }

    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword)

    if (!isMatch) {
      return errorResponse(res, "Current password is incorrect", 401)
    }

    // Update password
    user.password = newPassword
    await user.save()

    successResponse(res, "Password changed successfully", 200)
  } catch (error) {
    next(error)
  }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // Check if req.user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    const user = await User.findById(req.user._id);
    if (user) {
      await user.logLogout();
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};
