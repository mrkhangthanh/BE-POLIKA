const mongoose = require('../../common/init.myDB')();

const technicianSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
  },
  specialization: {
    type: [String],
    required: true,
  },
  availability: {
    type: String,
    enum: ['available', 'busy'],
    default: 'available',
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

const TechnicianModel = mongoose.model('Technicians', technicianSchema, 'technicians');
module.exports = TechnicianModel;