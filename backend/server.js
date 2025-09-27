const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.100.191:3000", "*"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/files', require('./routes/files'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Socket.IO connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.userId = decoded.userId;
    next();
  });
});

io.on('connection', async (socket) => {
  console.log(`User ${socket.userId} connected`);

  // Update user online status
  try {
    const User = require('./models/User');
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    });
    
    // Notify all users about online status
    socket.broadcast.emit('user_online', { userId: socket.userId });
  } catch (error) {
    console.error('Error updating user online status:', error);
  }

  // Join chat room
  socket.on('join_chat', (data) => {
    socket.join(data.chatId);
    console.log(`User ${socket.userId} joined chat ${data.chatId}`);
  });

  // Leave chat room
  socket.on('leave_chat', (data) => {
    socket.leave(data.chatId);
    console.log(`User ${socket.userId} left chat ${data.chatId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const Message = require('./models/Message');
      const Chat = require('./models/Chat');
      const User = require('./models/User');

      // Check if message already exists (prevent duplicates)
      const existingMessage = await Message.findOne({
        chatId: data.chatId,
        senderId: socket.userId,
        content: data.content,
        createdAt: { $gte: new Date(Date.now() - 5000) } // Within last 5 seconds
      });

      if (existingMessage) {
        console.log('Duplicate message prevented');
        return;
      }

      // Create message
      const message = new Message({
        chatId: data.chatId,
        senderId: socket.userId,
        content: data.content,
        type: data.type || 'text',
        isEncrypted: true
      });

      await message.save();

      // Update chat's last message
      await Chat.findByIdAndUpdate(data.chatId, {
        lastMessage: message._id,
        lastMessageTime: message.createdAt
      });

      // Populate sender info
      await message.populate('senderId', 'name avatar');

      // Emit to all users in the chat
      io.to(data.chatId).emit('new_message', {
        id: message._id,
        chatId: message.chatId,
        senderId: message.senderId._id,
        senderName: message.senderId.name,
        senderAvatar: message.senderId.avatar,
        content: message.content,
        type: message.type,
        timestamp: message.createdAt,
        isRead: message.isRead,
        isEncrypted: message.isEncrypted,
        expiresAt: message.expiresAt,
        daysUntilExpiry: 7
      });

      console.log(`Message sent by ${socket.userId} in chat ${data.chatId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.chatId).emit('typing_start', {
      chatId: data.chatId,
      userId: socket.userId
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.chatId).emit('typing_stop', {
      chatId: data.chatId,
      userId: socket.userId
    });
  });

  // Mark message as read
  socket.on('mark_read', async (data) => {
    try {
      const Message = require('./models/Message');
      const message = await Message.findById(data.messageId);
      if (message) {
        await message.markAsRead(socket.userId);
        io.to(data.chatId).emit('message_updated', {
          messageId: data.messageId,
          isRead: true
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Admin controls
  socket.on('admin_toggle_registration', (data) => {
    process.env.REGISTRATION_ENABLED = data.enabled ? 'true' : 'false';
    io.emit('registration_toggled', { enabled: data.enabled });
  });

  socket.on('disconnect', async () => {
    console.log(`User ${socket.userId} disconnected`);
    
    // Update user offline status
    try {
      const User = require('./models/User');
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      });
      
      // Notify all users about offline status
      socket.broadcast.emit('user_offline', { userId: socket.userId });
    } catch (error) {
      console.error('Error updating user offline status:', error);
    }
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/securechat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});
