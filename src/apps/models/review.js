const mongoose = require('../../common/init.myDB')();

const reviewSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customers',
    required: true,
  },
  type: {
    type: String,
    enum: ['technician', 'product'],
    required: true,
  },
  target_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'type', // Tham chiếu động đến Technician hoặc Product
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const ReviewModel = mongoose.model('Reviews', reviewSchema, 'reviews');
module.exports = ReviewModel;