const express = require('express');
const router = express.Router();
const GeneralReceipt = require('../models/GeneralReceipt');
const GeneralPayment = require('../models/GeneralPayment');

function formatNum(val) {
  const n = parseFloat(String(val).replace(/,/g, '')) || 0;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseNum(val) {
  return parseFloat(String(val).replace(/,/g, '')) || 0;
}

router.get('/statement', async (req, res) => {
  try {
    const { accountId, fromDate, toDate } = req.query;
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    const andConditions = [{ accountId }];
    if (fromDate && toDate) {
      andConditions.push({ date: { $gte: fromDate, $lte: toDate } });
    } else if (fromDate) {
      andConditions.push({ date: { $gte: fromDate } });
    } else if (toDate) {
      andConditions.push({ date: { $lte: toDate } });
    }

    const receipts = await GeneralReceipt.find({ $and: andConditions }).sort({ date: 1, createdAt: 1 });
    const payments = await GeneralPayment.find({ $and: andConditions }).sort({ date: 1, createdAt: 1 });

    const allBefore = await GeneralReceipt.find({
      accountId,
      ...(fromDate ? { date: { $lt: fromDate } } : {})
    });
    const allPayBefore = await GeneralPayment.find({
      accountId,
      ...(fromDate ? { date: { $lt: fromDate } } : {})
    });

    let openingBalance = 0;
    allBefore.forEach(r => { openingBalance += parseNum(r.amount); });
    allPayBefore.forEach(p => { openingBalance -= parseNum(p.amount); });

    const transactions = [];
    receipts.forEach(r => {
      transactions.push({
        date: r.date,
        number: r.receiptNumber,
        description: r.description || `Receipt - ${r.accountName}`,
        drAmount: '',
        crAmount: formatNum(r.amount),
        rawCr: parseNum(r.amount),
        rawDr: 0,
        type: 'receipt',
        _id: r._id
      });
    });
    payments.forEach(p => {
      transactions.push({
        date: p.date,
        number: p.paymentNumber,
        description: p.description || `Payment - ${p.accountName}`,
        drAmount: formatNum(p.amount),
        crAmount: '',
        rawDr: parseNum(p.amount),
        rawCr: 0,
        type: 'payment',
        _id: p._id
      });
    });

    transactions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return 0;
    });

    let balance = openingBalance;
    const rows = transactions.map(t => {
      balance += t.rawCr - t.rawDr;
      t.runningBalance = formatNum(balance);
      t.rawBalance = balance;
      return t;
    });

    const totalDr = transactions.reduce((s, t) => s + t.rawDr, 0);
    const totalCr = transactions.reduce((s, t) => s + t.rawCr, 0);
    const closingBalance = openingBalance + totalCr - totalDr;

    res.json({
      accountId,
      openingBalance: formatNum(openingBalance),
      closingBalance: formatNum(closingBalance),
      rawOpeningBalance: openingBalance,
      rawClosingBalance: closingBalance,
      totalDr: formatNum(totalDr),
      totalCr: formatNum(totalCr),
      rawTotalDr: totalDr,
      rawTotalCr: totalCr,
      transactions: rows,
      fromDate: fromDate || '',
      toDate: toDate || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
