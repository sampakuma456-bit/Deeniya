const express = require('express');
const router = express.Router();
const { Company, Category, RouteModel, Donor, Expense, Bank, Location, Department } = require('../models/Master');

// --- Company Master Routes ---
router.get('/company', async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/company', async (req, res) => {
  try {
    const newCompany = new Company(req.body);
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/company/:id', async (req, res) => {
  try {
    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/company/:id', async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Category Master Routes ---
router.get('/category', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/category', async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/category/:id', async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/category/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Route Master Routes ---
router.get('/route', async (req, res) => {
  try {
    const routes = await RouteModel.find();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/route', async (req, res) => {
  try {
    const newRoute = new RouteModel(req.body);
    await newRoute.save();
    res.status(201).json(newRoute);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const generateDonorCode = async (routeId = '', routeName = '') => {
  const route = routeId ? await RouteModel.findById(routeId).catch(() => null) : null;
  const selectedRouteName = routeName || route?.name || '';
  const prefix = `D${selectedRouteName?.trim()?.charAt(0)?.toUpperCase() || 'X'}`;
  
  const conditions = [];
  if (routeId) {
    conditions.push({ routeId });
  }
  if (selectedRouteName) {
    conditions.push({ route: { $regex: new RegExp('^' + selectedRouteName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } });
  }
  
  const query = conditions.length > 0 ? { $or: conditions } : {};
  const donors = await Donor.find(query);
  const existingNumbers = donors
    .map(donor => donor.donorCode)
    .filter(code => typeof code === 'string' && code.startsWith(prefix))
    .map(code => parseInt(code.slice(prefix.length), 10))
    .filter(num => !isNaN(num));
  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  return `${prefix}${String(maxNumber + 1).padStart(3, '0')}`;
};

router.put('/route/:id', async (req, res) => {
  try {
    const updated = await RouteModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/route/:id', async (req, res) => {
  try {
    await RouteModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Donor Master Routes ---
router.get('/donor/template', (req, res) => {
  const headers = 'DonorCode,Name,Address,Email,Phone,WhatsApp,Route,Category1_Name,Category1_Amount,Category2_Name,Category2_Amount,Category3_Name,Category3_Amount\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Donor_Master_Template.csv"');
  res.send(headers);
});

router.post('/donor/upload', async (req, res) => {
  try {
    const { donors } = req.body;
    if (!Array.isArray(donors) || donors.length === 0) {
      return res.status(400).json({ error: 'No donor data provided.' });
    }
    const results = { success: 0, errors: [] };
    for (let i = 0; i < donors.length; i++) {
      const row = donors[i];
      try {
        const donorData = {};
        if (row.DonorCode && row.DonorCode.trim()) {
          donorData.donorCode = row.DonorCode.trim();
        }
        if (!row.Name || !row.Name.trim()) {
          results.errors.push({ row: i + 1, error: 'Name is required.' });
          continue;
        }
        donorData.name = row.Name.trim();
        donorData.address = row.Address?.trim() || '';
        donorData.email = row.Email?.trim() || '';
        donorData.phone = row.Phone?.trim() || '';
        donorData.whatsapp = row.Whatsapp?.trim() || '';
        donorData.route = row.Route?.trim() || '';
        donorData.status = 'Active';

        const categories = [];
        for (let ci = 1; ci <= 3; ci++) {
          const catName = row[`Category${ci}_Name`]?.trim();
          const catAmount = row[`Category${ci}_Amount`]?.trim();
          if (catName) {
            categories.push({ name: catName, amount: catAmount || '0' });
          }
        }
        if (categories.length > 0) {
          donorData.categories = categories;
        }

        if (!donorData.donorCode) {
          donorData.donorCode = await generateDonorCode('', donorData.route);
        }
        const newDonor = new Donor(donorData);
        await newDonor.save();
        results.success++;
      } catch (err) {
        const msg = err.code === 11000 ? `Duplicate donor code '${row.DonorCode || '(empty)'}'` : (err.message || 'Save failed');
        results.errors.push({ row: i + 1, error: msg });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/donor', async (req, res) => {
  try {
    const donors = await Donor.find();
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/donor', async (req, res) => {
  try {
    const donorData = { ...req.body };
    if (!donorData.donorCode || !donorData.donorCode.trim()) {
      donorData.donorCode = await generateDonorCode(donorData.routeId, donorData.route);
    }
    let newDonor;
    try {
      newDonor = new Donor(donorData);
      await newDonor.save();
    } catch (saveErr) {
      if (saveErr.code === 11000 && saveErr.keyPattern?.donorCode) {
        donorData.donorCode = await generateDonorCode(donorData.routeId, donorData.route);
        newDonor = new Donor(donorData);
        await newDonor.save();
      } else {
        throw saveErr;
      }
    }
    res.status(201).json(newDonor);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Unable to save donor.' });
  }
});

router.put('/donor/:id', async (req, res) => {
  try {
    const updated = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/donor/:id', async (req, res) => {
  try {
    await Donor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Donor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Expense Master Routes ---
router.get('/expense', async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expense', async (req, res) => {
  try {
    const newExpense = new Expense(req.body);
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/expense/:id', async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/expense/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Bank Master Routes ---
router.get('/bank', async (req, res) => {
  try {
    const banks = await Bank.find();
    res.json(banks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bank', async (req, res) => {
  try {
    const newBank = new Bank(req.body);
    await newBank.save();
    res.status(201).json(newBank);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/bank/:id', async (req, res) => {
  try {
    const updated = await Bank.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/bank/:id', async (req, res) => {
  try {
    await Bank.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bank deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Location Master Routes ---
router.get('/location', async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/location', async (req, res) => {
  try {
    const newLocation = new Location(req.body);
    await newLocation.save();
    res.status(201).json(newLocation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/location/:id', async (req, res) => {
  try {
    const updated = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/location/:id', async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Department Master Routes ---
router.get('/department', async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/department', async (req, res) => {
  try {
    const newDepartment = new Department(req.body);
    await newDepartment.save();
    res.status(201).json(newDepartment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/department/:id', async (req, res) => {
  try {
    const updated = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/department/:id', async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
