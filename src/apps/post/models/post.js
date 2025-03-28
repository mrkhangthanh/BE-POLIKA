const mongoose = require('../../../common/init.myDB')();

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: {
    type: [String],
    default: []
  },
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    default: []
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  indexes: [
    { key: { author_id: 1 } },
    { key: { status: 1 } }
  ]
});

const PostModel = mongoose.model('Posts', postSchema, 'posts');
module.exports = PostModel;