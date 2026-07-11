const express = require('express');
const router = express.Router();
const GeneralReceipt = require('../models/GeneralReceipt');
const GeneralPayment = require('../models/GeneralPayment');
const DonorReceipt = require('../models/Receipt');
const { SupplierPayment, Till } = require('../models/Inventory');

function parseNum(val) {
  return parseFloat(String(val).replace(/,/g, '')) || 0;
}

function formatNum(val) {
  const n = parseFloat(val) || 0;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

router.get('/daybook', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date is required' });

    // Opening balance = all receipts before this date - all payments before this date
    const prevGeneralReceipts = await GeneralReceipt.find({ date: { $lt: date } });
    const prevPayments = await GeneralPayment.find({ date: { $lt: date } });
    const queryDate = new Date(date + 'T00:00:00.000Z');
    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const prevSupplierPayments = await SupplierPayment.find({ date: { $lt: date } });
    const prevTillCollections = await Till.find({ status: 'Collected', collectedDate: { $lt: date } });

    let openingBalance = 0;
    prevGeneralReceipts.forEach(r => { openingBalance += parseNum(r.amount); });
    prevPayments.forEach(p => { openingBalance -= parseNum(p.amount); });
    prevSupplierPayments.forEach(p => { openingBalance -= parseNum(p.amount); });
    prevTillCollections.forEach(t => { openingBalance += parseNum(t.amount); });

    const allDonorReceipts = await DonorReceipt.find({}).lean();
    const prevDonorReceipts = allDonorReceipts.filter(r => {
      if (!r.createdAt) return false;
      const d = new Date(r.createdAt);
      return d < queryDate;
    });
    const donorReceipts = allDonorReceipts.filter(r => {
      if (!r.createdAt) return false;
      const d = new Date(r.createdAt);
      return d >= queryDate && d < nextDate;
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    prevDonorReceipts.forEach(r => {
      if (r.category === 'Till Collection') return;
      openingBalance += parseNum(r.totalAmount);
    });

    const generalReceipts = await GeneralReceipt.find({ date }).sort({ createdAt: 1 });
    const payments = await GeneralPayment.find({ date }).sort({ createdAt: 1 });
    const supplierPayments = await SupplierPayment.find({ date }).sort({ createdAt: 1 });
    const tillCollections = await Till.find({ status: 'Collected', collectedDate: date }).sort({ createdAt: 1 });

    const entries = [];
    generalReceipts.forEach(r => {
      entries.push({
        type: 'receipt',
        number: r.receiptNumber,
        accountId: r.accountId,
        accountName: r.accountName,
        description: r.description || `Receipt - ${r.accountName}`,
        dr: '',
        cr: formatNum(r.amount),
        rawDr: 0,
        rawCr: parseNum(r.amount),
        sortTime: r.createdAt
      });
    });
    payments.forEach(p => {
      entries.push({
        type: 'payment',
        number: p.paymentNumber,
        accountId: p.accountId,
        accountName: p.accountName,
        description: p.description || `Payment - ${p.accountName}`,
        dr: formatNum(p.amount),
        cr: '',
        rawDr: parseNum(p.amount),
        rawCr: 0,
        sortTime: p.createdAt
      });
    });
    donorReceipts.forEach(r => {
      if (r.category === 'Till Collection') return;
      entries.push({
        type: 'donor-receipt',
        number: r.receiptNumber,
        accountId: r.donorId,
        accountName: r.donorName,
        description: `Donor Receipt – ${r.donorName} (${r.category})`,
        dr: '',
        cr: formatNum(parseNum(r.totalAmount)),
        rawDr: 0,
        rawCr: parseNum(r.totalAmount),
        sortTime: r.createdAt
      });
    });
    supplierPayments.forEach(p => {
      entries.push({
        type: 'supplier-payment',
        number: p.paymentNumber,
        accountId: p.supplierName,
        accountName: p.supplierName,
        description: `Supplier Payment – ${p.supplierName}${p.invoiceNumber ? ` (Inv: ${p.invoiceNumber})` : ''}`,
        dr: formatNum(p.amount),
        cr: '',
        rawDr: parseNum(p.amount),
        rawCr: 0,
        sortTime: p.createdAt
      });
    });
    tillCollections.forEach(t => {
      entries.push({
        type: 'till-collection',
        number: t.receiptNumber,
        accountId: t.tillNumber,
        accountName: t.donorName,
        description: `Till Collection – ${t.donorName}`,
        dr: '',
        cr: formatNum(parseNum(t.amount)),
        rawDr: 0,
        rawCr: parseNum(t.amount),
        sortTime: t.createdAt
      });
    });

    entries.sort((a, b) => new Date(a.sortTime) - new Date(b.sortTime));

    const totalDr = entries.reduce((s, e) => s + e.rawDr, 0);
    const totalCr = entries.reduce((s, e) => s + e.rawCr, 0);
    const closingBalance = openingBalance + totalCr - totalDr;

    res.json({
      date,
      openingBalance: formatNum(openingBalance),
      openingBalanceRaw: openingBalance,
      closingBalance: formatNum(closingBalance),
      closingBalanceRaw: closingBalance,
      entries,
      totalDr: formatNum(totalDr),
      totalCr: formatNum(totalCr)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
