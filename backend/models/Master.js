const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: String,
  regNo: String,
  address: String,
  email: String,
  phone: String,
  whatsapp: String
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  desc: String,
  target: String
}, { timestamps: true });

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  areas: String,
  status: String
}, { timestamps: true });

const donorSchema = new mongoose.Schema({
  donorCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: String,
  email: String,
  routeId: String,
  route: String,
  categories: [{
    name: String,
    amount: String
  }],
  phone: String,
  whatsapp: String,
  monthlyContribution: String,
  status: { type: String, default: 'Active' },
  category: { type: String, default: 'General' }
}, { timestamps: true });

const expenseSchema = new mongoose.Schema({
  code: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Expenses', 'Staff', 'Others'], default: 'Expenses' }
}, { timestamps: true });

const bankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branch: String,
  accNo: String,
  status: { type: String, default: 'Linked' }
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
const Category = mongoose.model('Category', categorySchema);
const RouteModel = mongoose.model('Route', routeSchema);
const Donor = mongoose.model('Donor', donorSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, default: 'Active' }
}, { timestamps: true });

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: String,
  status: { type: String, default: 'Active' }
}, { timestamps: true });

const Bank = mongoose.model('Bank', bankSchema);
const Location = mongoose.model('Location', locationSchema);
const Department = mongoose.model('Department', departmentSchema);

module.exports = { Company, Category, RouteModel, Donor, Expense, Bank, Location, Department };
