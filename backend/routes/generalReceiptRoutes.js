const express = require('express');
const router = express.Router();
const GeneralReceipt = require('../models/GeneralReceipt');

// Get all general receipts
router.get('/', async (req, res) => {
  try {
    const receipts = await GeneralReceipt.find().sort({ createdAt: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get next receipt number
router.get('/next-number', async (req, res) => {
  try {
    const last = await GeneralReceipt.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (last && last.receiptNumber) {
      const match = last.receiptNumber.match(/GR-(\d+)/i);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    res.json({ nextNumber: `GR-${String(nextNum).padStart(3, '0')}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new general receipt
router.post('/', async (req, res) => {
  try {
    const newReceipt = new GeneralReceipt(req.body);
    const savedReceipt = await newReceipt.save();
    res.status(201).json(savedReceipt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a general receipt
router.put('/:id', async (req, res) => {
  try {
    const updated = await GeneralReceipt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a general receipt
router.delete('/:id', async (req, res) => {
  try {
    await GeneralReceipt.findByIdAndDelete(req.params.id);
    res.json({ message: 'General receipt deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
