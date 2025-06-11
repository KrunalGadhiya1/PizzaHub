import Order from '../models/Order.js';
import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import { validateAdmin } from '../middleware/auth.js';

// Get user login statistics
export const getUserStats = async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      onlineUsers,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      recentLogins
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isOnline: true }),
      User.countDocuments({ lastActive: { $gte: oneDayAgo } }),
      User.countDocuments({ lastActive: { $gte: oneWeekAgo } }),
      User.countDocuments({ lastActive: { $gte: oneMonthAgo } }),
      User.find({ lastLogin: { $gte: oneDayAgo } })
        .select('name email lastLogin lastActive isOnline')
        .sort({ lastLogin: -1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        onlineUsers,
        activeUsers: {
          today: activeToday,
          thisWeek: activeThisWeek,
          thisMonth: activeThisMonth
        },
        recentLogins
      }
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
};

// Get currently online users
export const getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await User.find({ isOnline: true })
      .select('name email lastLogin lastActive')
      .sort({ lastActive: -1 });

    res.json({
      success: true,
      data: {
        count: onlineUsers.length,
        users: onlineUsers
      }
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users'
    });
  }
};

// Get user login history
export const getUserLoginHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('name email loginHistory lastLogin lastActive isOnline');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user login history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user login history'
    });
  }
};

// Get dashboard statistics with growth metrics
export const getDashboardStats = async (req, res) => {
  try {
    // Get current date and last month's date
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Current period stats
    const currentStats = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: lastMonth } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: lastMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      User.countDocuments({ role: 'customer', lastActive: { $gte: lastMonth } }),
      Order.countDocuments({ status: 'pending' })
    ]);

    // Previous period stats for growth calculation
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const previousStats = await Promise.all([
      Order.countDocuments({ 
        createdAt: { 
          $gte: previousMonth,
          $lt: lastMonth 
        } 
      }),
      Order.aggregate([
        { 
          $match: { 
            createdAt: { 
              $gte: previousMonth,
              $lt: lastMonth 
            } 
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Calculate growth percentages
    const orderGrowth = calculateGrowth(previousStats[0], currentStats[0]);
    const revenueGrowth = calculateGrowth(
      previousStats[1][0]?.total || 0,
      currentStats[1][0]?.total || 0
    );

    res.json({
      success: true,
      data: {
        totalOrders: currentStats[0],
        totalRevenue: currentStats[1][0]?.total || 0,
        activeUsers: currentStats[2],
        pendingOrders: currentStats[3],
        growth: {
          orders: orderGrowth,
          revenue: revenueGrowth
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Get recent orders with pagination
export const getRecentOrders = async (req, res) => {
  try {
    const { limit = 5, sort = 'createdAt:desc', page = 1 } = req.query;
    const [sortField, sortOrder] = sort.split(':');
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ [sortField]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments();

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent orders'
    });
  }
};

// Get low stock inventory items
export const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: {
        $lte: ['$quantity', '$threshold']
      }
    }).sort({ quantity: 1 });

    res.json({
      success: true,
      data: {
        inventory: lowStockItems
      }
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock items'
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!['pending', 'processing', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('name email createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
};

// Helper function to calculate growth percentage
const calculateGrowth = (previous, current) => {
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
}; 