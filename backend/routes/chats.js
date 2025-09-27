const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
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

// Get all chats for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.userId
    })
    .populate('participants', 'name email avatar isOnline lastSeen')
    .populate('lastMessage')
    .sort({ lastMessageTime: -1 });

    // Format chats for response
    const formattedChats = chats.map(chat => {
      const otherParticipants = chat.participants.filter(
        p => p._id.toString() !== req.user.userId.toString()
      );

      return {
        id: chat._id,
        name: chat.type === 'personal' 
          ? otherParticipants[0]?.name || 'Unknown User'
          : chat.name,
        type: chat.type,
        participants: chat.participants.map(p => p._id),
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        isEncrypted: chat.isEncrypted,
        avatar: chat.type === 'personal' 
          ? otherParticipants[0]?.avatar 
          : chat.avatar,
        settings: chat.settings
      };
    });

    res.json(formattedChats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create personal chat
router.post('/personal', authenticateToken, [
  body('userId').isMongoId().withMessage('Valid user ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if personal chat already exists
    const existingChat = await Chat.findOne({
      type: 'personal',
      participants: { $all: [req.user.userId, userId] }
    });

    if (existingChat) {
      return res.json({
        id: existingChat._id,
        name: user.name,
        type: 'personal',
        participants: existingChat.participants,
        lastMessage: existingChat.lastMessage,
        lastMessageTime: existingChat.lastMessageTime,
        isEncrypted: existingChat.isEncrypted,
        avatar: user.avatar,
        settings: existingChat.settings
      });
    }

    // Create new personal chat
    const chat = new Chat({
      name: user.name,
      type: 'personal',
      participants: [req.user.userId, userId],
      createdBy: req.user.userId,
      settings: {
        allowCopy: false,
        allowShare: false,
        allowDelete: false,
        allowScreenshot: false
      }
    });

    await chat.save();

    res.status(201).json({
      id: chat._id,
      name: user.name,
      type: 'personal',
      participants: chat.participants,
      lastMessage: null,
      lastMessageTime: chat.createdAt,
      isEncrypted: chat.isEncrypted,
      avatar: user.avatar,
      settings: chat.settings
    });
  } catch (error) {
    console.error('Create personal chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create group chat
router.post('/group', authenticateToken, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Group name required'),
  body('participants').isArray({ min: 1 }).withMessage('At least one participant required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, participants } = req.body;

    // Add current user to participants
    const allParticipants = [...participants, req.user.userId];

    // Verify all participants exist
    const users = await User.find({ _id: { $in: allParticipants } });
    if (users.length !== allParticipants.length) {
      return res.status(400).json({ message: 'One or more participants not found' });
    }

    // Create group chat
    const chat = new Chat({
      name,
      type: 'group',
      participants: allParticipants,
      createdBy: req.user.userId,
      settings: {
        allowCopy: false,
        allowShare: false,
        allowDelete: false,
        allowScreenshot: false
      }
    });

    await chat.save();

    res.status(201).json({
      id: chat._id,
      name: chat.name,
      type: 'group',
      participants: chat.participants,
      lastMessage: null,
      lastMessageTime: chat.createdAt,
      isEncrypted: chat.isEncrypted,
      avatar: chat.avatar,
      settings: chat.settings
    });
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat by ID
router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId
    })
    .populate('participants', 'name email avatar isOnline lastSeen')
    .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json({
      id: chat._id,
      name: chat.name,
      type: chat.type,
      participants: chat.participants,
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime,
      isEncrypted: chat.isEncrypted,
      avatar: chat.avatar,
      settings: chat.settings
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update chat settings
router.put('/:chatId/settings', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only creator can update settings
    if (chat.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Only chat creator can update settings' });
    }

    const { settings } = req.body;
    chat.settings = { ...chat.settings, ...settings };
    await chat.save();

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update chat settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
