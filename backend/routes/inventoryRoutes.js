const express = require('express');
const router = express.Router();
const { Supplier, Item, PurchaseInvoice, GoodsIssueNote, SupplierPayment, Till } = require('../models/Inventory');
const Receipt = require('../models/Receipt');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateUniqueItemCode = async (name) => {
  const basePrefix = String(name || 'ITEM').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6) || 'ITEM';
  let candidate = basePrefix;
  let counter = 1;
  while (await Item.exists({ code: candidate })) {
    candidate = `${basePrefix}${counter}`;
    counter += 1;
  }
  return candidate;
};

const ensureItemRecord = async (line, location) => {
  const requestedName = String(line?.itemName || '').trim();
  if (!requestedName) return null;

  const existingByName = await Item.findOne({ name: { $regex: new RegExp('^' + escapeRegex(requestedName) + '$', 'i') } });
  if (existingByName) return existingByName;

  const code = await generateUniqueItemCode(requestedName);
  try {
    const newItem = new Item({ code, name: requestedName, unit: 'Pcs', category: '', location: location || '', currentStock: 0, reorderLevel: 0 });
    await newItem.save();
    return newItem;
  } catch (err) {
    if (err.code !== 11000) throw err;
    const existing = await Item.findOne({ name: { $regex: new RegExp('^' + escapeRegex(requestedName) + '$', 'i') } });
    if (existing) return existing;
    const freshCode = await generateUniqueItemCode(requestedName);
    const retryItem = new Item({ code: freshCode, name: requestedName, unit: 'Pcs', category: '', location: location || '', currentStock: 0, reorderLevel: 0 });
    await retryItem.save();
    return retryItem;
  }
};

