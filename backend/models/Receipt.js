const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  donorId: { type: String, required: true },
  donorName: { type: String, required: true },
  route: { type: String },
  address: { type: String },
  category: { type: String, required: true },
  totalAmount: { type: String, required: true },
  balanceAmount: { type: String },
  paymentMode: { type: String, default: 'Cash' },
  chequeNumber: { type: String },
  bankName: { type: String },
  chequeDate: { type: String },
  deposited: { type: Boolean, default: false },
  depositDate: { type: String, default: '' },
  depositAccount: { type: String, default: '' },
  returnReason: { type: String, default: '' },
  returnDate: { type: String, default: '' },
  receiptDate: { type: String, default: '' },
  settledMonth: { type: String, default: '' }
}, { timestamps: true });

const Receipt = mongoose.model('Receipt', receiptSchema);

module.exports = Receipt;
