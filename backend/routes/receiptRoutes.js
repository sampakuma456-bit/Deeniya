const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');

// Get all receipts
router.get('/', async (req, res) => {
  try {
    const receipts = await Receipt.find().sort({ createdAt: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new receipt
router.post('/', async (req, res) => {
  try {
    const newReceipt = new Receipt(req.body);
    const savedReceipt = await newReceipt.save();
    res.status(201).json(savedReceipt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a receipt
router.put('/:id', async (req, res) => {
  try {
    const updatedReceipt = await Receipt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedReceipt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a receipt
router.delete('/:id', async (req, res) => {
  try {
    await Receipt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Receipt deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
