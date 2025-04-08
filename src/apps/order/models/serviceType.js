const mongoose = require('../../../common/init.myDB')();

const serviceTypeSchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  label: { type: String, required: true },
});

module.exports = mongoose.model('ServiceType', serviceTypeSchema);