const mongoose = require('mongoose');

const generalReceiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  accountId: { type: String, required: true },
  accountName: { type: String, required: true },
  description: { type: String, default: '' },
  paymentMode: { type: String, default: 'Cash' },
  amount: { type: String, required: true },
  chequeNumber: { type: String },
  chequeDate: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('GeneralReceipt', generalReceiptSchema);
