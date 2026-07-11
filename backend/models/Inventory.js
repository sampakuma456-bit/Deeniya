const mongoose = require('mongoose');

// --- Supplier Master ---
const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  address: { type: String, default: '' },
  telephone: { type: String, default: '' },
  email: { type: String, default: '' },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

// --- Item Master ---
const itemSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  unit: { type: String, default: 'Pcs' },
  category: { type: String, default: '' },
  location: { type: String, default: '' },
  currentStock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 }
}, { timestamps: true });

// --- Purchase Invoice ---
const purchaseLineSchema = new mongoose.Schema({
  // itemCode: { type: String, trim: true, default: '' },
  itemName: { type: String, required: true, trim: true },
  qty: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true }
}, { _id: false });

const purchaseInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true, trim: true },
  date: { type: String, required: true },
  supplierName: { type: String, required: true },
  supplierAddress: { type: String, default: '' },
  supplierTelephone: { type: String, default: '' },
  location: { type: String, default: '' },
  items: [purchaseLineSchema],
  invoiceTotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 }
}, { timestamps: true });

// --- Goods Issue Note ---
const ginLineSchema = new mongoose.Schema({
  // itemCode: { type: String, required: true },
  itemName: { type: String, required: true },
  qty: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'Pcs' },
  remarks: { type: String, default: '' }
}, { _id: false });

const goodsIssueNoteSchema = new mongoose.Schema({
  ginNumber: { type: String, required: true, unique: true, trim: true },
  date: { type: String, required: true },
  issuedTo: { type: String, default: '' },
  department: { type: String, default: '' },
  items: [ginLineSchema],
  remarks: { type: String, default: '' }
}, { timestamps: true });

// --- Supplier Payment ---
const supplierPaymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, required: true, unique: true, trim: true },
  date: { type: String, required: true },
  supplierName: { type: String, required: true },
  invoiceNumber: { type: String, default: '' },
  amount: { type: Number, required: true, min: 0 },
  paymentMode: { type: String, default: 'Cash' },
  chequeNumber: { type: String, default: '' },
  bankName: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

// --- Till ---
const tillSchema = new mongoose.Schema({
  tillNumber: { type: String, required: true, unique: true, trim: true },
  issueDate: { type: String, required: true },
  donorName: { type: String, required: true, trim: true },
  donorId: { type: String, default: '' },
  receiptNumber: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  itemName: { type: String, default: '' },
  itemQty: { type: Number, default: 0 },
  collectedDate: { type: String, default: '' },
  status: { type: String, enum: ['Issued', 'Collected'], default: 'Issued' }
}, { timestamps: true });

const Till = mongoose.model('Till', tillSchema);

const Supplier = mongoose.model('Supplier', supplierSchema);
const Item = mongoose.model('Item', itemSchema);
const PurchaseInvoice = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);
const GoodsIssueNote = mongoose.model('GoodsIssueNote', goodsIssueNoteSchema);
const SupplierPayment = mongoose.model('SupplierPayment', supplierPaymentSchema);

module.exports = { Supplier, Item, PurchaseInvoice, GoodsIssueNote, SupplierPayment, Till };
