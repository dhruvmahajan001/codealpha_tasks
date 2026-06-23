const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post reference is required'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  content: {
    type: String,
    required: [true, 'Comment content cannot be empty'],
    maxlength: [280, 'Comment content cannot exceed 280 characters'],
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Comment', CommentSchema);
