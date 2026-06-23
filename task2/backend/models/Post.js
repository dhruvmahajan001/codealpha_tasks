const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
  },
  content: {
    type: String,
    required: [true, 'Post content cannot be empty'],
    maxlength: [500, 'Post content cannot exceed 500 characters'],
    trim: true,
  },
  image: {
    type: String,
    default: '', // base64 or URL
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Post', PostSchema);
