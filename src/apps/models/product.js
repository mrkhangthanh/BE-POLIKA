const mongoose = require('../../common/init.myDB')();

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discount_price: {
    type: Number,
    min: 0,
  },
  stock_quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categories',
    required: true,
  },
  image_url: {
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

const ProductModel = mongoose.model('Products', productSchema, 'products');
module.exports = ProductModel;