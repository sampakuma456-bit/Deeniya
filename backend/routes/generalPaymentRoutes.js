const express = require('express');
const router = express.Router();
const GeneralPayment = require('../models/GeneralPayment');

router.get('/', async (req, res) => {
  try {
    const payments = await GeneralPayment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/next-number', async (req, res) => {
  try {
    const last = await GeneralPayment.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (last && last.paymentNumber) {
      const match = last.paymentNumber.match(/GP-(\d+)/i);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    res.json({ nextNumber: `GP-${String(nextNum).padStart(3, '0')}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newPayment = new GeneralPayment(req.body);
    const savedPayment = await newPayment.save();
    res.status(201).json(savedPayment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await GeneralPayment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await GeneralPayment.findByIdAndDelete(req.params.id);
    res.json({ message: 'General payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
