import mongoose from "mongoose"

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: true,
  },
  registrationData: {
    name: String,
    email: String,
    password: String,
    role: {
      type: String,
      enum: ["user", "admin", "customer"],
      default: "user"
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Document will be automatically deleted after 10 minutes
  }
})

const OTP = mongoose.model("OTP", otpSchema)

export default OTP 