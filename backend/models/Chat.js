const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['personal', 'group'],
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  isEncrypted: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: null
  },
  settings: {
    allowCopy: {
      type: Boolean,
      default: false
    },
    allowShare: {
      type: Boolean,
      default: false
    },
    allowDelete: {
      type: Boolean,
      default: false
    },
    allowScreenshot: {
      type: Boolean,
      default: false
    },
    messageExpiry: {
      type: Number,
      default: null // in minutes
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

// Virtual for personal chat name
chatSchema.virtual('displayName').get(function() {
  if (this.type === 'personal') {
    // This will be populated when needed
    return this.name;
  }
  return this.name;
});

module.exports = mongoose.model('Chat', chatSchema);
