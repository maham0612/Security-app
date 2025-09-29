const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// Get messages for a chat
router.get('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Get messages with pagination
    const messages = await Message.find({
      chatId: chatId,
      isDeleted: false,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
    .populate('senderId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Format messages for response
    const formattedMessages = messages.map(message => ({
      id: message._id,
      chatId: message.chatId,
      senderId: message.senderId._id,
      senderName: message.senderId.name,
      senderAvatar: message.senderId.avatar,
      content: message.content,
      type: message.type,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      timestamp: message.createdAt,
      isRead: message.isRead,
      isEncrypted: message.isEncrypted,
      expiresAt: message.expiresAt,
      daysUntilExpiry: message.expiresAt ? 
        Math.ceil((message.expiresAt - new Date()) / (1000 * 60 * 60 * 24)) : null
    }));

    res.json(formattedMessages.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/chats/:chatId/messages', authenticateToken, upload.single('file'), [
  body('content').optional().trim().isLength({ max: 2000 }).withMessage('Message too long'),
  body('type').optional().isIn(['text', 'image', 'file', 'audio', 'video']).withMessage('Invalid message type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId } = req.params;
    const { content, type = 'text' } = req.body;

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Handle file info from either uploaded multipart or from JSON body (already uploaded via /api/files/upload)
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
    } else if (req.body.fileUrl) {
      // Allow client to pass file metadata when file was uploaded separately
      fileUrl = req.body.fileUrl;
      fileName = req.body.fileName || null;
      fileSize = req.body.fileSize || null;
    }

    // Create message with automatic 1-week expiry
    const message = new Message({
      chatId: chatId,
      senderId: req.user.userId,
      content: content || '',
      type: type,
      fileUrl: fileUrl,
      fileName: fileName,
      fileSize: fileSize,
      isEncrypted: true
    });

    await message.save();

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageTime: message.createdAt
    });

    // Populate sender info
    await message.populate('senderId', 'name avatar');

    // Format response
    const formattedMessage = {
      id: message._id,
      chatId: message.chatId,
      senderId: message.senderId._id,
      senderName: message.senderId.name,
      senderAvatar: message.senderId.avatar,
      content: message.content,
      type: message.type,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      timestamp: message.createdAt,
      isRead: message.isRead,
      isEncrypted: message.isEncrypted,
      expiresAt: message.expiresAt,
      daysUntilExpiry: 7 // Messages expire in 7 days
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read
router.put('/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: message.chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await message.markAsRead(req.user.userId);

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get message expiry info
router.get('/messages/:messageId/expiry', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: message.chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const daysUntilExpiry = message.expiresAt ? 
      Math.ceil((message.expiresAt - now) / (1000 * 60 * 60 * 24)) : null;

    res.json({
      messageId: message._id,
      expiresAt: message.expiresAt,
      daysUntilExpiry: daysUntilExpiry,
      isExpired: message.expiresAt ? message.expiresAt < now : false
    });
  } catch (error) {
    console.error('Get message expiry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
