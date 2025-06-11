import { errorResponse } from "../utils/responseHandler.js"

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    return errorResponse(res, "Access denied. Admin privileges required.", 403)
  }
}

export const requireVerifiedEmail = (req, res, next) => {
  if (req.user && req.user.isEmailVerified) {
    next()
  } else {
    return errorResponse(res, "Please verify your email first.", 403)
  }
} 