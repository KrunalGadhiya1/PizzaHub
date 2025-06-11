import express from 'express';
import { 
  getDashboardStats, 
  getRecentOrders, 
  getLowStockItems, 
  updateOrderStatus,
  getUserStats,
  getOnlineUsers,
  getUserLoginHistory
} from '../controllers/adminController.js';
import { validateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Protect all admin routes with admin validation middleware
router.use(validateAdmin);

// Dashboard routes
router.get('/dashboard', getDashboardStats);
router.get('/orders', getRecentOrders);
router.get('/inventory/low-stock', getLowStockItems);
router.put('/orders/:orderId/status', updateOrderStatus);

// User statistics routes
router.get('/users/stats', getUserStats);
router.get('/users/online', getOnlineUsers);
router.get('/users/:userId/login-history', getUserLoginHistory);

export default router; 