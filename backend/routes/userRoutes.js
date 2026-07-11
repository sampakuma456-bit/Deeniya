const express = require('express');
const router = express.Router();
const User = require('../models/User');

const ACTIONS = ['view', 'create', 'edit', 'delete'];
const MODULES_AND_ACTIONS = {
  dashboard: ['view'],
  'master-supplier': ['view', 'edit', 'delete'],
  'master-item': ['view', 'edit', 'delete'],
  'master-donor': ['view', 'edit', 'delete'],
  'master-expenses': ['view', 'edit', 'delete'],
  'master-category': ['view', 'edit', 'delete'],
  'master-route': ['view', 'edit', 'delete'],
  'master-location': ['view', 'edit', 'delete'],
  'master-bank': ['view', 'edit', 'delete'],
  'master-company': ['view', 'edit', 'delete'],
  'transaction-donor-receipt': ['view', 'create', 'edit', 'delete'],
  'transaction-general-receipt': ['view', 'create', 'edit', 'delete'],
  'transaction-general-payment': ['view', 'create', 'edit', 'delete'],
  'transaction-general-journal': ['view', 'create', 'edit', 'delete'],
  'inventory-purchase': ['view', 'create', 'edit', 'delete'],
  'inventory-gin': ['view', 'create', 'edit', 'delete'],
  'inventory-payment': ['view', 'create', 'edit', 'delete'],
  'inventory-till': ['view', 'create', 'edit', 'delete'],
  'report-day-book': ['view'],
  'report-statement': ['view'],
  'report-donor-receipt-tx': ['view'],
  'report-general-receipt-tx': ['view'],
  'report-general-payment-tx': ['view'],
  'report-journal-tx': ['view'],
  'report-shop-outstanding': ['view'],
  'report-item-report': ['view'],
  'report-item-stock': ['view'],
  'report-till-report': ['view'],
  'report-income-statement': ['view'],
  'report-p-and-l': ['view'],
  'report-whatsapp': ['view'],
  'report-pd-cheque': ['view'],
  'report-all-statement': ['view'],
  'report-route-wise': ['view'],
  'report-category-wise': ['view'],
  'report-donor-statement': ['view'],
  'report-user-activity': ['view'],
  'report-user-log': ['view'],
  'user-management': ['view', 'create', 'edit', 'delete'],
  settings: ['view', 'edit']
};

function makeAllPermissions() {
  const result = [];
  for (const [mod, actions] of Object.entries(MODULES_AND_ACTIONS)) {
    for (const action of actions) {
      result.push(`${mod}:${action}`);
    }
  }
  return result;
}

const ALL_PERMISSIONS = makeAllPermissions();

function normalizePermissions(perms) {
  if (!perms) return [];
  if (Array.isArray(perms)) {
    if (perms.length === 1 && perms[0] === 'All Privileges') return [...ALL_PERMISSIONS];
    return perms;
  }
  if (typeof perms === 'string') {
    if (perms === 'All Privileges') return [...ALL_PERMISSIONS];
    return [];
  }
  return [];
}

router.get('/', async (req, res) => {
  try {
    let users = await User.find().sort({ createdAt: -1 });
    users = users.map(u => {
      const obj = u.toObject();
      obj.permissions = normalizePermissions(obj.permissions);
      delete obj.password;
      return obj;
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    const user = new User({ name, email, password, phone, role, permissions });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password && updates.password.trim() === '') {
      delete updates.password;
    }
    if (updates.email) {
      updates.email = updates.email.toLowerCase();
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    Object.assign(user, updates);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    res.json({ exists: !!user, user: user || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
