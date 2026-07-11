const express = require('express');
const router = express.Router();
const ExamResult = require('../models/ExamResult');

router.get('/', async (req, res) => {
  try {
    const results = await ExamResult.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { studentId, studentName, subject, marks, totalMarks, examType, date } = req.body;
    if (!studentName || !subject || marks === undefined) {
      return res.status(400).json({ error: 'Student name, subject, and marks are required' });
    }
    const result = new ExamResult({ studentId, studentName, subject, marks, totalMarks, examType, date });
    await result.save();
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await ExamResult.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!result) return res.status(404).json({ error: 'Exam result not found' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await ExamResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Exam result not found' });
    res.json({ message: 'Exam result deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
