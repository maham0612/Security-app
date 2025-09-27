const express = require('express');
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

// Get all users (for chat list)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -encryptionKey')
      .sort({ isOnline: -1, lastSeen: -1 });

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      isAdmin: user.isAdmin
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user online status
router.put('/status', authenticateToken, async (req, res) => {
  try {
    const { isOnline } = req.body;
    
    await User.findByIdAndUpdate(req.user.userId, {
      isOnline: isOnline,
      lastSeen: new Date()
    });

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -encryptionKey');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      isAdmin: user.isAdmin,
      settings: user.settings
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, avatar, settings } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (settings) updateData.settings = settings;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    ).select('-password -encryptionKey');

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      isAdmin: user.isAdmin,
      settings: user.settings
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;