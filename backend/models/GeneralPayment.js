const mongoose = require('mongoose');

const generalPaymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  accountId: { type: String, required: true },
  accountName: { type: String, required: true },
  description: { type: String, default: '' },
  depositType: { type: String, default: 'Normal' },
  depositedReceiptId: { type: String, default: '' },
  paymentMode: { type: String, default: 'Cash' },
  amount: { type: String, required: true },
  chequeNumber: { type: String },
  chequeDate: { type: String },
  bankName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('GeneralPayment', generalPaymentSchema);
