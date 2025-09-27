const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if current user is admin
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('isAdmin');
    res.json({ isAdmin: user?.isAdmin || false });
  } catch (error) {
    console.error('Check admin status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password -encryptionKey').sort({ createdAt: -1 });
    
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add admin user
router.post('/users', authenticateToken, requireAdmin, [
  body('userId').isMongoId().withMessage('Valid user ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    user.isAdmin = true;
    await user.save();

    res.json({ message: 'User added as admin successfully' });
  } catch (error) {
    console.error('Add admin user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove admin user
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent removing yourself as admin
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot remove yourself as admin' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    user.isAdmin = false;
    await user.save();

    res.json({ message: 'Admin privileges removed successfully' });
  } catch (error) {
    console.error('Remove admin user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Registration control routes
router.get('/registration/status', async (req, res) => {
  try {
    // You can store this in database or environment variable
    const registrationEnabled = process.env.REGISTRATION_ENABLED !== 'false';
    res.json({ enabled: registrationEnabled });
  } catch (error) {
    console.error('Get registration status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/registration/enable', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // In production, you might want to store this in database
    process.env.REGISTRATION_ENABLED = 'true';
    res.json({ message: 'Registration enabled successfully' });
  } catch (error) {
    console.error('Enable registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/registration/disable', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // In production, you might want to store this in database
    process.env.REGISTRATION_ENABLED = 'false';
    res.json({ message: 'Registration disabled successfully' });
  } catch (error) {
    console.error('Disable registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get app statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });
    const todayUsers = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    res.json({
      totalUsers,
      onlineUsers,
      adminUsers,
      todayUsers,
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false'
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
