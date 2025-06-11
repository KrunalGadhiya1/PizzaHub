import express from "express";
import {
    register,
    verifyOTP,
    resendOTP,
    login,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    updateProfile,
    changePassword,
    logout,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
    validateRegistration,
    validateLogin,
    validateOTP,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router.post("/register", validateRegistration, register);
router.post("/verify-otp", validateOTP, verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", validateLogin, login);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification-email", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/reset-password/:token", resetPassword);

router.get("/me", protect, getCurrentUser);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/logout", protect, logout);

export default router;