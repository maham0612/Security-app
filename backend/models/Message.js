const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  fileType: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEncrypted: {
    type: Boolean,
    default: true
  },
  encryptedContent: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Auto-delete messages after 1 week (7 days)
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      return oneWeekFromNow;
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// TTL index for automatic message deletion after 1 week
messageSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 0
});

// Virtual for message status
messageSchema.virtual('status').get(function() {
  if (this.isDeleted) return 'deleted';
  if (this.expiresAt && this.expiresAt < new Date()) return 'expired';
  return 'active';
});

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.userId.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ userId, readAt: new Date() });
    this.isRead = this.readBy.length > 0;
  }
  return this.save();
};

// Method to encrypt content
messageSchema.methods.encryptContent = function(encryptionKey) {
  if (this.isEncrypted && encryptionKey) {
    const crypto = require('crypto');
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    let encrypted = cipher.update(this.content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    this.encryptedContent = encrypted;
    this.content = ''; // Clear original content
  }
};

// Method to decrypt content
messageSchema.methods.decryptContent = function(encryptionKey) {
  if (this.isEncrypted && this.encryptedContent && encryptionKey) {
    const crypto = require('crypto');
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(this.encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  return this.content;
};

module.exports = mongoose.model('Message', messageSchema);
