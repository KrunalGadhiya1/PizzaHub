import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const cartItemSchema = new mongoose.Schema({
  pizza: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pizza",
    required: false
  },
  size: {
    type: String,
    required: true,
    enum: ["small", "medium", "large"]
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  customPizza: {
    base: {
      _id: { type: String },
      name: String,
      cost: Number,
      itemType: String,
      image: String,
      quantity: Number
    },
    sauce: {
      _id: { type: String },
      name: String,
      cost: Number,
      itemType: String,
      image: String,
      quantity: Number
    },
    cheese: {
      _id: { type: String },
      name: String,
      cost: Number,
      itemType: String,
      image: String,
      quantity: Number
    },
    veggies: [{
      _id: { type: String },
      name: String,
      cost: Number,
      itemType: String,
      image: String,
      quantity: Number
    }],
    image: String,
    name: String,
    description: String
  }
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "customer"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginHistory: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      device: String,
      ipAddress: String
    }],
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, "Please enter a valid Indian phone number"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: {
        type: String,
        match: [/^[1-9][0-9]{5}$/, "Please enter a valid pincode"],
      },
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    cart: [cartItemSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex")

  this.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex")

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

  return token
}

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString("hex")

  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

  // Set expire time to 10 minutes from now
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000

  console.log("Generated reset token:", {
    token: resetToken,
    hashedToken: this.passwordResetToken,
    expires: new Date(this.passwordResetExpires)
  })

  return resetToken
}

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Log user login
userSchema.methods.logLogin = function(deviceInfo, ipAddress) {
  this.isOnline = true;
  this.lastLogin = new Date();
  this.lastActive = new Date();
  this.loginHistory.push({
    timestamp: new Date(),
    device: deviceInfo,
    ipAddress: ipAddress
  });
  return this.save();
};

// Log user logout
userSchema.methods.logLogout = function() {
  this.isOnline = false;
  this.lastActive = new Date();
  return this.save();
};

export default mongoose.model("User", userSchema)
