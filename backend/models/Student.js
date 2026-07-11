const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  course: { type: String, required: true },
  fee: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