// =========== SUPPLIER ===========
// GET all suppliers
router.get('/supplier', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single supplier by name (for auto-fill)
router.get('/supplier/byname/:name', async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ name: { $regex: new RegExp('^' + escapeRegex(req.params.name.trim()) + '$', 'i') } });
    res.json(supplier || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create supplier (or find existing – no duplicates)
router.post('/supplier', async (req, res) => {
  try {
    const { name, address, telephone, email, status } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Supplier name is required.' });
    // Check for duplicate
    const existing = await Supplier.findOne({ name: { $regex: new RegExp('^' + escapeRegex(name.trim()) + '$', 'i') } });
    if (existing) return res.status(409).json({ error: 'Supplier already exists.', supplier: existing });
    const newSupplier = new Supplier({ name: name.trim(), address, telephone, email, status });
    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update supplier
router.put('/supplier/:id', async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE supplier
router.delete('/supplier/:id', async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supplier deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =========== ITEM MASTER ===========
// GET all items
router.get('/item', async (req, res) => {
  try {
    const items = await Item.find().sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create item
router.post('/item', async (req, res) => {
  try {
    const { code, name, unit, category, currentStock, reorderLevel } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Item name is required.' });
    const trimmedName = name.trim();
    const trimmedCode = String(code || '').trim();
    const existingByName = await Item.findOne({ name: { $regex: new RegExp('^' + escapeRegex(trimmedName) + '$', 'i') } });
    if (existingByName) return res.status(409).json({ error: 'Item name already exists.' });
    let finalCode = trimmedCode;
    if (!finalCode) {
      const basePrefix = trimmedName.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6) || 'ITEM';
      let candidate = basePrefix;
      let counter = 1;
      while (await Item.exists({ code: candidate })) {
        candidate = `${basePrefix}${counter}`;
        counter += 1;
      }
      finalCode = candidate;
    }
    const newItem = new Item({ code: finalCode, name: trimmedName, unit, category, currentStock: currentStock || 0, reorderLevel: reorderLevel || 0 });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update item
router.put('/item/:id', async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE item
router.delete('/item/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =========== PURCHASE INVOICE ===========
// GET all purchase invoices
router.get('/purchase', async (req, res) => {
  try {
    const invoices = await PurchaseInvoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create purchase invoice & update stock
router.post('/purchase', async (req, res) => {
  try {
    const { invoiceNumber, date, supplierName, supplierAddress, supplierTelephone, location, items, invoiceTotal, discount, totalAmount } = req.body;
    const normalizedInvoiceNumber = String(invoiceNumber || '').trim();
    const normalizedSupplierName = String(supplierName || '').trim();
    const normalizedDate = String(date || '').trim() || new Date().toISOString().slice(0, 10);

    if (!normalizedInvoiceNumber) return res.status(400).json({ error: 'Invoice number is required.' });
    if (!normalizedSupplierName) return res.status(400).json({ error: 'Supplier name is required.' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'At least one item is required.' });

    const dupCheck = await PurchaseInvoice.findOne({ invoiceNumber: normalizedInvoiceNumber });
    if (dupCheck) return res.status(409).json({ error: 'Invoice number already exists.' });

    // Auto-save supplier if not existing
    const existingSupplier = await Supplier.findOne({ name: { $regex: new RegExp('^' + escapeRegex(normalizedSupplierName) + '$', 'i') } });
    if (!existingSupplier) {
      await new Supplier({ name: normalizedSupplierName, address: supplierAddress || '', telephone: supplierTelephone || '' }).save();
    }

    const purchaseLocation = String(location || '').trim();
    const normalizedItems = [];
    for (const line of items) {
      const ensuredItem = await ensureItemRecord(line, purchaseLocation);
      if (!ensuredItem) continue;
      const normalizedItemName = String(ensuredItem?.name || line?.itemName || '').trim();
      normalizedItems.push({
        itemName: normalizedItemName,
        qty: Number(line.qty) || 0,
        rate: Number(line.rate) || 0,
        amount: Number(line.amount) || (Number(line.qty) || 0) * (Number(line.rate) || 0)
      });
    }

    if (normalizedItems.length === 0) return res.status(400).json({ error: 'At least one valid item is required.' });

    const invoice = new PurchaseInvoice({ invoiceNumber: normalizedInvoiceNumber, date: normalizedDate, supplierName: normalizedSupplierName, supplierAddress, supplierTelephone, location: purchaseLocation, items: normalizedItems, invoiceTotal, discount, totalAmount });
    await invoice.save();

    // Update item stock quantities & assign location if missing
    for (const line of normalizedItems) {
      const itemName = String(line.itemName || '').trim();
      if (!itemName) continue;
      await Item.findOneAndUpdate(
        { name: { $regex: new RegExp('^' + escapeRegex(itemName) + '$', 'i') } },
        { $inc: { currentStock: Number(line.qty) } }
      );
      if (purchaseLocation) {
        await Item.updateOne(
          { name: { $regex: new RegExp('^' + escapeRegex(itemName) + '$', 'i') }, location: { $in: ['', null, undefined] } },
          { $set: { location: purchaseLocation } }
        );
      }
    }

    res.status(201).json(invoice);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE purchase invoice & reverse stock
router.delete('/purchase/:id', async (req, res) => {
  try {
    const invoice = await PurchaseInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    // Reverse stock
    for (const line of invoice.items) {
      const itemName = String(line.itemName || '').trim();
      if (!itemName) continue;
      await Item.findOneAndUpdate(
        { name: { $regex: new RegExp('^' + escapeRegex(itemName) + '$', 'i') } },
        { $inc: { currentStock: -Number(line.qty) } }
      );
    }
    await PurchaseInvoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted and stock reversed.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =========== GOODS ISSUE NOTE ===========
// GET all GINs
router.get('/gin', async (req, res) => {
  try {
    const gins = await GoodsIssueNote.find().sort({ createdAt: -1 });
    res.json(gins);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create GIN & deduct stock
router.post('/gin', async (req, res) => {
  try {
    const { ginNumber, date, issuedTo, department, items, remarks } = req.body;
    if (!ginNumber || !ginNumber.trim()) return res.status(400).json({ error: 'GIN number is required.' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'At least one item is required.' });

    const dupCheck = await GoodsIssueNote.findOne({ ginNumber: ginNumber.trim() });
    if (dupCheck) return res.status(409).json({ error: 'GIN number already exists.' });

    // Check stock availability
    for (const line of items) {
      const itemName = String(line?.itemName || '').trim();
      if (!itemName) continue;
      const item = await Item.findOne({ name: { $regex: new RegExp('^' + escapeRegex(itemName) + '$', 'i') } });
      if (item && item.currentStock < Number(line.qty)) {
        return res.status(400).json({ error: `Insufficient stock for item: ${line.itemName}. Available: ${item.currentStock}` });
      }
    }

    const gin = new GoodsIssueNote({ ginNumber: ginNumber.trim(), date, issuedTo, department, items, remarks });
    await gin.save();

    // Deduct stock
    for (const line of items) {
      const itemName = String(line?.itemName || '').trim();
      if (!itemName) continue;
      await Item.findOneAndUpdate(
        { name: { $regex: new RegExp('^' + escapeRegex(itemName) + '$', 'i') } },
        { $inc: { currentStock: -Number(line.qty) } }
      );
    }

    res.status(201).json(gin);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE GIN & restore stock
router.delete('/gin/:id', async (req, res) => {
  try {
    const gin = await GoodsIssueNote.findById(req.params.id);
    if (!gin) return res.status(404).json({ error: 'GIN not found.' });
    // Restore stock
    for (const line of gin.items) {
      const itemName = String(line?.itemName || '').trim();
      if (!itemName) continue;
      await Item.findOneAndUpdate(
        { name: { $regex: new RegExp('^' + escapeRegex(itemName) + '$', 'i') } },
        { $inc: { currentStock: Number(line.qty) } }
      );
    }
    await GoodsIssueNote.findByIdAndDelete(req.params.id);
    res.json({ message: 'GIN deleted and stock restored.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =========== SUPPLIER PAYMENT ===========
// GET all payments
router.get('/payment', async (req, res) => {
  try {
    const payments = await SupplierPayment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create payment
router.post('/payment', async (req, res) => {
  try {
    const { paymentNumber, date, supplierName, invoiceNumber, amount, paymentMode, chequeNumber, bankName, remarks } = req.body;
    if (!paymentNumber || !paymentNumber.trim()) return res.status(400).json({ error: 'Payment number is required.' });
    if (!supplierName || !supplierName.trim()) return res.status(400).json({ error: 'Supplier name is required.' });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Valid amount is required.' });

    const dupCheck = await SupplierPayment.findOne({ paymentNumber: paymentNumber.trim() });
    if (dupCheck) return res.status(409).json({ error: 'Payment number already exists.' });

    // If linked to an invoice, validate and update outstanding balance
    const invNumber = String(invoiceNumber || '').trim();
    if (invNumber) {
      const invoice = await PurchaseInvoice.findOne({ invoiceNumber: invNumber });
      if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
      const newPaid = (invoice.paidAmount || 0) + Number(amount);
      if (newPaid > invoice.totalAmount) {
        return res.status(400).json({ error: `Payment exceeds outstanding balance. Outstanding: LKR ${(invoice.totalAmount - (invoice.paidAmount || 0)).toLocaleString()}` });
      }
      await PurchaseInvoice.findOneAndUpdate({ invoiceNumber: invNumber }, { paidAmount: newPaid });
    }

    const payment = new SupplierPayment({
      paymentNumber: paymentNumber.trim(),
      date: String(date || '').trim() || new Date().toISOString().slice(0, 10),
      supplierName: supplierName.trim(),
      invoiceNumber: invNumber,
      amount: Number(amount),
      paymentMode: paymentMode || 'Cash',
      chequeNumber: paymentMode === 'Cheque' ? String(chequeNumber || '').trim() : '',
      bankName: paymentMode === 'Cheque' ? String(bankName || '').trim() : '',
      remarks: String(remarks || '').trim()
    });
    await payment.save();
    res.status(201).json(payment);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update payment
router.put('/payment/:id', async (req, res) => {
  try {
    const existing = await SupplierPayment.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Payment not found.' });
    // Reverse old paid amount
    if (existing.invoiceNumber) {
      const oldInvoice = await PurchaseInvoice.findOne({ invoiceNumber: existing.invoiceNumber });
      if (oldInvoice) {
        const oldNewPaid = Math.max(0, (oldInvoice.paidAmount || 0) - existing.amount);
        await PurchaseInvoice.findOneAndUpdate({ invoiceNumber: existing.invoiceNumber }, { paidAmount: oldNewPaid });
      }
    }
    // Apply new paid amount
    const invNumber = String(req.body.invoiceNumber || '').trim();
    if (invNumber) {
      const invoice = await PurchaseInvoice.findOne({ invoiceNumber: invNumber });
      if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
      const newPaid = (invoice.paidAmount || 0) + Number(req.body.amount || 0);
      if (newPaid > invoice.totalAmount) {
        return res.status(400).json({ error: `Payment exceeds outstanding balance. Outstanding: LKR ${(invoice.totalAmount - (invoice.paidAmount || 0)).toLocaleString()}` });
      }
      await PurchaseInvoice.findOneAndUpdate({ invoiceNumber: invNumber }, { paidAmount: newPaid });
    }
    const updated = await SupplierPayment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE payment
router.delete('/payment/:id', async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    // Reverse paid amount on linked invoice
    if (payment.invoiceNumber) {
      const invoice = await PurchaseInvoice.findOne({ invoiceNumber: payment.invoiceNumber });
      if (invoice) {
        const newPaid = Math.max(0, (invoice.paidAmount || 0) - payment.amount);
        await PurchaseInvoice.findOneAndUpdate({ invoiceNumber: payment.invoiceNumber }, { paidAmount: newPaid });
      }
    }
    await SupplierPayment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted and outstanding balance restored.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST recalculate paid amounts for all invoices from existing payments
router.post('/payment/recalculate', async (req, res) => {
  try {
    const payments = await SupplierPayment.find({ invoiceNumber: { $ne: '' } });
    const invoicePaidMap = {};
    for (const pay of payments) {
      const invNo = pay.invoiceNumber;
      if (!invNo) continue;
      invoicePaidMap[invNo] = (invoicePaidMap[invNo] || 0) + pay.amount;
    }
    let updated = 0;
    for (const [invNo, paid] of Object.entries(invoicePaidMap)) {
      await PurchaseInvoice.findOneAndUpdate({ invoiceNumber: invNo }, { paidAmount: paid });
      updated++;
    }
    res.json({ message: `Recalculated paidAmount for ${updated} invoices from ${Object.keys(invoicePaidMap).length} payments.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =========== SUPPLIER STATEMENT ===========
router.get('/supplier-statement', async (req, res) => {
  try {
    const { supplierName, fromDate, toDate } = req.query;
    if (!supplierName || !fromDate || !toDate) {
      return res.status(400).json({ error: 'supplierName, fromDate, and toDate are required' });
    }
    const supName = supplierName.trim();
    const nameRegex = new RegExp('^' + escapeRegex(supName) + '$', 'i');

    // Opening balance: purchases and payments before fromDate
    const prevPurchases = await PurchaseInvoice.find({ supplierName: { $regex: nameRegex }, date: { $lt: fromDate } });
    const prevPayments = await SupplierPayment.find({ supplierName: { $regex: nameRegex }, date: { $lt: fromDate } });

    let openingBalance = 0;
    prevPurchases.forEach(p => { openingBalance += (p.totalAmount || 0) - (p.paidAmount || 0); });
    prevPayments.forEach(p => { openingBalance -= p.amount; });

    // Transactions within date range
    const purchases = await PurchaseInvoice.find({ supplierName: { $regex: nameRegex }, date: { $gte: fromDate, $lte: toDate } }).sort({ date: 1, createdAt: 1 });
    const payments = await SupplierPayment.find({ supplierName: { $regex: nameRegex }, date: { $gte: fromDate, $lte: toDate } }).sort({ date: 1, createdAt: 1 });

    const entries = [];

    // Opening balance row
    if (openingBalance !== 0) {
      entries.push({
        date: fromDate,
        type: 'opening',
        number: '-',
        description: 'Opening Balance',
        dr: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        cr: openingBalance > 0 ? openingBalance : 0,
        rawDr: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        rawCr: openingBalance > 0 ? openingBalance : 0,
        sortDate: fromDate,
        sortOrder: 0
      });
    }

    purchases.forEach(p => {
      const amount = p.totalAmount || 0;
      entries.push({
        date: p.date,
        type: 'purchase',
        number: p.invoiceNumber,
        description: `Purchase - ${p.supplierName}`,
        dr: 0,
        cr: amount,
        rawDr: 0,
        rawCr: amount,
        sortDate: p.date,
        sortOrder: 1
      });
    });

    payments.forEach(p => {
      entries.push({
        date: p.date,
        type: 'payment',
        number: p.paymentNumber,
        description: `Payment - ${p.supplierName}${p.invoiceNumber ? ` (Inv: ${p.invoiceNumber})` : ''}`,
        dr: p.amount,
        cr: 0,
        rawDr: p.amount,
        rawCr: 0,
        sortDate: p.date,
        sortOrder: 2
      });
    });

    entries.sort((a, b) => {
      if (a.sortDate !== b.sortDate) return a.sortDate.localeCompare(b.sortDate);
      return a.sortOrder - b.sortOrder;
    });

    let runningBalance = openingBalance;
    entries.forEach(e => {
      runningBalance += e.rawCr - e.rawDr;
      e.runningBalance = runningBalance;
      e.runningBalanceLabel = runningBalance >= 0 ? `LKR ${runningBalance.toLocaleString()} Cr` : `LKR ${Math.abs(runningBalance).toLocaleString()} Dr`;
    });

    const totalDr = entries.reduce((s, e) => s + e.rawDr, 0);
    const totalCr = entries.reduce((s, e) => s + e.rawCr, 0);

    res.json({
      supplierName: supName,
      fromDate,
      toDate,
      openingBalance,
      openingBalanceLabel: openingBalance >= 0 ? `LKR ${openingBalance.toLocaleString()} Cr` : `LKR ${Math.abs(openingBalance).toLocaleString()} Dr`,
      closingBalance: runningBalance,
      closingBalanceLabel: runningBalance >= 0 ? `LKR ${runningBalance.toLocaleString()} Cr` : `LKR ${Math.abs(runningBalance).toLocaleString()} Dr`,
      entries,
      totalDr,
      totalCr,
      totalDrLabel: totalDr.toLocaleString(),
      totalCrLabel: totalCr.toLocaleString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========== TILL ===========
router.get('/till', async (req, res) => {
  try {
    const tills = await Till.find().sort({ createdAt: -1 });
    res.json(tills);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/till', async (req, res) => {
  try {
    const { tillNumber, issueDate, donorName, donorId, itemName, itemQty } = req.body;
    if (!tillNumber || !tillNumber.trim()) return res.status(400).json({ error: 'Till number is required.' });
    if (!donorName || !donorName.trim()) return res.status(400).json({ error: 'Donor name is required.' });
    const dup = await Till.findOne({ tillNumber: tillNumber.trim() });
    if (dup) return res.status(409).json({ error: 'Till number already exists.' });
    const till = new Till({
      tillNumber: tillNumber.trim(),
      issueDate: String(issueDate || '').trim() || new Date().toISOString().slice(0, 10),
      donorName: donorName.trim(),
      donorId: String(donorId || '').trim(),
      itemName: String(itemName || '').trim(),
      itemQty: Math.max(0, Number(itemQty) || 0),
      status: 'Issued'
    });
    await till.save();
    res.status(201).json(till);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/till/:id', async (req, res) => {
  try {
    const { receiptNumber, amount, collectedDate } = req.body;
    const existing = await Till.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Till not found.' });
    if (existing.status === 'Collected') return res.status(400).json({ error: 'Till already collected.' });
    if (!receiptNumber || !receiptNumber.trim()) return res.status(400).json({ error: 'Receipt number is required.' });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Valid amount is required.' });
    const collectedDateStr = String(collectedDate || '').trim() || new Date().toISOString().slice(0, 10);
    const updated = await Till.findByIdAndUpdate(req.params.id, {
      receiptNumber: receiptNumber.trim(),
      amount: Number(amount),
      collectedDate: collectedDateStr,
      status: 'Collected'
    }, { new: true });

    // Create a Donor Receipt entry for the till collection
    const receipt = new Receipt({
      receiptNumber: receiptNumber.trim(),
      donorId: existing.donorId || `TILL-${existing.tillNumber}`,
      donorName: existing.donorName,
      route: '',
      category: 'Till Collection',
      totalAmount: String(Number(amount)),
      balanceAmount: '0',
      paymentMode: 'Cash'
    });
    await receipt.save();

    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/till/:id', async (req, res) => {
  try {
    await Till.findByIdAndDelete(req.params.id);
    res.json({ message: 'Till deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
