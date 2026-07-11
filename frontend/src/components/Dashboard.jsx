import React, { useState, useEffect, useRef } from 'react';
import StatementReport from './reports/StatementReport';
import DayBook from './reports/DayBook';
import ShopOutstandingReport from './reports/ShopOutstandingReport';
import ItemReport from './reports/ItemReport';
import ItemStockReport from './reports/ItemStockReport';
import TillReport from './reports/TillReport';
import SupplierStatement from './reports/SupplierStatement';
import DonorReceiptReport from './reports/DonorReceiptReport';
import GeneralReceiptReport from './reports/GeneralReceiptReport';
import GeneralPaymentReport from './reports/GeneralPaymentReport';
import JournalReport from './reports/JournalReport';

import ReportExportButtons from './reports/ReportExportButtons';
import DonorReceiptPrint from './DonorReceiptPrint';
import UserManager from './UserManager';

const numberToWords = (num) => {
  if (num === 0) return 'Zero Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const format = (n) => {
    if (n < 20) return a[n];
    let digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + format(n % 100));
    if (n < 1000000) return format(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 === 0 ? '' : format(n % 1000));
    if (n < 1000000000) return format(Math.floor(n / 1000000)) + 'Million ' + (n % 1000000 === 0 ? '' : format(n % 1000000));
    return '';
  };
  return format(num).trim() + ' Only';
};

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDark, setIsDark] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Collapsed by default (icons only)
  const [masterSearch, setMasterSearch] = useState('');
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // --- Company Master State ---
  const [companies, setCompanies] = useState([]);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: '', code: '', regNo: '', address: '', email: '', phone: '', whatsapp: ''
  });

  const handleCompanyChange = (e) => setCompanyForm({ ...companyForm, [e.target.name]: e.target.value });

  const cleanPayload = (form) => {
    const { _id, __v, createdAt, updatedAt, ...payload } = form;
    return payload;
  };

  const validateCompanyForm = () => {
    if (!companyForm.name || !companyForm.name.trim()) {
      throw new Error('Please enter the company name.');
    }
    return true;
  };

  const handleSaveCompany = async () => {
    try {
      validateCompanyForm();
      const payload = cleanPayload(companyForm);
      if (editingCompanyId) {
        const res = await fetch(`http://localhost:5000/api/master/company/${editingCompanyId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to update company.');
        setCompanies(companies.map(c => c._id === editingCompanyId ? result : c));
      } else {
        const res = await fetch('http://localhost:5000/api/master/company', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to save company.');
        setCompanies([...companies, result]);
      }
      closeCompanyModal();
    } catch (err) {
      console.error('Company save error:', err.message);
      alert('Error: ' + err.message);
    }
  };

  const handleEditCompany = (company) => {
    setCompanyForm({
      name: company.name || '',
      code: company.code || '',
      regNo: company.regNo || '',
      address: company.address || '',
      email: company.email || '',
      phone: company.phone || '',
      whatsapp: company.whatsapp || ''
    });
    setEditingCompanyId(company._id);
    setIsCompanyModalOpen(true);
  };

  const handleDeleteCompany = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await fetch(`http://localhost:5000/api/master/company/${id}`, { method: 'DELETE' });
        setCompanies(companies.filter(c => c._id !== id));
      } catch (err) { console.error(err); }
    }
  };

  const openAddCompanyModal = () => {
    setCompanyForm({ name: '', code: '', regNo: '', address: '', email: '', phone: '', whatsapp: '' });
    setEditingCompanyId(null);
    setIsCompanyModalOpen(true);
  };

  const closeCompanyModal = () => {
    setIsCompanyModalOpen(false);
    setCompanyForm({ name: '', code: '', regNo: '', address: '', email: '', phone: '', whatsapp: '' });
    setEditingCompanyId(null);
  };

  // --- Category Master State ---
  const [categories, setCategories] = useState([]);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'General', desc: '', target: '' });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleCategoryChange = (e) => setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value });
  const openAddCategoryModal = () => { setCategoryForm({ name: '', type: 'General', desc: '', target: '' }); setEditingCategoryId(null); setIsCategoryModalOpen(true); };
  const closeCategoryModal = () => { setIsCategoryModalOpen(false); setCategoryForm({ name: '', type: 'General', desc: '', target: '' }); setEditingCategoryId(null); };

  const validateCategoryForm = () => {
    if (!categoryForm.name || !categoryForm.name.trim()) {
      throw new Error('Please enter the category name.');
    }
    return true;
  };

  const handleSaveCategory = async () => {
    try {
      validateCategoryForm();
      const payload = cleanPayload(categoryForm);
      if (editingCategoryId) {
        const res = await fetch(`http://localhost:5000/api/master/category/${editingCategoryId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to update category.');
        setCategories(categories.map(c => c._id === editingCategoryId ? result : c));
      } else {
        const res = await fetch('http://localhost:5000/api/master/category', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to save category.');
        setCategories([...categories, result]);
      }
      closeCategoryModal();
    } catch (err) { console.error('Category save error:', err.message); alert('Error: ' + err.message); }
  };
  const handleEditCategory = (cat) => { setCategoryForm({ name: cat.name || '', type: cat.type || 'General', desc: cat.desc || '', target: cat.target || '' }); setEditingCategoryId(cat._id); setIsCategoryModalOpen(true); };
  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await fetch(`http://localhost:5000/api/master/category/${id}`, { method: 'DELETE' });
        setCategories(categories.filter(c => c._id !== id));
      } catch (err) { console.error(err); }
    }
  };

  // --- Route Master State ---
  const [routes, setRoutes] = useState([]);
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [routeForm, setRouteForm] = useState({ name: '', areas: '', status: 'Active' });
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

  const handleRouteChange = (e) => setRouteForm({ ...routeForm, [e.target.name]: e.target.value });
  const openAddRouteModal = () => { setRouteForm({ name: '', areas: '', status: 'Active' }); setEditingRouteId(null); setIsRouteModalOpen(true); };
  const closeRouteModal = () => { setIsRouteModalOpen(false); setRouteForm({ name: '', areas: '', status: 'Active' }); setEditingRouteId(null); };

  const validateRouteForm = () => {
    if (!routeForm.name || !routeForm.name.trim()) {
      throw new Error('Please enter the route name.');
    }
    return true;
  };

  const handleSaveRoute = async () => {
    try {
      validateRouteForm();
      const payload = cleanPayload(routeForm);
      if (editingRouteId) {
        const res = await fetch(`http://localhost:5000/api/master/route/${editingRouteId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to update route.');
        setRoutes(routes.map(r => r._id === editingRouteId ? result : r));
      } else {
        const res = await fetch('http://localhost:5000/api/master/route', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to save route.');
        setRoutes([...routes, result]);
      }
      closeRouteModal();
    } catch (err) { console.error('Route save error:', err.message); alert('Error: ' + err.message); }
  };
  const handleEditRoute = (route) => { setRouteForm({ name: route.name || '', areas: route.areas || '', status: route.status || 'Active' }); setEditingRouteId(route._id); setIsRouteModalOpen(true); };
  const handleDeleteRoute = async (id) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await fetch(`http://localhost:5000/api/master/route/${id}`, { method: 'DELETE' });
        setRoutes(routes.filter(r => r._id !== id));
      } catch (err) { console.error(err); }
    }
  };
  // -----------------------------
  // --- Donor Master State ---
  const [donors, setDonors] = useState([]);
  const [editingDonorId, setEditingDonorId] = useState(null);
  const [donorForm, setDonorForm] = useState({
    donorCode: '',
    name: '',
    address: '',
    email: '',
    routeId: '',
    route: '',
    categories: [
      { name: '', amount: '' },
      { name: '', amount: '' },
      { name: '', amount: '' }
    ],
    phone: '',
    whatsapp: '',
    status: 'Active'
  });
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [donorUploadModalOpen, setDonorUploadModalOpen] = useState(false);
  const [donorUploadData, setDonorUploadData] = useState([]);
  const [donorUploadResult, setDonorUploadResult] = useState(null);
  const [donorUploadLoading, setDonorUploadLoading] = useState(false);
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [donorFilterRoute, setDonorFilterRoute] = useState('');
  const [donorFilterCategory, setDonorFilterCategory] = useState('');
  // --- Donor Report State ---
  const [donorReportSubTab, setDonorReportSubTab] = useState('all-statement');
  const [drFilterSearch, setDrFilterSearch] = useState('');
  const [drFilterRoute, setDrFilterRoute] = useState('');
  const [drFilterCategory, setDrFilterCategory] = useState('');
  const [drFilterStatus, setDrFilterStatus] = useState('');
  const [drFilterYear, setDrFilterYear] = useState('');
  // All Donor Statement filter-first state
  const [asFilterCategory, setAsFilterCategory] = useState('');
  const [asFilterYear, setAsFilterYear] = useState(String(new Date().getFullYear()));
  const [asReportReady, setAsReportReady] = useState(false);
  // Donor Statement filter-first state
  const [dsFilterFromDate, setDsFilterFromDate] = useState(`${new Date().getFullYear()}-01-01`);
  const [dsFilterToDate, setDsFilterToDate] = useState(`${new Date().getFullYear()}-12-31`);
  const [dsFilterSearch, setDsFilterSearch] = useState('');
  const [dsFilterCategory, setDsFilterCategory] = useState('');
  const [dsReportReady, setDsReportReady] = useState(false);
  // Route-wise Donor Report filter-first state
  const [rwFilterRoute, setRwFilterRoute] = useState('');
  const [rwFilterCategory, setRwFilterCategory] = useState('');
  const [rwFilterYear, setRwFilterYear] = useState(String(new Date().getFullYear()));
  const [rwReportReady, setRwReportReady] = useState(false);

  const [generalReportSubTab, setGeneralReportSubTab] = useState('day-book');
  const [purchaseReportSubTab, setPurchaseReportSubTab] = useState('shop-outstanding');
  const [accountReportSubTab, setAccountReportSubTab] = useState('income-statement');
  const [pdReceivedDateFrom, setPdReceivedDateFrom] = useState('');
  const [pdReceivedDateTo, setPdReceivedDateTo] = useState('');
  const [pdDepositDateFrom, setPdDepositDateFrom] = useState('');
  const [pdDepositDateTo, setPdDepositDateTo] = useState('');
  const [pdDonorSearch, setPdDonorSearch] = useState('');
  const [pdChequeSearch, setPdChequeSearch] = useState('');
  const [pdReturnModal, setPdReturnModal] = useState(null);
  const [pdReturnForm, setPdReturnForm] = useState({ returnReason: '', returnDate: '' });
  const [logReportSubTab, setLogReportSubTab] = useState('user-activity');

  // --- Transaction Dashboard State ---
  const [transactionView, setTransactionView] = useState('dashboard');
  const [donorReceiptForm, setDonorReceiptForm] = useState({
    donorId: '',
    donorName: '',
    route: '',
    address: '',
    category: '',
    receiptNumber: '',
    totalAmount: '',
    paymentMode: 'Cash',
    chequeNumber: '',
    chequeDate: '',
    receiptDate: new Date().toISOString().slice(0, 10)
  });
  const [selectedDonorForReceipt, setSelectedDonorForReceipt] = useState(null);
  const [donorReceiptRecords, setDonorReceiptRecords] = useState([]);
  const [donorReceiptModalOpen, setDonorReceiptModalOpen] = useState(false);
  const [currentReceiptPreview, setCurrentReceiptPreview] = useState(null);
  const [donorReceiptSearch, setDonorReceiptSearch] = useState('');
  const [donorReceiptDropdownOpen, setDonorReceiptDropdownOpen] = useState(false);
  const [donorReceiptHighlightIndex, setDonorReceiptHighlightIndex] = useState(-1);
  const donorReceiptDropdownRef = useRef(null);
  const [outstandingSummaryYear, setOutstandingSummaryYear] = useState(String(new Date().getFullYear()));
  const [generalReceiptRecords, setGeneralReceiptRecords] = useState([]);
  const [generalReceiptForm, setGeneralReceiptForm] = useState({
    receiptNumber: '',
    date: new Date().toISOString().slice(0, 10),
    accountId: '',
    accountName: '',
    description: '',
    paymentMode: 'Cash',
    amount: '',
    chequeNumber: '',
    chequeDate: ''
  });
  const [grAccountSearch, setGrAccountSearch] = useState('');
  const [grAccountDropdownOpen, setGrAccountDropdownOpen] = useState(false);
  const [grAccountHighlightIndex, setGrAccountHighlightIndex] = useState(-1);
  const grAccountDropdownRef = useRef(null);

  const resetGeneralReceiptForm = () => {
    const nums = generalReceiptRecords.map(r => {
      const m = String(r.receiptNumber || '').match(/GR-(\d+)/i);
      return m ? parseInt(m[1], 10) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    setGeneralReceiptForm({
      receiptNumber: `GR-${String(max + 1).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      accountId: '',
      accountName: '',
      description: '',
      paymentMode: 'Cash',
      amount: '',
      chequeNumber: '',
      chequeDate: ''
    });
    setGrAccountSearch('');
    setGrAccountDropdownOpen(false);
    setGrAccountHighlightIndex(-1);
  };

  // --- General Payment State ---
  const [generalPaymentRecords, setGeneralPaymentRecords] = useState([]);
  const [generalPaymentForm, setGeneralPaymentForm] = useState({
    paymentNumber: '',
    date: new Date().toISOString().slice(0, 10),
    accountId: '',
    accountName: '',
    description: '',
    depositType: 'Normal',
    depositedReceiptId: '',
    paymentMode: 'Cash',
    amount: '',
    chequeNumber: '',
    chequeDate: '',
    bankName: ''
  });
  const [gpAccountSearch, setGpAccountSearch] = useState('');
  const [gpAccountDropdownOpen, setGpAccountDropdownOpen] = useState(false);
  const [gpAccountHighlightIndex, setGpAccountHighlightIndex] = useState(-1);
  const gpAccountDropdownRef = useRef(null);

  const resetGeneralPaymentForm = () => {
    const nums = generalPaymentRecords.map(r => {
      const m = String(r.paymentNumber || '').match(/GP-(\d+)/i);
      return m ? parseInt(m[1], 10) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    setGeneralPaymentForm({
      paymentNumber: `GP-${String(max + 1).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      accountId: '',
      accountName: '',
      description: '',
      depositType: 'Normal',
      depositedReceiptId: '',
      paymentMode: 'Cash',
      amount: '',
      chequeNumber: '',
      chequeDate: '',
      bankName: ''
    });
    setGpAccountSearch('');
    setGpAccountDropdownOpen(false);
    setGpAccountHighlightIndex(-1);
  };

  const resetDonorReceiptForm = () => {
    setDonorReceiptForm({
      donorId: '',
      donorName: '',
      route: '',
      address: '',
      category: '',
      receiptNumber: '',
      totalAmount: '',
      paymentMode: 'Cash',
      chequeNumber: '',
      chequeDate: '',
      receiptDate: new Date().toISOString().slice(0, 10)
    });
    setSelectedDonorForReceipt(null);
    setDonorReceiptSearch('');
    setDonorReceiptDropdownOpen(false);
    setDonorReceiptHighlightIndex(-1);
  };

  const buildMonthlyAllocationRows = (receivedAmount, monthlyDue, count = 12, pastPaidAmount = 0) => {
    const currentYear = new Date().getFullYear();
    if (monthlyDue <= 0) {
      return Array.from({ length: count }, (_, index) => {
        const monthDate = new Date(currentYear, index, 1);
        return {
          month: monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
          due: 0,
          received: 0,
          balance: 0
        };
      });
    }

    const rows = Array.from({ length: count }, (_, index) => {
      const monthDate = new Date(currentYear, index, 1);
      return {
        month: monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        due: monthlyDue,
        received: 0,
        balance: monthlyDue
      };
    });

    let pastRemaining = Number(pastPaidAmount) || 0;
    for (const row of rows) {
      if (pastRemaining <= 0) break;
      const pastAllocated = Math.min(row.due, pastRemaining);
      row.received += pastAllocated;
      row.balance -= pastAllocated;
      pastRemaining -= pastAllocated;
    }

    let currentRemaining = Number(receivedAmount) || 0;
    for (const row of rows) {
      if (currentRemaining <= 0) break;
      if (row.balance > 0) {
        const currentAllocated = Math.min(row.balance, currentRemaining);
        row.received += currentAllocated;
        row.balance -= currentAllocated;
        currentRemaining -= currentAllocated;
      }
    }

    return rows;
  };

  const getDonorReceiptOutstandingRows = () => {
    const monthlyDue = Number(
      selectedDonorForReceipt?.categories?.find((cat) => cat?.name === donorReceiptForm.category)?.amount ||
      selectedDonorForReceipt?.monthlyContribution ||
      0
    );

    const pastPaidAmount = donorReceiptRecords
      .filter((r) => {
        const rDonorId = String(r.donorId).trim().toLowerCase();
        const sId = String(selectedDonorForReceipt?._id || '').trim().toLowerCase();
        const sCode = String(selectedDonorForReceipt?.donorCode || '').trim().toLowerCase();
        return (rDonorId === sId || rDonorId === sCode) && r.category === donorReceiptForm.category;
      })
      .reduce((sum, r) => sum + (Number((r.totalAmount || '0').replace(/,/g, '')) || 0), 0);

    const currentAmount = Number(donorReceiptForm.totalAmount) || 0;
    const endYear = Number(outstandingSummaryYear) || new Date().getFullYear();
    const startYear = 2026;
    const allMonthRows = [];
    for (let y = startYear; y <= endYear; y++) {
      getStatementMonths(y).forEach((month) => {
        allMonthRows.push({ month, due: monthlyDue, received: 0, balance: monthlyDue });
      });
    }

    if (monthlyDue <= 0) {
      const selectedYearSuffix = String(endYear).slice(-2);
      return allMonthRows
        .filter((row) => row.month.endsWith(`-${selectedYearSuffix}`))
        .map((row) => ({ ...row, due: 0, balance: 0 }));
    }

    let pastRemaining = pastPaidAmount;
    for (const row of allMonthRows) {
      if (pastRemaining <= 0) break;
      const pastAllocated = Math.min(row.due, pastRemaining);
      row.received += pastAllocated;
      row.balance -= pastAllocated;
      pastRemaining -= pastAllocated;
    }

    let currentRemaining = currentAmount;
    for (const row of allMonthRows) {
      if (currentRemaining <= 0) break;
      if (row.balance > 0) {
        const currentAllocated = Math.min(row.balance, currentRemaining);
        row.received += currentAllocated;
        row.balance -= currentAllocated;
        currentRemaining -= currentAllocated;
      }
    }

    const selectedYearSuffix = String(endYear).slice(-2);
    return allMonthRows.filter((row) => row.month.endsWith(`-${selectedYearSuffix}`));
  };

  const getReceiptAllocationRows = (receipt) => {
    const donor = donors.find((donorItem) =>
      donorItem.donorCode?.toLowerCase() === receipt.donorId?.toLowerCase() || donorItem._id === receipt.donorId
    );
    const monthlyDue = Number(
      donor?.categories?.find((cat) => cat?.name === receipt.category)?.amount || donor?.monthlyContribution || 0
    );
    const receivedAmount = Number(receipt.totalAmount?.toString().replace(/,/g, '')) || 0;
    return buildMonthlyAllocationRows(receivedAmount, monthlyDue, 6);
  };

  const handleDonorReceiptChange = (e) => {
    const { name, value } = e.target;

    if (name === 'donorId') {
      const donorMatch = donors.find((donor) => donor.donorCode?.toLowerCase() === value.trim().toLowerCase() || donor._id === value.trim());
      if (donorMatch) {
        const firstCategory = donorMatch.categories?.find((cat) => cat?.name)?.name || '';
        setSelectedDonorForReceipt(donorMatch);
        setDonorReceiptForm((prev) => ({
          ...prev,
          donorId: value,
          donorName: donorMatch.name || '',
          route: donorMatch.route || '',
          address: donorMatch.address || '',
          category: firstCategory
        }));
      } else {
        setSelectedDonorForReceipt(null);
        setDonorReceiptForm((prev) => ({ ...prev, donorId: value, donorName: '', route: '', address: '', category: '' }));
      }
      return;
    }

    setDonorReceiptForm((prev) => ({ ...prev, [name]: value }));
  };

  const donorReceiptCategoryOptions = selectedDonorForReceipt?.categories?.map((cat) => cat?.name).filter(Boolean) || categories.map((cat) => cat.name).filter(Boolean);

  const handleSaveDonorReceipt = async () => {
    if (!donorReceiptForm.donorId || !donorReceiptForm.donorName) {
      alert('Please enter a valid donor ID to continue.');
      return;
    }
    if (!donorReceiptForm.category) {
      alert('Please select a category for this donor receipt.');
      return;
    }
    if (!donorReceiptForm.receiptNumber) {
      alert('Please enter a receipt number.');
      return;
    }
    const isDuplicate = donorReceiptRecords.some((r) => r.receiptNumber.trim().toLowerCase() === donorReceiptForm.receiptNumber.trim().toLowerCase());
    if (isDuplicate) {
      alert('Duplicate receipt number detected. Please enter a unique receipt number.');
      return;
    }
    if (!donorReceiptForm.totalAmount || Number.isNaN(Number(donorReceiptForm.totalAmount))) {
      alert('Please enter a valid total received amount.');
      return;
    }
    if (donorReceiptForm.paymentMode === 'Cheque' && (!donorReceiptForm.chequeNumber || !donorReceiptForm.chequeDate)) {
      alert('Please complete the cheque details before saving.');
      return;
    }

    const baseAmount = Number(
      selectedDonorForReceipt?.categories?.find((cat) => cat?.name === donorReceiptForm.category)?.amount ||
      selectedDonorForReceipt?.monthlyContribution ||
      0
    );
    const pastPaidAmount = donorReceiptRecords
      .filter((r) => {
        const rDonorId = String(r.donorId).trim().toLowerCase();
        const sId = String(selectedDonorForReceipt?._id || '').trim().toLowerCase();
        const sCode = String(selectedDonorForReceipt?.donorCode || '').trim().toLowerCase();
        return (rDonorId === sId || rDonorId === sCode) && r.category === donorReceiptForm.category;
      })
      .reduce((sum, r) => sum + (Number((r.totalAmount || '0').replace(/,/g, '')) || 0), 0);

    const paidAmount = Number(donorReceiptForm.totalAmount) || 0;
    const totalDue = baseAmount * 12;
    const balanceAmount = totalDue > (pastPaidAmount + paidAmount) ? totalDue - (pastPaidAmount + paidAmount) : 0;

    // Calculate FIFO settled month — first month the current payment settles
    let settledMonth = '';
    if (paidAmount > 0) {
      const due = baseAmount > 0 ? baseAmount : paidAmount;
      const endYear = Number(outstandingSummaryYear) || new Date().getFullYear();
      let remaining = pastPaidAmount;
      for (let y = 2026; y <= endYear; y++) {
        const months = getStatementMonths(y);
        for (const month of months) {
          if (remaining <= 0) {
            settledMonth = month;
            break;
          }
          if (remaining < due) {
            // Past payments partially cover this month — current payment starts here
            settledMonth = month;
            break;
          }
          remaining -= due;
        }
        if (settledMonth) break;
      }
    }

    const payload = {
      donorId: donorReceiptForm.donorId,
      donorName: donorReceiptForm.donorName,
      route: donorReceiptForm.route,
      address: donorReceiptForm.address,
      category: donorReceiptForm.category,
      receiptNumber: donorReceiptForm.receiptNumber,
      totalAmount: paidAmount.toLocaleString(),
      balanceAmount: balanceAmount.toLocaleString(),
      paymentMode: donorReceiptForm.paymentMode,
      chequeNumber: donorReceiptForm.chequeNumber,
      chequeDate: donorReceiptForm.chequeDate,
      receiptDate: donorReceiptForm.receiptDate,
      settledMonth
    };

    try {
      const res = await fetch('http://localhost:5000/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const savedReceipt = await res.json();
      if (!res.ok) throw new Error(savedReceipt.error || 'Unable to save receipt.');

      setDonorReceiptRecords((prev) => [savedReceipt, ...prev]);
      resetDonorReceiptForm();
      setCurrentReceiptPreview(savedReceipt);
      setDonorReceiptModalOpen(true);
    } catch (err) {
      alert('Error saving receipt: ' + err.message);
    }
  };

  const handlePrintDonorReceipt = () => {
    if (!currentReceiptPreview) return;
    window.print();
  };

  const handleSendWhatsAppReceipt = (receipt = currentReceiptPreview) => {
    const message = `Assalamualaikum ${receipt?.donorName || 'Dear donor'}. Your donor receipt ${receipt?.receiptNumber || 'N/A'} for LKR ${receipt?.totalAmount || '0'} has been recorded successfully. Thank you.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const generateDonorCode = (routeId = '', routeName = '') => {
    const selectedRouteName = routeName || (routeId ? routes.find(route => route._id === routeId)?.name : '');
    const prefix = `D${selectedRouteName?.trim()?.charAt(0)?.toUpperCase() || 'X'}`;
    const existingNumbers = donors
      .filter(donor => donor._id !== editingDonorId)
      .filter(donor => {
        const matchesRouteId = routeId && donor.routeId === routeId;
        const matchesRouteName = selectedRouteName && donor.route?.trim()?.toLowerCase() === selectedRouteName?.trim()?.toLowerCase();
        return matchesRouteId || matchesRouteName;
      })
      .map(donor => donor.donorCode)
      .filter(code => typeof code === 'string' && code.startsWith(prefix))
      .map(code => parseInt(code.slice(prefix.length), 10))
      .filter(num => !isNaN(num));
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `${prefix}${String(maxNumber + 1).padStart(3, '0')}`;
  };

  const normalizeCategoryRows = (categories = []) => {
    return categories.map(cat => {
      if (typeof cat === 'string') {
        return { name: cat, amount: '' };
      }
      return {
        name: cat?.name || cat?.category || '',
        amount: cat?.amount || cat?.monthlyContribution || ''
      };
    }).slice(0, 3);
  };

  const updateDonorCategory = (index, field, value) => {
    setDonorForm(prev => {
      const categories = [...prev.categories];
      categories[index] = { ...categories[index], [field]: value };
      return { ...prev, categories };
    });
  };

  const handleDonorChange = (e) => {
    const { name, value } = e.target;
    setDonorForm(prev => {
      const nextForm = { ...prev, [name]: value };
      if (name === 'routeId') {
        const selectedRoute = routes.find(route => route._id === value);
        nextForm.route = selectedRoute?.name || '';
        nextForm.donorCode = generateDonorCode(value, selectedRoute?.name);
      }
      return nextForm;
    });
  };
  const emptyCategoryRows = [
    { name: '', amount: '' },
    { name: '', amount: '' },
    { name: '', amount: '' }
  ];

  const openAddDonorModal = () => { setDonorForm({ donorCode: '', name: '', address: '', email: '', routeId: '', route: '', categories: emptyCategoryRows, phone: '', whatsapp: '', status: 'Active' }); setEditingDonorId(null); setIsDonorModalOpen(true); };
  const closeDonorModal = () => { setIsDonorModalOpen(false); setDonorForm({ donorCode: '', name: '', address: '', email: '', routeId: '', route: '', categories: emptyCategoryRows, phone: '', whatsapp: '', status: 'Active' }); setEditingDonorId(null); };

  const validateDonorForm = () => {
    if (!donorForm.donorCode || !donorForm.donorCode.trim()) {
      throw new Error('Please enter the donor code.');
    }
    if (!donorForm.name || !donorForm.name.trim()) {
      throw new Error('Please enter the donor name.');
    }
    if (!donorForm.routeId || !donorForm.routeId.trim()) {
      throw new Error('Please select a route.');
    }
    const selectedCategories = donorForm.categories.filter(cat => cat.name && cat.name.trim());
    if (selectedCategories.length === 0) {
      throw new Error('Please select at least one donor category.');
    }
    const missingAmount = selectedCategories.some(cat => !cat.amount || !cat.amount.trim());
    if (missingAmount) {
      throw new Error('Please enter the monthly amount for each selected category.');
    }
    return true;
  };

  const handleSaveDonor = async () => {
    try {
      validateDonorForm();
      const selectedCategories = donorForm.categories
        .map(cat => ({ name: cat.name?.trim() || '', amount: cat.amount?.trim() || '' }))
        .filter(cat => cat.name !== '');
      const totalContribution = selectedCategories.reduce((sum, cat) => {
        const amount = parseFloat(cat.amount.replace(/,/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      const selectedRoute = routes.find(route => route._id === donorForm.routeId);
      const payload = cleanPayload({
        ...donorForm,
        route: selectedRoute?.name || donorForm.route,
        categories: selectedCategories,
        monthlyContribution: totalContribution > 0 ? String(totalContribution) : ''
      });
      if (editingDonorId) {
        const res = await fetch(`http://localhost:5000/api/master/donor/${editingDonorId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to update donor.');
        setDonors(donors.map(d => d._id === editingDonorId ? result : d));
      } else {
        const res = await fetch('http://localhost:5000/api/master/donor', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to save donor.');
        setDonors([...donors, result]);
      }
      closeDonorModal();
    } catch (err) { console.error('Donor save error:', err.message); alert('Error: ' + err.message); }
  };
  const handleEditDonor = (donor) => {
    const routeId = donor.routeId || routes.find(route => route.name === donor.route)?._id || '';
    const loadedCategories = normalizeCategoryRows(donor.categories || (donor.category ? [{ name: donor.category, amount: donor.monthlyContribution || '' }] : []));
    const categories = [
      loadedCategories[0] || { name: '', amount: '' },
      loadedCategories[1] || { name: '', amount: '' },
      loadedCategories[2] || { name: '', amount: '' }
    ];
    setDonorForm({
      donorCode: donor.donorCode || generateDonorCode(routeId, donor.route || routes.find(route => route._id === routeId)?.name || ''),
      name: donor.name || '',
      address: donor.address || '',
      email: donor.email || '',
      routeId,
      route: donor.route || '',
      categories,
      phone: donor.phone || '',
      whatsapp: donor.whatsapp || '',
      status: donor.status || 'Active'
    });
    setEditingDonorId(donor._id);
    setIsDonorModalOpen(true);
  };
  const handleDeleteDonor = async (id) => {
    if (window.confirm('Are you sure you want to delete this donor?')) {
      try {
        await fetch(`http://localhost:5000/api/master/donor/${id}`, { method: 'DELETE' });
        setDonors(donors.filter(d => d._id !== id));
      } catch (err) { console.error(err); }
    }
  };

  // Filter donors based on search term, route, and category
  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donorSearchTerm === '' ||
      donor.donorCode?.toLowerCase().includes(donorSearchTerm.toLowerCase()) ||
      donor.name?.toLowerCase().includes(donorSearchTerm.toLowerCase()) ||
      donor.phone?.toLowerCase().includes(donorSearchTerm.toLowerCase()) ||
      donor.whatsapp?.toLowerCase().includes(donorSearchTerm.toLowerCase());

    const matchesRoute = donorFilterRoute === '' || donor.routeId === donorFilterRoute || donor.route === donorFilterRoute;
    const donorCategoryNames = (donor.categories || []).map(cat => cat.name).filter(Boolean);
    const matchesCategory = donorFilterCategory === '' || donorCategoryNames.includes(donorFilterCategory);

    return matchesSearch && matchesRoute && matchesCategory;
  });

  // --- Expense Master State ---
  const [expenses, setExpenses] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ code: '', description: '', category: 'Expenses' });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const handleExpenseChange = (e) => setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
  const openAddExpenseModal = () => { setExpenseForm({ code: '', description: '', category: 'Expenses' }); setEditingExpenseId(null); setIsExpenseModalOpen(true); };
  const closeExpenseModal = () => { setIsExpenseModalOpen(false); setExpenseForm({ code: '', description: '', category: 'Expenses' }); setEditingExpenseId(null); };

  const validateExpenseForm = () => {
    if (!expenseForm.code || !expenseForm.code.trim()) {
      throw new Error('Please enter the expense code.');
    }
    if (!expenseForm.description || !expenseForm.description.trim()) {
      throw new Error('Please enter the expense description.');
    }
    return true;
  };

  const handleSaveExpense = async () => {
    try {
      validateExpenseForm();
      const payload = cleanPayload(expenseForm);
      if (editingExpenseId) {
        const res = await fetch(`http://localhost:5000/api/master/expense/${editingExpenseId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to update expense.');
        setExpenses(expenses.map(e => e._id === editingExpenseId ? result : e));
      } else {
        const res = await fetch('http://localhost:5000/api/master/expense', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to save expense.');
        setExpenses([...expenses, result]);
      }
      closeExpenseModal();
    } catch (err) { console.error('Expense save error:', err.message); alert('Error: ' + err.message); }
  };
  const handleEditExpense = (expense) => {
    setExpenseForm({
      code: expense.code || '',
      description: expense.description || expense.title || expense.desc || '',
      category: expense.category || 'Expenses'
    });
    setEditingExpenseId(expense._id);
    setIsExpenseModalOpen(true);
  };
  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await fetch(`http://localhost:5000/api/master/expense/${id}`, { method: 'DELETE' });
        setExpenses(expenses.filter(e => e._id !== id));
      } catch (err) { console.error(err); }
    }
  };

  // --- Bank Master State ---
  const [banks, setBanks] = useState([]);
  const [editingBankId, setEditingBankId] = useState(null);
  const [bankForm, setBankForm] = useState({ name: '', branch: '', accNo: '', status: 'Linked' });
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const handleBankChange = (e) => setBankForm({ ...bankForm, [e.target.name]: e.target.value });
  const openAddBankModal = () => { setBankForm({ name: '', branch: '', accNo: '', status: 'Linked' }); setEditingBankId(null); setIsBankModalOpen(true); };
  const closeBankModal = () => { setIsBankModalOpen(false); setBankForm({ name: '', branch: '', accNo: '', status: 'Linked' }); setEditingBankId(null); };

  const validateBankForm = () => {
    if (!bankForm.name || !bankForm.name.trim()) {
      throw new Error('Please enter the bank name.');
    }
    return true;
  };

  const handleSaveBank = async () => {
    try {
      validateBankForm();
      const payload = cleanPayload(bankForm);
      if (editingBankId) {
        const res = await fetch(`http://localhost:5000/api/master/bank/${editingBankId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to update bank.');
        setBanks(banks.map(b => b._id === editingBankId ? result : b));
      } else {
        const res = await fetch('http://localhost:5000/api/master/bank', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to save bank.');
        setBanks([...banks, result]);
      }
      closeBankModal();
    } catch (err) { console.error('Bank save error:', err.message); alert('Error: ' + err.message); }
  };
  const handleEditBank = (bank) => { setBankForm({ name: bank.name || '', branch: bank.branch || '', accNo: bank.accNo || '', status: bank.status || 'Linked' }); setEditingBankId(bank._id); setIsBankModalOpen(true); };
  const handleDeleteBank = async (id) => {
    if (window.confirm('Are you sure you want to delete this bank?')) {
      try {
        await fetch(`http://localhost:5000/api/master/bank/${id}`, { method: 'DELETE' });
        setBanks(banks.filter(b => b._id !== id));
      } catch (err) { console.error(err); }
    }
  };
  // -----------------------------

  // --- Location Master State ---
  const [locations, setLocations] = useState([]);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [locationForm, setLocationForm] = useState({ name: '', description: '', status: 'Active' });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const handleLocationChange = (e) => setLocationForm({ ...locationForm, [e.target.name]: e.target.value });
  const openAddLocationModal = () => { setLocationForm({ name: '', description: '', status: 'Active' }); setEditingLocationId(null); setIsLocationModalOpen(true); };
  const closeLocationModal = () => { setIsLocationModalOpen(false); setLocationForm({ name: '', description: '', status: 'Active' }); setEditingLocationId(null); };

  const validateLocationForm = () => {
    if (!locationForm.name || !locationForm.name.trim()) {
      throw new Error('Please enter the location name.');
    }
    return true;
  };

  const handleSaveLocation = async () => {
    try {
      validateLocationForm();
      const payload = cleanPayload(locationForm);
      if (editingLocationId) {
        const res = await fetch(`http://localhost:5000/api/master/location/${editingLocationId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to update location.');
        setLocations(locations.map(l => l._id === editingLocationId ? result : l));
      } else {
        const res = await fetch('http://localhost:5000/api/master/location', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to save location.');
        setLocations([...locations, result]);
      }
      closeLocationModal();
    } catch (err) { console.error('Location save error:', err.message); alert('Error: ' + err.message); }
  };
  const handleEditLocation = (location) => { setLocationForm({ name: location.name || '', description: location.description || '', status: location.status || 'Active' }); setEditingLocationId(location._id); setIsLocationModalOpen(true); };
  const handleDeleteLocation = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await fetch(`http://localhost:5000/api/master/location/${id}`, { method: 'DELETE' });
        setLocations(locations.filter(l => l._id !== id));
      } catch (err) { console.error(err); }
    }
  };
  // -----------------------------

  // --- Department Master State ---
  const [departments, setDepartments] = useState([]);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [departmentForm, setDepartmentForm] = useState({ name: '', code: '', status: 'Active' });
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);

  const handleDepartmentChange = (e) => setDepartmentForm({ ...departmentForm, [e.target.name]: e.target.value });
  const openAddDepartmentModal = () => { setDepartmentForm({ name: '', code: '', status: 'Active' }); setEditingDepartmentId(null); setIsDepartmentModalOpen(true); };
  const closeDepartmentModal = () => { setIsDepartmentModalOpen(false); setDepartmentForm({ name: '', code: '', status: 'Active' }); setEditingDepartmentId(null); };

  const validateDepartmentForm = () => {
    if (!departmentForm.name || !departmentForm.name.trim()) {
      throw new Error('Please enter the department name.');
    }
    return true;
  };

  const handleSaveDepartment = async () => {
    try {
      validateDepartmentForm();
      const payload = cleanPayload(departmentForm);
      if (editingDepartmentId) {
        const res = await fetch(`http://localhost:5000/api/master/department/${editingDepartmentId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to update department.');
        setDepartments(departments.map(d => d._id === editingDepartmentId ? result : d));
      } else {
        const res = await fetch('http://localhost:5000/api/master/department', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unable to save department.');
        setDepartments([...departments, result]);
      }
      closeDepartmentModal();
    } catch (err) { console.error('Department save error:', err.message); alert('Error: ' + err.message); }
  };
  const handleEditDepartment = (dept) => { setDepartmentForm({ name: dept.name || '', code: dept.code || '', status: dept.status || 'Active' }); setEditingDepartmentId(dept._id); setIsDepartmentModalOpen(true); };
  const handleDeleteDepartment = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await fetch(`http://localhost:5000/api/master/department/${id}`, { method: 'DELETE' });
        setDepartments(departments.filter(d => d._id !== id));
      } catch (err) { console.error(err); }
    }
  };
  // -----------------------------

  // =========== INVENTORY STATE ===========
  const [inventoryView, setInventoryView] = useState('dashboard'); // dashboard | purchase | gin | suppliers | items | payment | till
  const [suppliers, setSuppliers] = useState([]);
  const [invItems, setInvItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [gins, setGins] = useState([]);
  const [payments, setPayments] = useState([]);

  // Purchase form
  const emptyPurchaseLine = () => ({ itemName: '', qty: '1', rate: '', amount: 0 });
  const [purchaseForm, setPurchaseForm] = useState({
    date: new Date().toISOString().slice(0,10),
    invoiceNumber: '',
    supplierName: '',
    supplierAddress: '',
    supplierTelephone: '',
    location: '',
    discount: '',
    lines: [emptyPurchaseLine()]
  });
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [activeSupplierIndex, setActiveSupplierIndex] = useState(-1);

  // Location selection for purchase
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState(-1);

  // GIN form
  const emptyGinLine = () => ({ itemCode: '', itemName: '', qty: '', unit: 'Pcs', remarks: '' });
  const [ginForm, setGinForm] = useState({
    date: new Date().toISOString().slice(0,10),
    ginNumber: '',
    issuedTo: '',
    department: '',
    remarks: '',
    lines: [emptyGinLine()]
  });

  // Item master modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState({ code: '', name: '', unit: 'Pcs', category: '', location: '', currentStock: '', reorderLevel: '' });

  // Supplier master modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', address: '', telephone: '', email: '', status: 'Active' });

  const getNextGinNumber = () => {
    const nums = gins.map(g => {
      const match = String(g.ginNumber || '').match(/GIN-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `GIN-${String(max + 1).padStart(3, '0')}`;
  };

  // Payment form
  const getNextPaymentNumber = () => {
    const nums = payments.map(p => {
      const match = String(p.paymentNumber || '').match(/PAY-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `PAY-${String(max + 1).padStart(3, '0')}`;
  };

  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().slice(0,10),
    paymentNumber: getNextPaymentNumber(),
    supplierName: '',
    invoiceNumber: '',
    amount: '',
    paymentMode: 'Cash',
    chequeNumber: '',
    bankName: '',
    remarks: ''
  });
  const [paymentSupplierSuggestions, setPaymentSupplierSuggestions] = useState([]);
  const [showPaymentSupplierDropdown, setShowPaymentSupplierDropdown] = useState(false);
  const [activePaymentSupplierIndex, setActivePaymentSupplierIndex] = useState(-1);
  const [filteredSupplierInvoices, setFilteredSupplierInvoices] = useState([]);
  // --- Till State ---
  const [tills, setTills] = useState([]);
  const [tillForm, setTillForm] = useState({
    issueDate: new Date().toISOString().slice(0, 10),
    tillNumber: '',
    donorName: '',
    donorId: ''
  });
  const [tillCollectForm, setTillCollectForm] = useState({
    collectedDate: new Date().toISOString().slice(0, 10),
    receiptNumber: '',
    amount: ''
  });
  // Till receipt preview
  const [tillReceiptPreview, setTillReceiptPreview] = useState(null);
  const [tillReceiptModalOpen, setTillReceiptModalOpen] = useState(false);
  const [paymentPrintPreview, setPaymentPrintPreview] = useState(null);
  const [paymentPrintModalOpen, setPaymentPrintModalOpen] = useState(false);
  const [tillFilterTillNo, setTillFilterTillNo] = useState('');
  const [tillFilterDonor, setTillFilterDonor] = useState('');
  const [showTillNewDonorForm, setShowTillNewDonorForm] = useState(false);
  const [tillNewDonorForm, setTillNewDonorForm] = useState({ routeId: '', name: '', address: '', telephone: '', whatsapp: '', category: 'Till' });
  const [tillDonorSearch, setTillDonorSearch] = useState('');
  const [tillDonorDropdownOpen, setTillDonorDropdownOpen] = useState(false);
  const [tillDonorHighlightIndex, setTillDonorHighlightIndex] = useState(-1);
  const tillDonorDropdownRef = useRef(null);

  const handleTillNewDonorChange = (field, value) => setTillNewDonorForm(prev => ({ ...prev, [field]: value }));

  const handleSaveTillNewDonor = async () => {
    const { routeId, name, address, telephone, whatsapp, category } = tillNewDonorForm;
    if (!routeId) return alert('Please select a Route.');
    if (!name.trim()) return alert('Please enter Donor Name.');
    try {
      const routeObj = routes.find(r => r._id === routeId);
      const res = await fetch('http://localhost:5000/api/master/donor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, name: name.trim(), address, route: routeObj?.name || '', phone: telephone, whatsapp, status: 'Active', category, categories: [] })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save donor.');
      setDonors(prev => [result, ...prev]);
      setTillForm(prev => ({ ...prev, donorName: result.name, donorId: result._id }));
      setShowTillNewDonorForm(false);
      setTillNewDonorForm({ routeId: '', name: '', address: '', telephone: '', whatsapp: '', category: 'Till' });
    } catch (err) { alert('Error: ' + err.message); }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      date: new Date().toISOString().slice(0,10),
      paymentNumber: getNextPaymentNumber(),
      supplierName: '',
      invoiceNumber: '',
      amount: '',
      paymentMode: 'Cash',
      chequeNumber: '',
      bankName: '',
      remarks: ''
    });
    setPaymentSupplierSuggestions([]);
    setShowPaymentSupplierDropdown(false);
    setActivePaymentSupplierIndex(-1);
    setFilteredSupplierInvoices([]);
  };

  // Stock check modal (F4)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockSearchTerm, setStockSearchTerm] = useState('');

  // Item search dropdown for purchase/GIN lines
  const [activeLineIdx, setActiveLineIdx] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [activeItemIdx, setActiveItemIdx] = useState(-1);

  // Reset helpers
  const resetPurchaseForm = () => {
    setPurchaseForm({
      date: new Date().toISOString().slice(0,10),
      invoiceNumber: '',
      supplierName: '',
      supplierAddress: '',
      supplierTelephone: '',
      location: '',
      discount: '',
      lines: [emptyPurchaseLine()]
    });
    setSupplierSuggestions([]);
    setShowSupplierDropdown(false);
    setActiveSupplierIndex(-1);
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
    setActiveLocationIndex(-1);
  };

  const resetGinForm = () => {
    setGinForm({
      date: new Date().toISOString().slice(0,10),
      ginNumber: getNextGinNumber(),
      issuedTo: '',
      department: '',
      remarks: '',
      lines: [emptyGinLine()]
    });
  };

  // Helpers
  const calcPurchaseTotals = (lines) => {
    const invoiceTotal = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
    return invoiceTotal;
  };

  const resolvePurchaseLineItem = (line) => {
    const searchTerm = String(line?.itemName || '').trim().toLowerCase();
    if (!searchTerm) return null;

    const exactNameMatch = invItems.find((item) => String(item.name || '').trim().toLowerCase() === searchTerm);
    if (exactNameMatch) return exactNameMatch;

    const partialNameMatch = invItems.find((item) => String(item.name || '').trim().toLowerCase().includes(searchTerm));
    return partialNameMatch || null;
  };

  const handlePurchaseLineChange = (idx, field, value) => {
    setPurchaseForm(prev => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      if (field === 'qty' || field === 'rate') {
        const qty = field === 'qty' ? Number(value) : Number(lines[idx].qty);
        const rate = field === 'rate' ? Number(value) : Number(lines[idx].rate);
        lines[idx].amount = isNaN(qty * rate) ? 0 : qty * rate;
      }
      return { ...prev, lines };
    });
  };

  const handleGinLineChange = (idx, field, value) => {
    setGinForm(prev => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      if (field === 'itemName') {
        const matchedItem = invItems.find((item) => String(item.name || '').trim().toLowerCase() === String(value || '').trim().toLowerCase());
        if (matchedItem) {
          lines[idx] = { ...lines[idx], itemName: matchedItem.name, itemCode: matchedItem.code };
        }
      }
      return { ...prev, lines };
    });
  };

  const selectItemForLine = (item, idx, formType) => {
    if (formType === 'purchase') {
      setPurchaseForm(prev => {
        const lines = [...prev.lines];
        lines[idx] = { ...lines[idx], itemName: item.name };
        return { ...prev, lines };
      });
    } else {
      setGinForm(prev => {
        const lines = [...prev.lines];
        lines[idx] = { ...lines[idx], itemCode: item.code, itemName: item.name, unit: item.unit || 'Pcs' };
        return { ...prev, lines };
      });
    }
    setShowItemDropdown(false);
    setItemSearchTerm('');
  };

  const selectSupplier = (supplier) => {
    setPurchaseForm(prev => ({ ...prev, supplierName: supplier.name, supplierAddress: supplier.address || '', supplierTelephone: supplier.telephone || '' }));
    setShowSupplierDropdown(false);
    setActiveSupplierIndex(-1);
  };

  const selectLocation = (location) => {
    setPurchaseForm(prev => ({ ...prev, location: location.name }));
    setShowLocationDropdown(false);
    setActiveLocationIndex(-1);
  };

  const handleLocationNameChange = (value) => {
    setPurchaseForm(prev => ({ ...prev, location: value }));
    if (value.trim().length >= 1) {
      const matches = locations.filter(l => l.name.toLowerCase().includes(value.toLowerCase()) && l.status === 'Active');
      setLocationSuggestions(matches);
      setShowLocationDropdown(matches.length > 0);
      setActiveLocationIndex(-1);
      const exact = matches.find(l => l.name.toLowerCase() === value.toLowerCase());
      if (exact) {
        setPurchaseForm(prev => ({ ...prev, location: exact.name }));
        setShowLocationDropdown(false);
      }
    } else {
      setShowLocationDropdown(false);
      setActiveLocationIndex(-1);
    }
  };

  const handleLocationInputKeyDown = (e) => {
    if (!showLocationDropdown || locationSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && locationSuggestions.length > 0) {
        e.preventDefault();
        setShowLocationDropdown(true);
        setActiveLocationIndex(0);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveLocationIndex(prev => (prev + 1 + locationSuggestions.length) % locationSuggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveLocationIndex(prev => (prev - 1 + locationSuggestions.length) % locationSuggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeLocationIndex >= 0 && locationSuggestions[activeLocationIndex]) {
          selectLocation(locationSuggestions[activeLocationIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowLocationDropdown(false);
        setActiveLocationIndex(-1);
        break;
      default: break;
    }
  };

  const handleSupplierNameChange = (value) => {
    setPurchaseForm(prev => ({ ...prev, supplierName: value, supplierAddress: '', supplierTelephone: '' }));
    if (value.trim().length >= 1) {
      const matches = suppliers.filter(s => s.name.toLowerCase().includes(value.toLowerCase()));
      setSupplierSuggestions(matches);
      setShowSupplierDropdown(matches.length > 0);
      setActiveSupplierIndex(-1);
      // Auto-fill if exact match
      const exact = matches.find(s => s.name.toLowerCase() === value.toLowerCase());
      if (exact) {
        setPurchaseForm(prev => ({ ...prev, supplierName: exact.name, supplierAddress: exact.address || '', supplierTelephone: exact.telephone || '' }));
        setShowSupplierDropdown(false);
      }
    } else {
      setShowSupplierDropdown(false);
      setActiveSupplierIndex(-1);
    }
  };

  const handleSupplierInputKeyDown = (e) => {
    if (!showSupplierDropdown || supplierSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && supplierSuggestions.length > 0) {
        e.preventDefault();
        setShowSupplierDropdown(true);
        setActiveSupplierIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSupplierIndex(prev => (prev + 1 + supplierSuggestions.length) % supplierSuggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSupplierIndex(prev => (prev - 1 + supplierSuggestions.length) % supplierSuggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSupplierIndex >= 0 && supplierSuggestions[activeSupplierIndex]) {
          selectSupplier(supplierSuggestions[activeSupplierIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSupplierDropdown(false);
        setActiveSupplierIndex(-1);
        break;
      default:
        break;
    }
  };

  // --- Payment Supplier handlers ---
  const getOutstanding = (inv) => (inv.totalAmount || 0) - (inv.paidAmount || 0);

  const selectPaymentSupplier = (supplier) => {
    setPaymentForm(prev => ({ ...prev, supplierName: supplier.name, invoiceNumber: '', amount: '' }));
    setShowPaymentSupplierDropdown(false);
    setActivePaymentSupplierIndex(-1);
    const invoices = purchases.filter(p => p.supplierName.toLowerCase() === supplier.name.toLowerCase() && getOutstanding(p) > 0);
    setFilteredSupplierInvoices(invoices);
  };

  const handlePaymentSupplierNameChange = (value) => {
    setPaymentForm(prev => ({ ...prev, supplierName: value }));
    if (value.trim().length >= 1) {
      const matches = suppliers.filter(s => s.name.toLowerCase().includes(value.toLowerCase()));
      setPaymentSupplierSuggestions(matches);
      setShowPaymentSupplierDropdown(matches.length > 0);
      setActivePaymentSupplierIndex(-1);
      const exact = matches.find(s => s.name.toLowerCase() === value.toLowerCase());
      if (exact) {
        setPaymentForm(prev => ({ ...prev, supplierName: exact.name, invoiceNumber: '', amount: '' }));
        setShowPaymentSupplierDropdown(false);
        setActivePaymentSupplierIndex(-1);
        const invoices = purchases.filter(p => p.supplierName.toLowerCase() === exact.name.toLowerCase() && getOutstanding(p) > 0);
        setFilteredSupplierInvoices(invoices);
      } else {
        setFilteredSupplierInvoices([]);
      }
    } else {
      setShowPaymentSupplierDropdown(false);
      setActivePaymentSupplierIndex(-1);
      setFilteredSupplierInvoices([]);
    }
  };

  const handlePaymentSupplierInputKeyDown = (e) => {
    if (!showPaymentSupplierDropdown || paymentSupplierSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && paymentSupplierSuggestions.length > 0) {
        e.preventDefault();
        setShowPaymentSupplierDropdown(true);
        setActivePaymentSupplierIndex(0);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActivePaymentSupplierIndex(prev => (prev + 1 + paymentSupplierSuggestions.length) % paymentSupplierSuggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActivePaymentSupplierIndex(prev => (prev - 1 + paymentSupplierSuggestions.length) % paymentSupplierSuggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (activePaymentSupplierIndex >= 0 && paymentSupplierSuggestions[activePaymentSupplierIndex]) {
          selectPaymentSupplier(paymentSupplierSuggestions[activePaymentSupplierIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowPaymentSupplierDropdown(false);
        setActivePaymentSupplierIndex(-1);
        break;
      default: break;
    }
  };

  const selectPaymentInvoice = (invoice) => {
    const outstanding = getOutstanding(invoice);
    setPaymentForm(prev => ({ ...prev, invoiceNumber: invoice.invoiceNumber, amount: String(outstanding) }));
  };

  const handleSavePayment = async () => {
    const { date, paymentNumber, supplierName, invoiceNumber, amount, paymentMode, chequeNumber, bankName, remarks } = paymentForm;
    const normalizedNumber = String(paymentNumber || '').trim();
    const normalizedSupplier = String(supplierName || '').trim();
    if (!normalizedNumber) return alert('Please enter a Payment Number.');
    if (!normalizedSupplier) return alert('Please select a Supplier.');
    if (!amount || Number(amount) <= 0) return alert('Please enter a valid Amount.');
    try {
      const res = await fetch('http://localhost:5000/api/inventory/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentNumber: normalizedNumber,
          date: String(date || '').trim() || new Date().toISOString().slice(0, 10),
          supplierName: normalizedSupplier,
          invoiceNumber: String(invoiceNumber || '').trim(),
          amount: Number(amount),
          paymentMode: paymentMode || 'Cash',
          chequeNumber: paymentMode === 'Cheque' ? String(chequeNumber || '').trim() : '',
          bankName: paymentMode === 'Cheque' ? String(bankName || '').trim() : '',
          remarks: String(remarks || '').trim()
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save payment.');
      setPayments(prev => [result, ...prev]);
      const nextNum = (() => {
        const allNums = [result, ...payments].map(p => {
          const m = String(p.paymentNumber || '').match(/PAY-(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        });
        return `PAY-${String(Math.max(...allNums) + 1).padStart(3, '0')}`;
      })();
      setPaymentForm({
        date: new Date().toISOString().slice(0,10),
        paymentNumber: nextNum,
        supplierName: '', invoiceNumber: '', amount: '',
        paymentMode: 'Cash', chequeNumber: '', bankName: '', remarks: ''
      });
      setPaymentSupplierSuggestions([]);
      setShowPaymentSupplierDropdown(false);
      setActivePaymentSupplierIndex(-1);
      setFilteredSupplierInvoices([]);
      alert('Payment saved successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  // -----------------------------

  const handleItemInputKeyDown = (e, index) => {
    if (!showItemDropdown || activeLineIdx !== index || filteredInventoryItems.length === 0) {
      if (e.key === 'ArrowDown' && filteredInventoryItems.length > 0) {
        e.preventDefault();
        setShowItemDropdown(true);
        setActiveItemIdx(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveItemIdx(prev => (prev + 1 + filteredInventoryItems.length) % filteredInventoryItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveItemIdx(prev => (prev - 1 + filteredInventoryItems.length) % filteredInventoryItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeItemIdx >= 0 && filteredInventoryItems[activeItemIdx]) {
          selectItemForLine(filteredInventoryItems[activeItemIdx], index, inventoryView === 'gin' ? 'gin' : 'purchase');
          setShowItemDropdown(false);
          setActiveItemIdx(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowItemDropdown(false);
        setActiveItemIdx(-1);
        break;
      default:
        break;
    }
  };

  const handleSavePurchase = async () => {
    const { date, invoiceNumber, supplierName, supplierAddress, supplierTelephone, location, discount } = purchaseForm;
    const normalizedInvoiceNumber = String(invoiceNumber || '').trim();
    const normalizedSupplierName = String(supplierName || '').trim();
    const payloadDate = String(date || '').trim() || new Date().toISOString().slice(0, 10);

    if (!normalizedInvoiceNumber) {
      alert('Please enter an Invoice Number.');
      return;
    }
    if (!normalizedSupplierName) {
      alert('Please enter Supplier Name.');
      return;
    }

    const validLines = normalizePurchaseLines();
    if (validLines.length === 0) {
      alert('Please add at least one item with Qty and Rate.');
      return;
    }

    const invoiceTotal = calcPurchaseTotals(validLines);
    const disc = Number(discount) || 0;
    const totalAmount = invoiceTotal - disc;
    try {
      const res = await fetch('http://localhost:5000/api/inventory/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: payloadDate,
          invoiceNumber: normalizedInvoiceNumber,
          supplierName: normalizedSupplierName,
          supplierAddress: String(supplierAddress || '').trim(),
          supplierTelephone: String(supplierTelephone || '').trim(),
          location: String(location || '').trim(),
          items: validLines,
          invoiceTotal,
          discount: disc,
          totalAmount
        })
      });
      let result = null;
      try {
        result = await res.json();
      } catch (parseErr) {
        result = { error: await res.text() };
      }
      if (!res.ok) throw new Error(result?.error || 'Failed to save invoice.');
      setPurchases(prev => [result, ...prev]);
      const itemsRes = await fetch('http://localhost:5000/api/inventory/item');
      setInvItems(await itemsRes.json());
      const suppRes = await fetch('http://localhost:5000/api/inventory/supplier');
      setSuppliers(await suppRes.json());
      setPurchaseForm({ date: new Date().toISOString().slice(0,10), invoiceNumber: '', supplierName: '', supplierAddress: '', supplierTelephone: '', location: '', discount: '', lines: [emptyPurchaseLine()] });
      alert('Invoice saved successfully!');
    } catch (err) {
      console.error('Purchase save failed:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleDeletePurchase = async (id) => {
    if (!window.confirm('Delete this invoice and reverse stock?')) return;
    try {
      await fetch(`http://localhost:5000/api/inventory/purchase/${id}`, { method: 'DELETE' });
      setPurchases(prev => prev.filter(p => p._id !== id));
      const itemsRes = await fetch('http://localhost:5000/api/inventory/item');
      setInvItems(await itemsRes.json());
    } catch(err) { alert('Error: ' + err.message); }
  };

  const handleSaveGin = async () => {
    const { date, ginNumber, issuedTo, department, remarks, lines } = ginForm;
    if (!ginNumber.trim()) return alert('Please enter a GIN Number.');
    const validLines = lines.filter(l => l.itemName && l.qty);
    if (validLines.length === 0) return alert('Please add at least one item with Qty.');
    try {
      const res = await fetch('http://localhost:5000/api/inventory/gin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, ginNumber, issuedTo, department, items: validLines, remarks })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save GIN.');
      setGins(prev => [result, ...prev]);
      const itemsRes = await fetch('http://localhost:5000/api/inventory/item');
      setInvItems(await itemsRes.json());
      setGinForm({ date: new Date().toISOString().slice(0,10), ginNumber: '', issuedTo: '', department: '', remarks: '', lines: [emptyGinLine()] });
      alert('Goods Issue Note saved successfully!');
    } catch(err) { alert('Error: ' + err.message); }
  };

  const handleDeleteGin = async (id) => {
    if (!window.confirm('Delete this GIN and restore stock?')) return;
    try {
      await fetch(`http://localhost:5000/api/inventory/gin/${id}`, { method: 'DELETE' });
      setGins(prev => prev.filter(g => g._id !== id));
      const itemsRes = await fetch('http://localhost:5000/api/inventory/item');
      setInvItems(await itemsRes.json());
    } catch(err) { alert('Error: ' + err.message); }
  };

  const handleSaveItem = async () => {
    try {
      if (!itemForm.name.trim()) {
        alert('Item name is required.');
        return;
      }
      const payload = {
        ...itemForm,
        code: (itemForm.code || '').trim() || undefined,
        name: itemForm.name.trim(),
        unit: itemForm.unit || 'Pcs',
        category: itemForm.category || '',
        location: itemForm.location || '',
        currentStock: Number(itemForm.currentStock) || 0,
        reorderLevel: Number(itemForm.reorderLevel) || 0
      };
      if (editingItemId) {
        const res = await fetch(`http://localhost:5000/api/inventory/item/${editingItemId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setInvItems(prev => prev.map(i => i._id === editingItemId ? result : i));
      } else {
        const res = await fetch('http://localhost:5000/api/inventory/item', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setInvItems(prev => [...prev, result]);
      }
      setIsItemModalOpen(false);
      setEditingItemId(null);
      setItemForm({ code: '', name: '', unit: 'Pcs', category: '', location: '', currentStock: '', reorderLevel: '' });
    } catch(err) { alert('Error: ' + err.message); }
  };

  const handleSaveSupplier = async () => {
    try {
      if (!supplierForm.name.trim()) return alert('Supplier name is required.');
      if (editingSupplierId) {
        const res = await fetch(`http://localhost:5000/api/inventory/supplier/${editingSupplierId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(supplierForm)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setSuppliers(prev => prev.map(s => s._id === editingSupplierId ? result : s));
      } else {
        const res = await fetch('http://localhost:5000/api/inventory/supplier', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(supplierForm)
        });
        if (res.status === 409) { alert('Supplier already exists!'); return; }
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setSuppliers(prev => [...prev, result]);
      }
      setIsSupplierModalOpen(false);
      setEditingSupplierId(null);
      setSupplierForm({ name: '', address: '', telephone: '', email: '', status: 'Active' });
    } catch(err) { alert('Error: ' + err.message); }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await fetch(`http://localhost:5000/api/inventory/supplier/${id}`, { method: 'DELETE' });
      setSuppliers(prev => prev.filter(s => s._id !== id));
    } catch (err) { alert('Error: ' + err.message); }
  };

  // F4 stock check shortcut
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F4') { e.preventDefault(); setIsStockModalOpen(true); setStockSearchTerm(''); }
      if (e.key === 'Escape') { setIsStockModalOpen(false); setShowItemDropdown(false); setShowSupplierDropdown(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (donorReceiptDropdownRef.current && !donorReceiptDropdownRef.current.contains(e.target)) {
        setDonorReceiptDropdownOpen(false);
      }
      if (grAccountDropdownRef.current && !grAccountDropdownRef.current.contains(e.target)) {
        setGrAccountDropdownOpen(false);
      }
      if (gpAccountDropdownRef.current && !gpAccountDropdownRef.current.contains(e.target)) {
        setGpAccountDropdownOpen(false);
      }
      if (tillDonorDropdownRef.current && !tillDonorDropdownRef.current.contains(e.target)) {
        setTillDonorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // =========================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchJson = async (url) => {
          const res = await fetch(url);
          if (!res.ok) {
            console.error(`Error fetching ${url}: ${res.statusText}`);
            return [];
          }
          return res.json();
        };

        const [compData, catData, routeData, donorData, expData, bankData, locData, rcptData, suppData, itemData, purchData, ginData, payData, tillData, genRcptData, genPayData] = await Promise.all([
          fetchJson('http://localhost:5000/api/master/company'),
          fetchJson('http://localhost:5000/api/master/category'),
          fetchJson('http://localhost:5000/api/master/route'),
          fetchJson('http://localhost:5000/api/master/donor'),
          fetchJson('http://localhost:5000/api/master/expense'),
          fetchJson('http://localhost:5000/api/master/bank'),
          fetchJson('http://localhost:5000/api/master/location'),
          fetchJson('http://localhost:5000/api/receipt'),
          fetchJson('http://localhost:5000/api/inventory/supplier'),
          fetchJson('http://localhost:5000/api/inventory/item'),
          fetchJson('http://localhost:5000/api/inventory/purchase'),
          fetchJson('http://localhost:5000/api/inventory/gin'),
          fetchJson('http://localhost:5000/api/inventory/payment'),
          fetchJson('http://localhost:5000/api/inventory/till'),
          fetchJson('http://localhost:5000/api/general-receipt'),
          fetchJson('http://localhost:5000/api/general-payment')
        ]);
        setCompanies(compData);
        setCategories(catData);
        setRoutes(routeData);
        setDonors(donorData);
        setExpenses(expData);
        setBanks(bankData);
        setLocations(locData);
        setDonorReceiptRecords(rcptData);
        setSuppliers(suppData);
        setInvItems(itemData);
        setPurchases(purchData);
        setGins(ginData);
        setPayments(payData);
        setTills(tillData || []);
        setGeneralReceiptRecords(genRcptData || []);
        setGeneralPaymentRecords(genPayData || []);
        // Auto-generate next receipt number
        const genNums = (genRcptData || []).map(r => {
          const m = String(r.receiptNumber || '').match(/GR-(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        });
        const genMax = genNums.length > 0 ? Math.max(...genNums) : 0;
        setGeneralReceiptForm(prev => ({ ...prev, receiptNumber: `GR-${String(genMax + 1).padStart(3, '0')}` }));
        // Auto-generate next payment number
        const genPayNums = (genPayData || []).map(r => {
          const m = String(r.paymentNumber || '').match(/GP-(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        });
        const genPayMax = genPayNums.length > 0 ? Math.max(...genPayNums) : 0;
        setGeneralPaymentForm(prev => ({ ...prev, paymentNumber: `GP-${String(genPayMax + 1).padStart(3, '0')}` }));
        // Update payment number after payments data loads
        const allPayments = payData || [];
        const nums = allPayments.map(p => {
          const match = String(p.paymentNumber || '').match(/PAY-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        });
        const max = nums.length > 0 ? Math.max(...nums) : 0;
        const nextNum = `PAY-${String(max + 1).padStart(3, '0')}`;
        setPaymentForm(prev => ({ ...prev, paymentNumber: nextNum }));
        // Recalculate invoice paid amounts from existing payments (idempotent), then refresh purchases
        try {
          await fetch('http://localhost:5000/api/inventory/payment/recalculate', { method: 'POST' });
          const freshPurchases = await fetch('http://localhost:5000/api/inventory/purchase');
          setPurchases(await freshPurchases.json());
        } catch (_) {}
      } catch (err) {
        console.error("Error fetching master data:", err);
      }
    };
    fetchData();
  }, []);

  // Sync Dark/Light theme class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Get active menu label
  const getHeaderLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'master-file': return 'Master File Directory';
      case 'master-donor': return 'Donor Master';
      case 'master-expenses': return 'Account Master File';
      case 'master-category': return 'Category Master';
      case 'master-bank': return 'Bank Master';
      case 'master-company': return 'Company Master';
      case 'master-route': return 'Route Master';
      case 'master-location': return 'Location Master';
      case 'master-supplier': return 'Supplier Master';
      case 'master-item': return 'Item Master';
      case 'transaction': return 'Transactions';
      case 'reports': return 'Reports Dashboard';
      case 'report-donor': return 'Donor Report';
      case 'report-general': return 'General Report';
      case 'report-purchase': return 'Purchase Report';
      case 'report-account': return 'Account Report';
      case 'report-log': return 'Log Report';
      case 'inventory': return 'Inventory';

      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const getMonthKey = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 7);
  };

  const formatCategoryAmounts = (donor) => {
    if (!donor?.categories || donor.categories.length === 0) return '-';
    return donor.categories
      .filter((cat) => cat?.name)
      .map((cat) => `${cat.name}: ${cat.amount || '0'}`)
      .join(', ');
  };

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, index) => String(currentYear - 2 + index));

  const getStatementMonths = (year) => {
    const selectedYear = Number(year) || currentYear;
    return Array.from({ length: 12 }, (_, index) => {
      const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(selectedYear, index, 1));
      return `${monthName}-${String(selectedYear).slice(-2)}`;
    });
  };

  const statementMonths = getStatementMonths(drFilterYear);

  const getCategoryAmount = (donor, categoryName) => {
    if (!donor?.categories || donor.categories.length === 0) return '';
    const cat = donor.categories.find((item) => item?.name?.trim().toLowerCase() === categoryName.toLowerCase());
    return cat ? cat.amount || '' : '';
  };

  const getStatementMonthValue = (donor, monthKey) => {
    if (donor.monthlyAmounts && typeof donor.monthlyAmounts === 'object') {
      return donor.monthlyAmounts[monthKey] || '';
    }
    const selectedYearSuffix = String(drFilterYear || currentYear).slice(-2);
    if (monthKey.endsWith(`-${selectedYearSuffix}`) && donor.monthlyContribution) {
      return donor.monthlyContribution;
    }
    return '';
  };

  const getStatementReceipt = (donor, monthKey) => {
    if (donor.receipts && typeof donor.receipts === 'object') {
      return donor.receipts[monthKey] || '';
    }
    return monthKey === statementMonths[statementMonths.length - 1] ? (donor.receiptNumber || '') : '';
  };

  const getYearCategoryTotals = (donor) => {
    if (!donor?.categories || donor.categories.length === 0) {
      return {};
    }
    return donor.categories.reduce((acc, category) => {
      const name = category?.name?.trim() || 'Unknown';
      const amount = Number(category?.amount) || 0;
      acc[name] = (acc[name] || 0) + amount;
      return acc;
    }, {});
  };

  const getDonorBalances = (donor, year) => {
    const selectedYear = String(year || drFilterYear || currentYear);
    const lastYear = String(Number(selectedYear) - 1);
    const lastYearBalance = Number(donor.lastYearBalance || 0) || 0;
    const currentYearBalance = Number(donor.currentYearBalance || 0) || 0;
    const computedLastYearPayments = Object.entries(donor.monthlyAmounts || {})
      .filter(([key]) => key.endsWith(`-${lastYear.slice(-2)}`))
      .reduce((sum, [, value]) => sum + (Number(value) || 0), 0);
    const computedCurrentYearPayments = Object.entries(donor.monthlyAmounts || {})
      .filter(([key]) => key.endsWith(`-${selectedYear.slice(-2)}`))
      .reduce((sum, [, value]) => sum + (Number(value) || 0), 0);
    return {
      lastYear: lastYearBalance || computedLastYearPayments,
      currentYear: currentYearBalance || computedCurrentYearPayments,
      total: (lastYearBalance || computedLastYearPayments) + (currentYearBalance || computedCurrentYearPayments)
    };
  };

  const parseStatementAmt = (val) => {
    const parsed = parseFloat(String(val || '').replace(/,/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getReceiptDate = (receipt) => {
    if (receipt?.createdAt) {
      const createdAt = new Date(receipt.createdAt);
      if (!Number.isNaN(createdAt.getTime())) return createdAt;
    }
    if (receipt?.chequeDate) {
      const chequeDate = new Date(receipt.chequeDate);
      if (!Number.isNaN(chequeDate.getTime())) return chequeDate;
    }
    return new Date();
  };

  const monthKeyToDate = (monthKey) => {
    const [monthName, yearSuffix] = monthKey.split('-');
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
    return new Date(2000 + Number(yearSuffix), monthIndex, 1);
  };

  const formatStatementDrCr = (amount) => {
    if (!amount) return '0';
    if (amount > 0) return `${amount.toLocaleString()} Dr`;
    return `${Math.abs(amount).toLocaleString()} Cr`;
  };

  const formatStatementDate = (date) => {
    if (!date) return '-';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const findDonorForStatement = (searchTerm) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return null;
    return donors.find((donor) =>
      donor.donorCode?.toLowerCase() === search ||
      donor._id === searchTerm.trim() ||
      donor.donorCode?.toLowerCase().includes(search) ||
      donor.name?.toLowerCase().includes(search)
    ) || null;
  };

  const buildDonorStatementLedger = (donor, categoryName, fromDateStr, toDateStr) => {
    const fromDate = new Date(fromDateStr);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(toDateStr);
    toDate.setHours(23, 59, 59, 999);
    const fromMonthStart = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const toMonthStart = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

    const monthlyDue = parseStatementAmt(
      categoryName ? getCategoryAmount(donor, categoryName) : donor.monthlyContribution
    );

    const donorReceipts = donorReceiptRecords
      .filter((receipt) => {
        const matchDonor = String(receipt.donorId).trim().toLowerCase() === String(donor.donorCode || '').trim().toLowerCase()
          || String(receipt.donorId).trim().toLowerCase() === String(donor._id || '').trim().toLowerCase();
        const matchCategory = !categoryName || receipt.category === categoryName;
        return matchDonor && matchCategory;
      })
      .sort((a, b) => getReceiptDate(a) - getReceiptDate(b));

    const startYear = 2026;
    const endYear = Math.max(toDate.getFullYear(), startYear);
    const allMonths = [];
    for (let year = startYear; year <= endYear; year++) {
      allMonths.push(...getStatementMonths(year));
    }

    const monthData = allMonths.map((monthKey) => ({
      key: monthKey,
      date: monthKeyToDate(monthKey),
      due: monthlyDue,
      paid: 0,
      balance: monthlyDue
    }));

    let monthIdx = 0;
    let monthBalance = monthlyDue;
    if (monthlyDue > 0) {
      for (const receipt of donorReceipts) {
        let remaining = parseStatementAmt(receipt.totalAmount);
        while (remaining > 0 && monthIdx < monthData.length) {
          const allocated = Math.min(remaining, monthBalance);
          if (allocated > 0) {
            monthData[monthIdx].paid += allocated;
            monthData[monthIdx].balance -= allocated;
            remaining -= allocated;
            monthBalance -= allocated;
          }
          if (monthBalance <= 0) {
            monthIdx += 1;
            monthBalance = monthlyDue;
          }
        }
      }
    }

    const fromYear = fromDate.getFullYear();
    const lastYear = fromYear - 1;
    let openingBalance = 0;
    let lastYearBalance = 0;
    let currentYearBalance = 0;

    monthData.forEach((month) => {
      if (month.date >= fromMonthStart) return;
      openingBalance += month.balance;
      if (month.date.getFullYear() <= lastYear) {
        lastYearBalance += month.balance;
      } else if (month.date.getFullYear() === fromYear) {
        currentYearBalance += month.balance;
      }
    });

    const entries = [{
      date: fromDate,
      receiptNo: '-',
      description: `Opening Balance (Last Year: LKR ${lastYearBalance.toLocaleString()} + Current Year: LKR ${currentYearBalance.toLocaleString()})`,
      debit: openingBalance,
      credit: 0,
      sortOrder: 0
    }];

    const debitsByYear = {};
    monthData.forEach((month) => {
      if (month.date >= fromMonthStart && month.date <= toMonthStart && monthlyDue > 0) {
        const year = month.date.getFullYear();
        if (!debitsByYear[year]) {
          debitsByYear[year] = { date: month.date, amount: 0 };
        }
        debitsByYear[year].amount += monthlyDue;
      }
    });

    Object.keys(debitsByYear).forEach((year) => {
      entries.push({
        date: debitsByYear[year].date,
        receiptNo: '-',
        description: `Jan to Dec ${year} Total Amount`,
        debit: debitsByYear[year].amount,
        credit: 0,
        sortOrder: 1
      });
    });

    donorReceipts.forEach((receipt) => {
      const receiptDate = getReceiptDate(receipt);
      if (receiptDate >= fromDate && receiptDate <= toDate) {
        entries.push({
          date: receiptDate,
          receiptNo: receipt.receiptNumber || '-',
          description: `${receiptDate.getFullYear()} Receipt – ${receipt.receiptNumber || 'N/A'}`,
          debit: 0,
          credit: parseStatementAmt(receipt.totalAmount),
          sortOrder: 2
        });
      }
    });

    entries.sort((a, b) => {
      const dateDiff = a.date - b.date;
      if (dateDiff !== 0) return dateDiff;
      return a.sortOrder - b.sortOrder;
    });

    let runningBalance = 0;
    const rows = entries.map((entry) => {
      runningBalance += entry.debit - entry.credit;
      return { ...entry, balance: runningBalance };
    });

    const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);
    const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);

    return {
      rows,
      totalDebit,
      totalCredit,
      closingBalance: totalDebit - totalCredit,
      openingBalance,
      lastYearBalance,
      currentYearBalance,
      monthlyDue
    };
  };

  const filteredDonorReports = donors.filter((donor) => {
    const search = drFilterSearch.trim().toLowerCase();
    const matchesSearch = search === '' ||
      donor.donorCode?.toLowerCase().includes(search) ||
      donor.name?.toLowerCase().includes(search) ||
      donor.route?.toLowerCase().includes(search) ||
      (donor.categories || []).some((cat) => cat.name?.toLowerCase().includes(search));
    const matchesRoute = drFilterRoute === '' || donor.routeId === drFilterRoute || donor.route === drFilterRoute;
    const matchesCategory = drFilterCategory === '' || (donor.categories || []).some((cat) => cat.name === drFilterCategory);
    const matchesStatus = drFilterStatus === '' || donor.status === drFilterStatus;
    const filterYear = drFilterYear === '' ? '' : String(drFilterYear);
    const yearSuffix = filterYear.slice(-2);
    const matchesYear = filterYear === '' ||
      (donor.createdAt && String(new Date(donor.createdAt).getFullYear()) === filterYear) ||
      Object.keys(donor.monthlyAmounts || {}).some((key) => key.endsWith(`-${yearSuffix}`)) ||
      Object.keys(donor.receipts || {}).some((key) => key.endsWith(`-${yearSuffix}`)) ||
      !!donor.monthlyContribution;
    return matchesSearch && matchesRoute && matchesCategory && matchesStatus && matchesYear;
  });

  const reportRoutes = Object.values(filteredDonorReports.reduce((acc, donor) => {
    const routeKey = donor.route || 'Unassigned';
    const routeId = donor.routeId || routeKey;
    if (!acc[routeId]) {
      acc[routeId] = { route: routeKey, donors: 0, totalAmount: 0 };
    }
    acc[routeId].donors += 1;
    acc[routeId].totalAmount += Number(donor.monthlyContribution) || 0;
    return acc;
  }, {}));

  const reportCategories = Object.values(filteredDonorReports.reduce((acc, donor) => {
    (donor.categories || []).forEach((category) => {
      const name = category?.name || 'Unassigned';
      const amount = Number(category?.amount) || 0;
      if (!acc[name]) {
        acc[name] = { category: name, donors: 0, totalAmount: 0 };
      }
      acc[name].donors += 1;
      acc[name].totalAmount += amount;
    });
    return acc;
  }, {}));

  const totalReportAmount = filteredDonorReports.reduce((sum, donor) => sum + (Number(donor.monthlyContribution) || 0), 0);

  const filteredInventoryItems = invItems.filter((item) => {
    const term = (itemSearchTerm || '').trim().toLowerCase();
    if (!term) return true;
    return String(item.code || '').toLowerCase().includes(term) || String(item.name || '').toLowerCase().includes(term);
  });

  const purchaseInvoiceTotal = (purchaseForm.lines || []).reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const purchaseDiscount = Number(purchaseForm.discount) || 0;
  const purchaseTotalAmount = purchaseInvoiceTotal - purchaseDiscount;

  const normalizePurchaseLines = () => {
    return (purchaseForm.lines || [])
      .filter((line) => {
        const itemName = String(line?.itemName || '').trim();
        const qty = Number(line.qty);
        const rate = Number(line.rate);
        const hasItem = Boolean(itemName);
        const hasQtyRate = !Number.isNaN(qty) && !Number.isNaN(rate) && qty > 0 && rate >= 0;
        return hasItem && hasQtyRate;
      })
      .map((line) => {
        const itemName = String(line?.itemName || '').trim();
        return {
          itemName,
          qty: Number(line.qty),
          rate: Number(line.rate),
          amount: Number(line.amount) || Number(line.qty) * Number(line.rate)
        };
      });
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      id: 'master-file',
      label: 'Master File',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: 'transaction',
      label: 'Transaction',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },  
    {
      id: 'reports',
      label: 'Reports',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },

    {
      id: 'users',
      label: 'Users',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">

      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300 ${isSidebarExpanded ? 'w-64' : 'w-20'
          }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
          {isSidebarExpanded ? (
            <div className="flex items-center gap-3 px-6 w-full whitespace-nowrap">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-purple-500/30">
                D
              </div>
              <span className="font-bold text-xl tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                DEENIYA
              </span>
            </div>
          ) : (
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-purple-500/30" title="Deeniya app">
              D
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === 'master-file' && activeTab.startsWith('master-')) || (item.id === 'reports' && activeTab.startsWith('report')) || (item.id === 'inventory' && activeTab === 'inventory');
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${isSidebarExpanded ? 'justify-start gap-4 px-4' : 'justify-center px-0'
                  } py-3 rounded-xl transition-all duration-200 font-medium ${isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                title={!isSidebarExpanded ? item.label : undefined}
              >
                <span className="text-xl shrink-0">{item.icon}</span>
                {isSidebarExpanded && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-900 text-xs text-slate-400 dark:text-slate-500 text-center">
          {isSidebarExpanded ? (
            <span className="whitespace-nowrap">v1.0.0 &copy; Deeniya App</span>
          ) : (
            <span>v1.0.0</span>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10 transition-colors duration-300">

          <div className="flex items-center gap-3">
            {/* Sidebar toggle button (Toggles expand/collapse instead of full hide) */}
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-all duration-200"
              title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <span className="text-xl">☰</span>
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-slate-400 dark:text-slate-500 text-sm">Pages</span>
              <span className="text-slate-400 dark:text-slate-500 text-sm">/</span>
              <span className="text-slate-800 dark:text-slate-200 text-sm font-semibold">{getHeaderLabel()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-all duration-200"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md shadow-indigo-600/20">
                A
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">Admin User</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">admin@gmail.com</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-slate-100/50 dark:bg-slate-900/40 p-8 transition-colors duration-300">

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              {/* Top Section: Welcome Card & Clock Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Welcome Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 border border-purple-200 dark:border-purple-500/20 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between shadow-xl">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-purple-600/10 blur-3xl rounded-full"></div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Welcome Back, Admin! 👋</h2>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed max-w-lg">
                      Manage donations, keep track of expenses, categorize funds, and generate transaction reports effortlessly. Your environment is fully synchronized.
                    </p>
                  </div>
                  <div className="mt-8 flex gap-4">
                    {/* <button onClick={() => setActiveTab('master-file')} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all text-sm">
                      Master Directory
                    </button>
                    <button onClick={() => setActiveTab('transaction')} className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 transition-all text-sm shadow-sm">
                      New Transaction */}
                    {/* </button> */}
                  </div>
                </div>

                {/* Digital Clock & Date */}
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
                  <div className="absolute left-0 bottom-0 w-32 h-32 bg-indigo-600/10 blur-2xl rounded-full"></div>
                  <span className="text-sm font-semibold tracking-wider text-purple-600 dark:text-purple-400 uppercase mb-2">Live System Time</span>
                  <div className="text-4xl md:text-5xl font-extrabold font-mono tracking-wider bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-400 bg-clip-text text-transparent mb-3 select-none">
                    {formattedTime}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {formattedDate}
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 hover:translate-y-[-4px] transition-all duration-300 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Total Donors</span>
                    <span className="text-2xl">👥</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">412</h3>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-2">▲ 8% increase this week</p>
                </div>
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 hover:translate-y-[-4px] transition-all duration-300 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Monthly Collections</span>
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">LKR 384,200</h3>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-2">▲ 14.2% vs last month</p>
                </div>
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 hover:translate-y-[-4px] transition-all duration-300 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Pending Verifications</span>
                    <span className="text-2xl">⏳</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">9</h3>
                  <p className="text-xs text-rose-500 dark:text-rose-400 mt-2">▼ Requires review</p>
                </div>
              </div> */}

              {/* Recent Activity List */}
              {/* <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm"> */}
              {/* <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3> */}
              <div className="space-y-6">
                {[
                  // { title: 'New Donor registered: Mohammed Rizwan', time: '10 mins ago', type: 'donor' },
                  // { title: 'Donation of LKR 25,000 recorded under Category: Madrasa Building Fund', time: '1 hour ago', type: 'tx' },
                  // { title: 'New Bank Master entry: Amana Bank Main Branch', time: '3 hours ago', type: 'bank' },
                ].map((act, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shadow-lg shadow-purple-500/80"></div>
                    <div>
                      <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">{act.title}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            // </div>
          )}

          {/* TAB: MASTER FILE (Dashboard directory for subpages) */}
          {activeTab === 'master-file' && (() => {
            const masterHubCards = [
              {
                id: 'master-donor',
                title: 'Donor Master',
                desc: 'Manage contact details, historical donations, and status files of active donors.',
                meta: `${donors.length} Donor${donors.length !== 1 ? 's' : ''} Registered`,
                color: 'purple',
                icon: (
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )
              },
              {
                id: 'master-item',
                title: 'Item Master',
                desc: 'Create and maintain inventory items used across purchase and issue workflows.',
                meta: `${invItems.length} Item${invItems.length !== 1 ? 's' : ''} Registered`,
                color: 'amber',
                icon: (
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )
              },
              {
                id: 'master-supplier',
                title: 'Supplier Master',
                desc: 'Create and maintain supplier records for purchase transactions and future auto-fill.',
                meta: `${suppliers.length} Supplier${suppliers.length !== 1 ? 's' : ''} Registered`,
                color: 'indigo',
                icon: (
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )
              },
              {
                id: 'master-expenses',
                title: 'Account Master File',
                desc: 'Configure account codes, descriptions, and categories.',
                meta: `${expenses.length} Account${expenses.length !== 1 ? 's' : ''}`,
                color: 'indigo',
                icon: (
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                id: 'master-category',
                title: 'Category Master',
                desc: 'Create, classify, and track specific donation targets, funds, and Sadaqah projects.',
                meta: `${categories.length} Target Project${categories.length !== 1 ? 's' : ''}`,
                color: 'pink',
                icon: (
                  <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                id: 'master-bank',
                title: 'Bank Master',
                desc: 'Register organization bank accounts, branch directories, and connection channels.',
                meta: `${banks.length} Linked Account${banks.length !== 1 ? 's' : ''}`,
                color: 'teal',
                icon: (
                  <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )
              },
              {
                id: 'master-company',
                title: 'Company Master',
                desc: 'Establish organizational profiles, registration details, and central branch mappings.',
                meta: `${companies.length} Profile${companies.length !== 1 ? 's' : ''} Mapped`,
                color: 'amber',
                icon: (
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                id: 'master-route',
                title: 'Route Master',
                desc: 'Manage transport or collection routes, associated areas, and operational statuses.',
                meta: `${routes.length} Active Route${routes.length !== 1 ? 's' : ''}`,
                color: 'blue',
                icon: (
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                )
              },
              {
                id: 'master-location',
                title: 'Location Master',
                desc: 'Create and manage storage or operational locations for inventory items.',
                meta: `${locations.length} Location${locations.length !== 1 ? 's' : ''}`,
                color: 'cyan',
                icon: (
                  <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              }
            ];

            const filteredCards = masterHubCards.filter(card =>
              card.title.toLowerCase().includes(masterSearch.toLowerCase()) ||
              card.desc.toLowerCase().includes(masterSearch.toLowerCase())
            );

            return (
              <div className="max-w-6xl mx-auto space-y-8 text-left">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-8 overflow-hidden shadow-xl border border-purple-500/20 text-white">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-3xl rounded-full"></div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Master Directory Control Room</h2>
                  <p className="text-purple-200 mt-2 max-w-xl text-sm leading-relaxed">
                    Access and manage fundamental databases of Deeniya. Set parameters, configure entities, bank listings, and profiles that power all donation processing services.
                  </p>

                  {/* Search Bar inside Hub */}
                  <div className="mt-6 max-w-md relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Search master registries..."
                      value={masterSearch}
                      onChange={(e) => setMasterSearch(e.target.value)}
                      className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/60 focus:border-white focus:bg-white/20 outline-none transition-all"
                    />
                    {masterSearch && (
                      <button
                        onClick={() => setMasterSearch('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white text-xs font-bold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards Grid */}
                {filteredCards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCards.map((card) => {
                      // Dynamic color settings
                      const colorMap = {
                        purple: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/30 text-purple-600 dark:text-purple-400',
                        indigo: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400',
                        pink: 'bg-pink-100 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800/30 text-pink-600 dark:text-pink-400',
                        teal: 'bg-teal-100 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800/30 text-teal-600 dark:text-teal-400',
                        amber: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/30 text-amber-600 dark:text-amber-400',
                        blue: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400',
                      };

                      return (
                        <div
                          key={card.id}
                          onClick={() => setActiveTab(card.id)}
                          className="group cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:translate-y-[-4px] hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${colorMap[card.color]}`}>
                              {card.icon}
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {card.title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                              {card.desc}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 pt-4">
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                              {card.meta}
                            </span>
                            <span className="text-purple-600 dark:text-purple-400 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-all duration-200">
                              Configure <span>→</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl">
                    <span className="text-4xl block mb-2">📂</span>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">No registries match your search</h3>
                    <p className="text-slate-400 text-sm mt-1">Try typing a different keyword or category.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: SUPPLIER MASTER */}
          {activeTab === 'master-supplier' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 text-left">
                    <button onClick={() => setActiveTab('master-file')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">← Back</button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Supplier Master</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage supplier records used by inventory purchases.</p>
                    </div>
                  </div>
                  <button onClick={() => { setEditingSupplierId(null); setSupplierForm({ name: '', address: '', telephone: '', email: '', status: 'Active' }); setIsSupplierModalOpen(true); }} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all text-sm">+ Add Supplier</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                        <th className="py-4 px-6 font-medium">Supplier Name</th>
                        <th className="py-4 px-6 font-medium">Address</th>
                        <th className="py-4 px-6 font-medium">Telephone</th>
                        <th className="py-4 px-6 font-medium">Status</th>
                        <th className="py-4 px-6 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                      {suppliers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-500">No suppliers found. Click “Add Supplier” to create one.</td>
                        </tr>
                      ) : (
                        suppliers.map((supplier) => (
                          <tr key={supplier._id}>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{supplier.name}</td>
                            <td className="py-4 px-6">{supplier.address || '-'}</td>
                            <td className="py-4 px-6">{supplier.telephone || '-'}</td>
                            <td className="py-4 px-6"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{supplier.status || 'Active'}</span></td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => { setSupplierForm({ name: supplier.name || '', address: supplier.address || '', telephone: supplier.telephone || '', email: supplier.email || '', status: supplier.status || 'Active' }); setEditingSupplierId(supplier._id); setIsSupplierModalOpen(true); }} className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={() => handleDeleteSupplier(supplier._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ITEM MASTER */}
          {activeTab === 'master-item' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 text-left">
                    <button onClick={() => setActiveTab('master-file')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">← Back</button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Item Master</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage inventory items used for purchase and issue transactions.</p>
                    </div>
                  </div>
                  <button onClick={() => { setEditingItemId(null); setItemForm({ code: '', name: '', unit: 'Pcs', category: '', location: '', currentStock: '', reorderLevel: '' }); setIsItemModalOpen(true); }} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-lg shadow-amber-600/30 transition-all text-sm">+ Add Item</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                        <th className="py-4 px-6 font-medium">Name</th>
                        <th className="py-4 px-6 font-medium">Unit</th>
                        <th className="py-4 px-6 font-medium">Location</th>
                        <th className="py-4 px-6 font-medium">Stock</th>
                        <th className="py-4 px-6 font-medium">Reorder</th>
                        <th className="py-4 px-6 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                      {invItems.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500">No items found. Click "Add Item" to create one.</td>
                        </tr>
                      ) : (
                        invItems.map((item) => (
                          <tr key={item._id}>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                            <td className="py-4 px-6">{item.unit || 'Pcs'}</td>
                            <td className="py-4 px-6">{item.location || '-'}</td>
                            <td className="py-4 px-6">{item.currentStock || 0}</td>
                            <td className="py-4 px-6">{item.reorderLevel || 0}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => { setItemForm({ code: item.code || '', name: item.name || '', unit: item.unit || 'Pcs', category: item.category || '', location: item.location || '', currentStock: item.currentStock || '', reorderLevel: item.reorderLevel || '' }); setEditingItemId(item._id); setIsItemModalOpen(true); }} className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={() => { if (window.confirm('Delete this item?')) { fetch(`http://localhost:5000/api/inventory/item/${item._id}`, { method: 'DELETE' }).then(() => fetch('http://localhost:5000/api/inventory/item').then(res => res.json()).then(setInvItems)); } }} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DONOR MASTER */}
          {activeTab === 'master-donor' && (
            <div className="w-full px-4 md:px-6">
              {/* Inline Donor Form */}
              {isDonorModalOpen && (
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{editingDonorId ? 'Edit Donor' : 'Add New Donor'}</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Fill in the details below to {editingDonorId ? 'update the' : 'create a new'} donor.</p>
                    </div>
                    <button onClick={closeDonorModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Route</label>
                      <select name="routeId" value={donorForm.routeId} onChange={handleDonorChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                        <option value="">Select Route</option>
                        {routes.map(route => (
                          <option key={route._id} value={route._id}>{route.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Donor ID</label>
                      <input type="text" name="donorCode" value={donorForm.donorCode} readOnly className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-all text-sm" placeholder="Auto generated when route is selected" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Donor Name</label>
                      <input type="text" name="name" value={donorForm.name} onChange={handleDonorChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Mohammed Rizwan" />
                    </div>
                    <div className="md:col-span-2 lg:col-span-1">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Address</label>
                      <input type="text" name="address" value={donorForm.address} onChange={handleDonorChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. 45 Mount Road, Colombo" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Email</label>
                      <input type="email" name="email" value={donorForm.email} onChange={handleDonorChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. donor@example.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Phone Number</label>
                      <input type="text" name="phone" value={donorForm.phone} onChange={handleDonorChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. +94 77 123 4567" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">WhatsApp Number</label>
                      <input type="text" name="whatsapp" value={donorForm.whatsapp} onChange={handleDonorChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. 0771234567" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Status</label>
                      <select name="status" value={donorForm.status} onChange={handleDonorChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Categories Section */}
                  <div className="mt-5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Categories & Monthly Contributions</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {donorForm.categories.map((cat, index) => (
                        <div key={index} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Category {index + 1}</p>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Name</label>
                            <select value={cat.name} onChange={(e) => updateDonorCategory(index, 'name', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                              <option value="">Select Category</option>
                              {categories.map(catOption => (
                                <option key={catOption._id} value={catOption.name}>{catOption.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Monthly Amount (LKR)</label>
                            <input type="text" value={cat.amount} onChange={(e) => updateDonorCategory(index, 'amount', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. 25000" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                    <button onClick={closeDonorModal} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm border border-slate-200 dark:border-slate-700">Cancel</button>
                    <button onClick={handleSaveDonor} className="px-6 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all text-sm">{editingDonorId ? 'Update Donor' : 'Save Donor'}</button>
                  </div>
                </div>
              )}

              {/* Donor Table */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 md:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 text-left">
                    <button onClick={() => setActiveTab('master-file')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">
                      ← Back
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Donor Registry</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and view all registered donors.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="http://localhost:5000/api/master/donor/template"
                      className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm inline-block"
                    >
                      Download Template
                    </a>
                    <button onClick={() => setDonorUploadModalOpen(true)} className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm">
                      Upload File
                    </button>
                    <button onClick={openAddDonorModal} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all text-sm">
                      + Add New Donor
                    </button>
                  </div>
                </div>

                {/* Filter Section */}
                <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Search</label>
                      <input
                        type="text"
                        placeholder="Code, Name, Phone, WhatsApp..."
                        value={donorSearchTerm}
                        onChange={(e) => setDonorSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-900 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Route</label>
                      <select
                        value={donorFilterRoute}
                        onChange={(e) => setDonorFilterRoute(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-900 dark:text-white text-sm"
                      >
                        <option value="">All Routes</option>
                        {routes.map(route => <option key={route._id} value={route._id}>{route.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Category</label>
                      <select
                        value={donorFilterCategory}
                        onChange={(e) => setDonorFilterCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-900 dark:text-white text-sm"
                      >
                        <option value="">All Categories</option>
                        {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => { setDonorSearchTerm(''); setDonorFilterRoute(''); setDonorFilterCategory(''); }}
                        className="w-full px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-all text-sm"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredDonors.length}</span> of <span className="font-semibold text-slate-900 dark:text-white">{donors.length}</span> donors
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                        <th className="py-4 px-6 font-medium">Code</th>
                        <th className="py-4 px-6 font-medium">Donor Name</th>
                        <th className="py-4 px-6 font-medium">Email</th>
                        <th className="py-4 px-6 font-medium">Address</th>
                        <th className="py-4 px-6 font-medium">Route</th>
                        <th className="py-4 px-6 font-medium">Categories</th>
                        <th className="py-4 px-6 font-medium">Monthly Contribution</th>
                        <th className="py-4 px-6 font-medium">Phone</th>
                        <th className="py-4 px-6 font-medium">WhatsApp</th>
                        <th className="py-4 px-6 font-medium">Status</th>
                        <th className="py-4 px-6 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                      {filteredDonors.length === 0 ? (
                        <tr>
                          <td colSpan="11" className="py-8 text-center text-slate-500">{donors.length === 0 ? 'No donors found. Click "Add New Donor" to create one.' : 'No donors match your filters. Try adjusting your search criteria.'}</td>
                        </tr>
                      ) : (
                        filteredDonors.map(donor => (
                          <tr key={donor._id}>
                            <td className="py-4 px-6 font-mono text-purple-600 dark:text-purple-400">{donor.donorCode}</td>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{donor.name}</td>
                            <td className="py-4 px-6">{donor.email || '-'}</td>
                            <td className="py-4 px-6">{donor.address}</td>
                            <td className="py-4 px-6">{donor.route || '-'}</td>
                            <td className="py-4 px-6 whitespace-pre-line">{(donor.categories && donor.categories.length > 0 ? donor.categories.map(cat => {
                              const name = typeof cat === 'string' ? cat : cat?.name;
                              const amount = typeof cat === 'string' ? '' : cat?.amount;
                              return name ? `${name}: ${amount || '0'}` : null;
                            }).filter(Boolean).join('\n') : donor.category) || '-'}</td>
                            <td className="py-4 px-6 text-purple-600 dark:text-purple-400 font-medium">{donor.monthlyContribution ? `${Number(donor.monthlyContribution).toLocaleString()} LKR` : '-'}</td>
                            <td className="py-4 px-6">{donor.phone || '-'}</td>
                            <td className="py-4 px-6">{donor.whatsapp || '-'}</td>
                            <td className="py-4 px-6">{donor.status || '-'}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEditDonor(donor)} className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={() => handleDeleteDonor(donor._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EXPENSES MASTER */}
          {activeTab === 'master-expenses' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 text-left">
                    <button onClick={() => setActiveTab('master-file')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">
                      ← Back
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Master File</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure account codes, descriptions, and categories.</p>
                    </div>
                  </div>
                  <button onClick={openAddExpenseModal} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all text-sm">
                    + Add Account
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                        <th className="py-4 px-6 font-medium">Code</th>
                        <th className="py-4 px-6 font-medium">Description</th>
                        <th className="py-4 px-6 font-medium">Category</th>
                        <th className="py-4 px-6 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-500">No accounts configured. Click "Add Account" to create one.</td>
                        </tr>
                      ) : (
                        expenses.map(expense => (
                          <tr key={expense._id}>
                            <td className="py-4 px-6 font-mono text-purple-600 dark:text-purple-400">{expense.code}</td>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{expense.description || expense.title || expense.desc}</td>
                            <td className="py-4 px-6">{expense.category || 'Expenses'}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEditExpense(expense)} className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={() => handleDeleteExpense(expense._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CATEGORY MASTER */}
          {activeTab === 'master-category' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 text-left">
                    <button onClick={() => setActiveTab('master-file')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">
                      ← Back
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Category Master</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure donation funds & classification targets.</p>
                    </div>
                  </div>
                  <button onClick={openAddCategoryModal} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all text-sm">
                    + Add New Category
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                        <th className="py-4 px-6 font-medium">Fund Name</th>
                        <th className="py-4 px-6 font-medium">Type</th>
                        <th className="py-4 px-6 font-medium">Description</th>
                        <th className="py-4 px-6 font-medium">Target Amount</th>
                        <th className="py-4 px-6 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                      {categories.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-500">No categories found. Click "Add New Category" to create one.</td>
                        </tr>
                      ) : (
                        categories.map(cat => (
                          <tr key={cat._id}>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{cat.name}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${cat.type === 'Capital' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' : 'bg-teal-500/10 text-teal-600 border border-teal-500/20'}`}>
                                {cat.type}
                              </span>
                            </td>
                            <td className="py-4 px-6">{cat.desc}</td>
                            <td className="py-4 px-6">{cat.target}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEditCategory(cat)} className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={() => handleDeleteCategory(cat._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ROUTE MASTER */}
          {activeTab === 'master-route' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 text-left">
                    <button onClick={() => setActiveTab('master-file')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">
                      ← Back
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Route Master</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure transport and collection routes.</p>
                    </div>
                  </div>
                  <button onClick={openAddRouteModal} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all text-sm">
                    + Add New Route
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                        <th className="py-4 px-6 font-medium">Route Name</th>
                        <th className="py-4 px-6 font-medium">Coverage Areas</th>
                        <th className="py-4 px-6 font-medium">Status</th>
                        <th className="py-4 px-6 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                      {routes.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-500">No routes found. Click "Add New Route" to create one.</td>
                        </tr>
                      ) : (
                        routes.map(route => (
                          <tr key={route._id}>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{route.name}</td>
                            <td className="py-4 px-6">{route.areas}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${route.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'}`}>
                                {route.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEditRoute(route)} className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={() => handleDeleteRoute(route._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LOCATION MASTER */}
          {activeTab === 'master-location' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 text-left">
                    <button onClick={() => setActiveTab('master-file')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">
                      ← Back
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Location Master</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create and manage storage or operational locations for inventory items.</p>
                    </div>
                  </div>
                  <button onClick={openAddLocationModal} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold shadow-lg shadow-cyan-600/30 transition-all text-sm">
                    + Add New Location
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                        <th className="py-4 px-6 font-medium">Location Name</th>
                        <th className="py-4 px-6 font-medium">Description</th>
                        <th className="py-4 px-6 font-medium">Status</th>
                        <th className="py-4 px-6 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                      {locations.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-500">No locations found. Click "Add New Location" to create one.</td>
                        </tr>
                      ) : (
                        locations.map(location => (
                          <tr key={location._id}>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{location.name}</td>
                            <td className="py-4 px-6">{location.description}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${location.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'}`}>
                                {location.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEditLocation(location)} className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={() => handleDeleteLocation(location._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BANK MASTER */}
          {activeTab === 'master-bank' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 text-left">
                    <button onClick={() => setActiveTab('master-file')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">
                      ← Back
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bank Master</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage institutional bank accounts.</p>
                    </div>
                  </div>
                  <button onClick={openAddBankModal} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all text-sm">
                    + Link Bank Account
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                        <th className="py-4 px-6 font-medium">Bank Name</th>
                        <th className="py-4 px-6 font-medium">Branch</th>
                        <th className="py-4 px-6 font-medium">Account Number</th>
                        <th className="py-4 px-6 font-medium">Status</th>
                        <th className="py-4 px-6 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                      {banks.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-500">No bank accounts linked. Click "Link Bank Account" to create one.</td>
                        </tr>
                      ) : (
                        banks.map(bank => (
                          <tr key={bank._id}>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{bank.name}</td>
                            <td className="py-4 px-6">{bank.branch}</td>
                            <td className="py-4 px-6 font-mono text-purple-600 dark:text-purple-400">{bank.accNo}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bank.status === 'Linked' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'}`}>
                                {bank.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEditBank(bank)} className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={() => handleDeleteBank(bank._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COMPANY MASTER */}
          {activeTab === 'master-company' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 text-left">
                    <button onClick={() => setActiveTab('master-file')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">
                      ← Back
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Company Master</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure company profiles & branch associations.</p>
                    </div>
                  </div>
                  <button type="button" onClick={openAddCompanyModal} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all text-sm">
                    + Add Company Branch
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                        <th className="py-4 px-6 font-medium">Company Name</th>
                        <th className="py-4 px-6 font-medium">Code</th>
                        <th className="py-4 px-6 font-medium">Reg Number</th>
                        <th className="py-4 px-6 font-medium">Address</th>
                        <th className="py-4 px-6 font-medium">Corporate Email</th>
                        <th className="py-4 px-6 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                      {companies.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-500">No companies found. Click "Add Company Branch" to create one.</td>
                        </tr>
                      ) : (
                        companies.map(company => (
                          <tr key={company._id}>
                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{company.name}</td>
                            <td className="py-4 px-6 font-mono text-indigo-600 dark:text-indigo-400">{company.code || '-'}</td>
                            <td className="py-4 px-6 font-mono text-purple-600 dark:text-purple-400">{company.regNo}</td>
                            <td className="py-4 px-6">{company.address}</td>
                            <td className="py-4 px-6 font-semibold">{company.email}</td>
                            <td className="py-4 px-6"><div className="flex items-center justify-center gap-2"><button onClick={() => handleEditCompany(company)} className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button><button onClick={() => handleDeleteCompany(company._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: REPORTS HUB */}
          {activeTab === 'reports' && (() => {
            const reportCategoriesList = [
              {
                id: 'report-donor',
                title: 'Donor Report',
                color: 'purple',
                icon: (
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                subReports: [
                  { id: 'all-statement', label: 'All Donor Statement' },
                  { id: 'route-wise', label: 'Route Wise Donor Report' },
                  { id: 'category-wise', label: 'Category Wise Donor Report' },
                  { id: 'donor-statement', label: 'Donor Statement' }
                ]
              },
              {
                id: 'report-general',
                title: 'General Report',
                color: 'indigo',
                icon: (
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                subReports: [
                  { id: 'day-book', label: 'Day Book' },
                  { id: 'statement-report', label: 'Statement Report' },
                  { id: 'donor-receipt-tx', label: 'Donor Receipt Transaction' },
                  { id: 'general-receipt-tx', label: 'General Receipt Transaction' },
                  { id: 'general-payment-tx', label: 'General Payment Transaction' },
                  { id: 'journal-tx', label: 'Journal Transaction' }
                ]
              },
              {
                id: 'report-purchase',
                title: 'Purchase Report',
                color: 'teal',
                icon: (
                  <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                ),
                subReports: [
                  { id: 'shop-outstanding', label: 'Shop Outstanding Report' },
                  { id: 'item-report', label: 'Item Report' },
                  { id: 'item-stock', label: 'Item Stock Report' },
                  { id: 'till-report', label: 'Till Report' },
                  { id: 'supplier-statement', label: 'Supplier Statement' }
                ]
              },
              {
                id: 'report-account',
                title: 'Account Report',
                color: 'amber',
                icon: (
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                ),
                subReports: [
                  { id: 'income-statement', label: 'Income Statement' },
                  { id: 'p-and-l', label: 'P & L' },
                  { id: 'whatsapp-report', label: 'WhatsApp Send Report' },
                  { id: 'pd-cheque', label: 'PD Cheque Report' }
                ]
              },
              {
                id: 'report-log',
                title: 'Log Report',
                color: 'pink',
                icon: (
                  <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
                subReports: [
                  { id: 'user-activity', label: 'User Activity Report' },
                  { id: 'user-log', label: 'User Log Report' }
                ]
              }
            ];

            const colorMap = {
              purple: 'border-purple-200 dark:border-purple-800/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10',
              indigo: 'border-indigo-200 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10',
              teal: 'border-teal-200 dark:border-teal-800/30 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/10',
              amber: 'border-amber-200 dark:border-amber-800/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10',
              pink: 'border-pink-200 dark:border-pink-800/30 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10',
            };
            const iconBgMap = {
              purple: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/30',
              indigo: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/30',
              teal: 'bg-teal-100 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800/30',
              amber: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/30',
              pink: 'bg-pink-100 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800/30',
            };

            const handleSubReportClick = (categoryId, subReportId) => {
              setActiveTab(categoryId);
              if (categoryId === 'report-donor') setDonorReportSubTab(subReportId);
              else if (categoryId === 'report-general') setGeneralReportSubTab(subReportId);
              else if (categoryId === 'report-purchase') setPurchaseReportSubTab(subReportId);
              else if (categoryId === 'report-account') setAccountReportSubTab(subReportId);
              else if (categoryId === 'report-log') setLogReportSubTab(subReportId);
            };

            return (
              <div className="max-w-7xl mx-auto space-y-8 text-left">
                <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-3xl p-8 overflow-hidden shadow-xl border border-indigo-500/20 text-white">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 blur-3xl rounded-full"></div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Report Dashboard</h2>
                  <p className="text-indigo-200 mt-2 max-w-2xl text-sm leading-relaxed">
                    Access detailed analytical reports separated by category. Click any sub-report below to view it directly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {reportCategoriesList.map(category => (
                    <div
                      key={category.id}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${iconBgMap[category.color]}`}>
                          {category.icon}
                        </div>
                        <h3 className="font-bold text-xl text-slate-900 dark:text-white">{category.title}</h3>
                      </div>
                      <div className="space-y-2 flex-1">
                        {category.subReports.map((sub, idx) => (
                          <button
                            key={sub.id}
                            onClick={() => handleSubReportClick(category.id, sub.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl border border-transparent transition-all duration-200 flex items-center justify-between group ${colorMap[category.color].replace('border-', 'hover:border-')}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 group-hover:text-current">{sub.label}</span>
                            </div>
                            <span className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all text-sm font-bold">→</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* TAB: DONOR REPORT */}
          {activeTab === 'report-donor' && (
            <div className="w-full space-y-4">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <button onClick={() => { setActiveTab('reports'); setAsReportReady(false); setDsReportReady(false); setAsFilterCategory(''); setAsFilterYear(String(new Date().getFullYear())); setDsFilterSearch(''); setDsFilterCategory(''); }} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">← Back</button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Donor Report</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">All Donor Statement, Route Wise Donor Report, Category Wise Donor Report, and Donor Statement.</p>
                    </div>
                  </div>
                  <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all text-sm">⬇ Export</button>
                </div>

                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    // { id: 'all-statement', label: 'All Donor Statement' },
                    // { id: 'route-wise', label: 'Route Wise Donor Report' },
                    // { id: 'category-wise', label: 'Category Wise Donor Report' },
                    // { id: 'donor-statement', label: 'Donor Statement' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDonorReportSubTab(tab.id)}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${donorReportSubTab === tab.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Search</label>
                      <input
                        type="text"
                        placeholder="Donor code, name, route, category..."
                        value={drFilterSearch}
                        onChange={(e) => setDrFilterSearch(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Route</label>
                      <select
                        value={drFilterRoute}
                        onChange={(e) => setDrFilterRoute(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      >
                        <option value="">All Routes</option>
                        {routes.map((route) => <option key={route._id} value={route._id}>{route.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Category</label>
                      <select
                        value={drFilterCategory}
                        onChange={(e) => setDrFilterCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Status</label>
                      <select
                        value={drFilterStatus}
                        onChange={(e) => setDrFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Year</label>
                      <select
                        value={drFilterYear}
                        onChange={(e) => setDrFilterYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      >
                        <option value="">All Years</option>
                        {availableYears.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 text-right">
                    <button
                      onClick={() => {
                        setDrFilterSearch('');
                        setDrFilterRoute('');
                        setDrFilterCategory('');
                        setDrFilterStatus('');
                        setDrFilterYear('');
                      }}
                      className="px-4 py-2 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-sm font-semibold transition-all"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div> */}

                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">Filtered Donors</p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{filteredDonorReports.length}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Active Donors</p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{filteredDonorReports.filter((d) => d.status === 'Active').length}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">Monthly Amount Total</p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalReportAmount.toLocaleString()}</p>
                  </div>
                </div> */}

                {donorReportSubTab === 'all-statement' && (() => {
                  const parseAmt = (val) => { const p = parseFloat(String(val || '').replace(/,/g, '')); return isNaN(p) ? 0 : p; };
                  const asMonths = getStatementMonths(asFilterYear);

                  // Donors filtered by the selected category (and route/status/search from sidebar filters)
                  const asDonors = donors.filter(d => {
                    const hasCat = !asFilterCategory || (d.categories || []).some(c => c.name === asFilterCategory);
                    const matchSearch = drFilterSearch === '' ||
                      d.donorCode?.toLowerCase().includes(drFilterSearch.toLowerCase()) ||
                      d.name?.toLowerCase().includes(drFilterSearch.toLowerCase());
                    const matchRoute = drFilterRoute === '' || d.routeId === drFilterRoute || d.route === drFilterRoute;
                    const matchStatus = drFilterStatus === '' || d.status === drFilterStatus;
                    return hasCat && matchSearch && matchRoute && matchStatus;
                  });

                  const allocateDonorReceipts = (donor, categoryName) => {
                    const monthlyDue = parseAmt(categoryName ? getCategoryAmount(donor, categoryName) : donor.monthlyContribution);
                    const receipts = donorReceiptRecords.filter(r => {
                      const matchDonor = String(r.donorId).trim().toLowerCase() === String(donor.donorCode || '').trim().toLowerCase()
                        || String(r.donorId).trim().toLowerCase() === String(donor._id || '').trim().toLowerCase();
                      const matchCat = !categoryName || r.category === categoryName;
                      return matchDonor && matchCat;
                    }).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

                    const startYear = 2026;
                    const endYear = Number(asFilterYear) || new Date().getFullYear();
                    const allMonths = [];
                    for (let y = startYear; y <= endYear; y++) {
                      allMonths.push(...getStatementMonths(y));
                    }

                    const allocations = {};
                    allMonths.forEach(m => allocations[m] = { paid: 0, receipts: new Set() });

                    let currentMonthIdx = 0;
                    let currentMonthBalance = monthlyDue;

                    if (monthlyDue > 0) {
                      for (const r of receipts) {
                        let rAmt = parseAmt(r.totalAmount);
                        while (rAmt > 0 && currentMonthIdx < allMonths.length) {
                          const mKey = allMonths[currentMonthIdx];
                          const toAllocate = Math.min(rAmt, currentMonthBalance);
                          if (toAllocate > 0) {
                            allocations[mKey].paid += toAllocate;
                            allocations[mKey].receipts.add(r.receiptNumber);
                            rAmt -= toAllocate;
                            currentMonthBalance -= toAllocate;
                          }
                          if (currentMonthBalance <= 0) {
                            currentMonthIdx++;
                            currentMonthBalance = monthlyDue;
                          }
                        }
                      }
                    }
                    
                    for (const m in allocations) {
                      allocations[m].receipts = Array.from(allocations[m].receipts).join(', ');
                    }
                    return allocations;
                  };

                  const reportData = asReportReady ? asDonors.map(donor => {
                    const catAmt = asFilterCategory ? parseAmt(getCategoryAmount(donor, asFilterCategory)) : parseAmt(donor.monthlyContribution);
                    const totalContrib = catAmt * 12;
                    const allocations = allocateDonorReceipts(donor, asFilterCategory);
                    let totalPaid = 0;
                    const monthPaids = asMonths.map(m => {
                      const p = allocations[m] ? allocations[m].paid : 0;
                      totalPaid += p;
                      return p;
                    });
                    const receipts = asMonths.map(m => allocations[m] ? allocations[m].receipts : '');
                    return { donor, catAmt, totalContrib, totalPaid, monthPaids, receipts };
                  }) : [];

                  // totals
                  let grandTotalContribution = 0;
                  let grandTotalPaid = 0;
                  const grandTotalByMonth = asMonths.map(() => 0);

                  reportData.forEach(row => {
                    grandTotalContribution += row.totalContrib;
                    grandTotalPaid += row.totalPaid;
                    row.monthPaids.forEach((amt, i) => {
                      grandTotalByMonth[i] += amt;
                    });
                  });

                  if (!asReportReady) {
                    // Filter selection page
                    return (
                      <div className="flex flex-col items-center justify-center py-16 space-y-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">All Donor Statement</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Select the Category and Year to generate the report</p>
                        </div>
                        <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Category</label>
                            <select
                              value={asFilterCategory}
                              onChange={e => setAsFilterCategory(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                              <option value="">All Categories</option>
                              {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Year</label>
                            <select
                              value={asFilterYear}
                              onChange={e => setAsFilterYear(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          <button
                            onClick={() => setAsReportReady(true)}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all"
                          >
                            View Report →
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Report view
                  return (
                    <div className="report-print">
                      {/* Report header bar */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl px-5 py-3">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setAsReportReady(false)}
                            className="no-print text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            ← Change Filters
                          </button>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Category: <span className="text-purple-600 dark:text-purple-400">{asFilterCategory || 'All'}</span>
                            &nbsp;|&nbsp; Year: <span className="text-purple-600 dark:text-purple-400">{asFilterYear}</span>
                            &nbsp;|&nbsp; Donors: <span className="text-purple-600 dark:text-purple-400">{asDonors.length}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <ReportExportButtons tableId="all-statement-table" filename="All_Donor_Statement" />
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="Search donor..."
                            value={drFilterSearch}
                            onChange={e => setDrFilterSearch(e.target.value)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          />
                          <select value={drFilterStatus} onChange={e => setDrFilterStatus(e.target.value)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none">
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table id="all-statement-table" className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                              <th className="py-2.5 px-3 font-semibold whitespace-nowrap sticky left-0 bg-slate-100 dark:bg-slate-900 z-10">#</th>
                              <th className="py-2.5 px-3 font-semibold whitespace-nowrap sticky left-6 bg-slate-100 dark:bg-slate-900 z-10">Donor ID</th>
                              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Route</th>
                              <th className="py-2.5 px-3 font-semibold min-w-[130px]">Donor Name</th>
                              <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Monthly Amt</th>
                              {asMonths.map(m => (
                                <React.Fragment key={m}>
                                  <th className="py-2.5 px-2 font-semibold whitespace-nowrap text-center bg-indigo-50 dark:bg-indigo-900/20">{m.split('-')[0]}</th>
                                  <th className="py-2.5 px-2 font-semibold whitespace-nowrap text-center bg-indigo-50/60 dark:bg-indigo-900/10 text-indigo-500">Rcpt</th>
                                </React.Fragment>
                              ))}
                              <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">Total Paid</th>
                              <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">Total Contrib.</th>
                              <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                            {reportData.length === 0 ? (
                              <tr><td colSpan={5 + asMonths.length * 2 + 3} className="py-10 text-center text-slate-400">No donors found for the selected filters.</td></tr>
                            ) : reportData.map((row, idx) => {
                              const { donor, catAmt, totalContrib, totalPaid, monthPaids, receipts } = row;
                              const balance = totalContrib - totalPaid;
                              return (
                                <tr key={donor._id || `donor-row-${idx}`} className={`hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors ${donor.status === 'Inactive' ? 'opacity-60' : ''}`}>
                                  <td className="py-2 px-3 text-slate-400 sticky left-0 bg-white dark:bg-slate-950 z-10">{idx + 1}</td>
                                  <td className="py-2 px-3 font-mono text-purple-600 dark:text-purple-400 sticky left-6 bg-white dark:bg-slate-950 z-10">{donor.donorCode}</td>
                                  <td className="py-2 px-3">{donor.route || '-'}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{donor.name}</td>
                                  <td className="py-2 px-3 text-center font-semibold text-slate-800 dark:text-slate-200">{catAmt > 0 ? catAmt.toLocaleString() : '-'}</td>
                                  {asMonths.map((m, mi) => (
                                    <React.Fragment key={m}>
                                      <td className="py-2 px-2 text-center bg-indigo-50/30 dark:bg-indigo-900/10 font-medium text-slate-800 dark:text-slate-200">
                                        {monthPaids[mi] > 0 ? monthPaids[mi].toLocaleString() : <span className="text-slate-300 dark:text-slate-700">—</span>}
                                      </td>
                                      <td className="py-2 px-2 text-center text-indigo-500 dark:text-indigo-400 font-mono text-[10px]">
                                        {receipts[mi] || <span className="text-slate-300 dark:text-slate-700">—</span>}
                                      </td>
                                    </React.Fragment>
                                  ))}
                                  <td className="py-2 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10">{totalPaid.toLocaleString()}</td>
                                  <td className="py-2 px-3 text-center font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-900/10">{totalContrib.toLocaleString()}</td>
                                  <td className="py-2 px-3 text-center font-bold bg-rose-50/30 dark:bg-rose-900/10" style={{ color: balance > 0 ? '#e11d48' : '#16a34a' }}>{balance.toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {reportData.length > 0 && (
                            <tfoot>
                              <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 border-t-2 border-slate-300 dark:border-slate-700">
                                <td className="py-3 px-3" colSpan={5}>TOTAL ({reportData.length} Donors)</td>
                                {asMonths.map((m, mi) => (
                                  <React.Fragment key={m}>
                                    <td className="py-3 px-2 text-center bg-indigo-100/50 dark:bg-indigo-900/20">
                                      {grandTotalByMonth[mi].toLocaleString()}
                                    </td>
                                    <td className="py-3 px-2 bg-indigo-100/30 dark:bg-indigo-900/10"></td>
                                  </React.Fragment>
                                ))}
                                <td className="py-3 px-3 text-center text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/20">{grandTotalPaid.toLocaleString()}</td>
                                <td className="py-3 px-3 text-center text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/20">{grandTotalContribution.toLocaleString()}</td>
                                <td className="py-3 px-3 text-center bg-rose-100/50 dark:bg-rose-900/20" style={{ color: (grandTotalContribution - grandTotalPaid) > 0 ? '#e11d48' : '#16a34a' }}>
                                  {(grandTotalContribution - grandTotalPaid).toLocaleString()}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {donorReportSubTab === 'route-wise' && (() => {
                  if (!rwReportReady) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 space-y-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Route Wise Donor Report</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Select the Route and Year to generate the report</p>
                        </div>
                        <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Route</label>
                            <select
                              value={rwFilterRoute}
                              onChange={e => setRwFilterRoute(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                              <option value="">Select Route</option>
                              {routes.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Category</label>
                            <select
                              value={rwFilterCategory}
                              onChange={e => setRwFilterCategory(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                              <option value="">All Categories</option>
                              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Year</label>
                            <select
                              value={rwFilterYear}
                              onChange={e => setRwFilterYear(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          <button
                            onClick={() => {
                              if(!rwFilterRoute) { alert('Please select a route'); return; }
                              setRwReportReady(true)
                            }}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all"
                          >
                            View Report →
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const rwDonors = donors.filter(d => {
                    const matchRoute = d.route === rwFilterRoute || d.routeId === rwFilterRoute;
                    const matchCategory = rwFilterCategory === '' || (d.categories || []).some(c => c.name === rwFilterCategory);
                    return matchRoute && matchCategory;
                  });
                  let grandTotalYearAmount = 0;
                  let grandTotalBalance = 0;
                  let grandTotalPaid = 0;

                  const reportData = rwDonors.map(donor => {
                    const donorReceipts = donorReceiptRecords
                      .filter((receipt) => {
                        const matchDonor = String(receipt.donorId).trim().toLowerCase() === String(donor.donorCode || '').trim().toLowerCase()
                          || String(receipt.donorId).trim().toLowerCase() === String(donor._id || '').trim().toLowerCase();
                        const matchCat = rwFilterCategory === '' || receipt.category === rwFilterCategory;
                        return matchDonor && matchCat && getReceiptDate(receipt).getFullYear() === Number(rwFilterYear);
                      })
                      .sort((a, b) => getReceiptDate(b) - getReceiptDate(a)); // desc

                    const lastReceipt = donorReceipts.length > 0 ? donorReceipts[0] : null;
                    const lastPaidAmount = lastReceipt ? parseStatementAmt(lastReceipt.totalAmount) : 0;
                    const lastPaidDate = lastReceipt ? formatStatementDate(getReceiptDate(lastReceipt)) : '-';
                    const lastReceiptNo = lastReceipt ? lastReceipt.receiptNumber : '-';

                    let totalYearAmount = 0;
                    let totalPaid = 0;
                    let balanceAmount = 0;
                    let catTexts = [];

                    (donor.categories || []).forEach(cat => {
                       if (rwFilterCategory !== '' && cat.name !== rwFilterCategory) return;
                       const catAmt = parseStatementAmt(cat.amount);
                       if (catAmt > 0) {
                         const yearlyCatAmt = catAmt * 12;
                         totalYearAmount += yearlyCatAmt;
                         catTexts.push(`${cat.name} ${yearlyCatAmt.toLocaleString()}/-`);
                       }
                    });
                    
                    if (totalYearAmount === 0 && parseStatementAmt(donor.monthlyContribution) > 0 && (rwFilterCategory === '' || rwFilterCategory === 'General')) {
                        const catAmt = parseStatementAmt(donor.monthlyContribution);
                        const yearlyCatAmt = catAmt * 12;
                        totalYearAmount += yearlyCatAmt;
                        catTexts.push(`General ${yearlyCatAmt.toLocaleString()}/-`);
                    }

                    donorReceipts.forEach(r => totalPaid += parseStatementAmt(r.totalAmount));
                    balanceAmount = totalYearAmount - totalPaid;

                    grandTotalYearAmount += totalYearAmount;
                    grandTotalPaid += totalPaid;
                    grandTotalBalance += balanceAmount;

                    return {
                      donor,
                      categoryText: catTexts.join(', '),
                      totalYearAmount,
                      balanceAmount,
                      lastPaidAmount,
                      lastPaidDate,
                      lastReceiptNo
                    };
                  });

                  return (
                    <div className="report-print">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl px-5 py-3">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setRwReportReady(false)}
                            className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            ← Change Filters
                          </button>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Route: <span className="text-purple-600 dark:text-purple-400">{rwFilterRoute}</span>
                            &nbsp;|&nbsp; Category: <span className="text-purple-600 dark:text-purple-400">{rwFilterCategory || 'All'}</span>
                            &nbsp;|&nbsp; Year: <span className="text-purple-600 dark:text-purple-400">{rwFilterYear}</span>
                            &nbsp;|&nbsp; Donors: <span className="text-purple-600 dark:text-purple-400">{rwDonors.length}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <ReportExportButtons tableId="route-wise-table" filename="Route_Wise_Report" />
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table id="route-wise-table" className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Donor ID</th>
                              <th className="py-2.5 px-3 font-semibold min-w-[150px]">Donor Name</th>
                              <th className="py-2.5 px-3 font-semibold min-w-[150px]">Address</th>
                              <th className="py-2.5 px-3 font-semibold min-w-[150px]">Category (Yearly)</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Total Amt ({rwFilterYear})</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Balance Amt</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Last Paid Amt</th>
                              <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Last Paid Date</th>
                              <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-center">Receipt No</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                            {reportData.length === 0 ? (
                              <tr><td colSpan="9" className="py-10 text-center text-slate-400">No donors found for this route.</td></tr>
                            ) : reportData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                                <td className="py-2 px-3 font-mono text-purple-600 dark:text-purple-400">{row.donor.donorCode}</td>
                                <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{row.donor.name}</td>
                                <td className="py-2 px-3">{row.donor.address || '-'}</td>
                                <td className="py-2 px-3">{row.categoryText || '-'}</td>
                                <td className="py-2 px-3 text-right font-semibold text-amber-700 dark:text-amber-400">{row.totalYearAmount.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right font-bold" style={{ color: row.balanceAmount > 0 ? '#e11d48' : '#16a34a' }}>{row.balanceAmount.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{row.lastPaidAmount > 0 ? row.lastPaidAmount.toLocaleString() : '-'}</td>
                                <td className="py-2 px-3 text-center">{row.lastPaidDate}</td>
                                <td className="py-2 px-3 text-center font-mono text-indigo-500 text-[10px]">{row.lastReceiptNo}</td>
                              </tr>
                            ))}
                          </tbody>
                          {reportData.length > 0 && (
                            <tfoot>
                              <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 border-t-2 border-slate-300 dark:border-slate-700">
                                <td className="py-3 px-3 uppercase text-right" colSpan="4">TOTAL</td>
                                <td className="py-3 px-3 text-right text-amber-700 dark:text-amber-400">{grandTotalYearAmount.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right" style={{ color: grandTotalBalance > 0 ? '#e11d48' : '#16a34a' }}>{grandTotalBalance.toLocaleString()}</td>
                                <td className="py-3 px-3" colSpan="3"></td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {donorReportSubTab === 'category-wise' && (
                  <div className="report-print">
                    <div className="flex justify-end mb-4">
                      <ReportExportButtons tableId="category-wise-table" filename="Category_Wise_Report" />
                    </div>
                    <div className="overflow-x-auto">
                      <table id="category-wise-table" className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                          <th className="py-3 px-4 font-medium">Category</th>
                          <th className="py-3 px-4 font-medium">Donors</th>
                          <th className="py-3 px-4 font-medium">Total Category Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                        {reportCategories.length === 0 ? (
                          <tr><td colSpan="3" className="py-8 text-center">No category data available for the selected filters.</td></tr>
                        ) : reportCategories.map((category, index) => (
                          <tr key={`${category.category}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{category.category}</td>
                            <td className="py-3 px-4">{category.donors}</td>
                            <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{category.totalAmount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {donorReportSubTab === 'donor-statement' && (() => {
                  const matchedDonor = dsReportReady ? findDonorForStatement(dsFilterSearch) : null;
                  const statement = matchedDonor
                    ? buildDonorStatementLedger(matchedDonor, dsFilterCategory, dsFilterFromDate, dsFilterToDate)
                    : null;

                  if (!dsReportReady) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 space-y-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Donor Statement Report</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Filter by date range, donor, and category to generate the statement</p>
                        </div>
                        <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">From Date</label>
                              <input
                                type="date"
                                value={dsFilterFromDate}
                                onChange={(e) => setDsFilterFromDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">To Date</label>
                              <input
                                type="date"
                                value={dsFilterToDate}
                                onChange={(e) => setDsFilterToDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Donor ID or Name</label>
                            <input
                              type="text"
                              list="donor-search-list"
                              value={dsFilterSearch}
                              onChange={(e) => setDsFilterSearch(e.target.value)}
                              placeholder="Enter donor code or name"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            />
                            <datalist id="donor-search-list">
                              {donors.map(d => (
                                <option key={d._id} value={d.donorCode}>{d.name} ({d.donorCode})</option>
                              ))}
                            </datalist>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Category</label>
                            <select
                              value={dsFilterCategory}
                              onChange={(e) => setDsFilterCategory(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                              <option value="">All Categories</option>
                              {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                            </select>
                          </div>
                          <button
                            onClick={() => {
                              if (!dsFilterFromDate || !dsFilterToDate) {
                                alert('Please select both From Date and To Date.');
                                return;
                              }
                              if (new Date(dsFilterFromDate) > new Date(dsFilterToDate)) {
                                alert('From Date cannot be later than To Date.');
                                return;
                              }
                              if (!dsFilterSearch.trim()) {
                                alert('Please enter a Donor ID or Name.');
                                return;
                              }
                              if (!findDonorForStatement(dsFilterSearch)) {
                                alert('No matching donor found. Please check the Donor ID or Name.');
                                return;
                              }
                              setDsReportReady(true);
                            }}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all"
                          >
                            View Report →
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (!matchedDonor || !statement) {
                    return (
                      <div className="text-center py-16 text-slate-400">
                        <p className="text-lg font-semibold">No donor found for the selected filters.</p>
                        <button onClick={() => setDsReportReady(false)} className="mt-4 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">← Change Filters</button>
                      </div>
                    );
                  }

                  return (
                    <div className="report-print">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl px-5 py-3">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setDsReportReady(false)}
                            className="no-print text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            ← Change Filters
                          </button>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {matchedDonor.donorCode} · {matchedDonor.name}
                            &nbsp;|&nbsp; {formatStatementDate(new Date(dsFilterFromDate))} – {formatStatementDate(new Date(dsFilterToDate))}
                            &nbsp;|&nbsp; Category: <span className="text-purple-600 dark:text-purple-400">{dsFilterCategory || 'All'}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                          <span>Monthly Due: <span className="font-semibold text-slate-900 dark:text-white">LKR {statement.monthlyDue.toLocaleString()}</span></span>
                          <ReportExportButtons tableId="donor-statement-table" filename="Donor_Statement" />
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table id="donor-statement-table" className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                              <th className="py-3 px-4 font-semibold whitespace-nowrap">Date</th>
                              <th className="py-3 px-4 font-semibold whitespace-nowrap">Receipt No</th>
                              <th className="py-3 px-4 font-semibold min-w-[260px]">Description</th>
                              <th className="py-3 px-4 font-semibold whitespace-nowrap text-right">Debit</th>
                              <th className="py-3 px-4 font-semibold whitespace-nowrap text-right">Credit</th>
                              <th className="py-3 px-4 font-semibold whitespace-nowrap text-right">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                            {statement.rows.length === 0 ? (
                              <tr><td colSpan="6" className="py-10 text-center text-slate-400">No statement entries found for the selected period.</td></tr>
                            ) : statement.rows.map((row, idx) => (
                              <tr key={`${row.receiptNo}-${row.description}-${idx}`} className={`hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors ${idx === 0 ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}>
                                <td className="py-3 px-4 whitespace-nowrap">{formatStatementDate(row.date)}</td>
                                <td className="py-3 px-4 font-mono text-purple-600 dark:text-purple-400">{row.receiptNo}</td>
                                <td className="py-3 px-4">{row.description}</td>
                                <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                                  {row.debit > 0 ? row.debit.toLocaleString() : '—'}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                  {row.credit > 0 ? row.credit.toLocaleString() : '—'}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                                  {formatStatementDrCr(row.balance)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                              <td colSpan="3" className="py-3 px-4 text-right uppercase text-xs tracking-wide text-slate-500 dark:text-slate-400">Summary</td>
                              <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">{statement.totalDebit.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">{statement.totalCredit.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right">{formatStatementDrCr(statement.closingBalance)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                        <div className="rounded-2xl border border-rose-200 dark:border-rose-800/30 bg-rose-50 dark:bg-rose-900/20 p-4">
                          <p className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400 mb-1">Total Debit</p>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">LKR {statement.totalDebit.toLocaleString()}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Donor outstanding amount</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/20 p-4">
                          <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 mb-1">Total Credit</p>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">LKR {statement.totalCredit.toLocaleString()}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Donor paid amount</p>
                        </div>
                        <div className="rounded-2xl border border-purple-200 dark:border-purple-800/30 bg-purple-50 dark:bg-purple-900/20 p-4">
                          <p className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400 mb-1">Balance</p>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatStatementDrCr(statement.closingBalance)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Opening: {formatStatementDrCr(statement.openingBalance)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB: GENERAL REPORT */}
          {activeTab === 'report-general' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setActiveTab('reports')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">← Back</button>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">General Report</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Overall financial activity summary.</p>
                  </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                  {[
                    { id: 'day-book', label: 'Day Book' },
                    { id: 'statement-report', label: 'Statement Report' },
                    { id: 'donor-receipt-tx', label: 'Donor Receipt Tx' },
                    { id: 'general-receipt-tx', label: 'General Receipt Tx' },
                    { id: 'general-payment-tx', label: 'General Payment Tx' },
                    { id: 'journal-tx', label: 'Journal Tx' },
                  ].map(sub => (
                    <button key={sub.id} onClick={() => setGeneralReportSubTab(sub.id)}
                      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${generalReportSubTab === sub.id ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}>
                      {sub.label}
                    </button>
                  ))}
                </div>

                {generalReportSubTab === 'statement-report' && <StatementReport expenses={expenses} />}
                {generalReportSubTab === 'day-book' && <DayBook />}
                {generalReportSubTab === 'donor-receipt-tx' && <DonorReceiptReport />}
                {generalReportSubTab === 'general-receipt-tx' && <GeneralReceiptReport />}
                {generalReportSubTab === 'general-payment-tx' && <GeneralPaymentReport />}
                {generalReportSubTab === 'journal-tx' && <JournalReport />}
              </div>
            </div>
          )}

          {/* TAB: PURCHASE REPORT */}
          {activeTab === 'report-purchase' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setActiveTab('reports')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">← Back</button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{purchaseReportSubTab === 'shop-outstanding' ? 'Shop Outstanding Report' : purchaseReportSubTab === 'till-report' ? 'Till Report' : purchaseReportSubTab === 'item-stock' ? 'Item Stock Report' : purchaseReportSubTab === 'supplier-statement' ? 'Supplier Statement' : 'Item Report'}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{purchaseReportSubTab === 'shop-outstanding' ? 'Supplier-wise outstanding balance summary.' : purchaseReportSubTab === 'till-report' ? 'Till issue and collection details.' : purchaseReportSubTab === 'item-stock' ? 'Item-wise stock summary with purchase and issue details.' : purchaseReportSubTab === 'supplier-statement' ? 'Full supplier statement with Dr/Cr and running balance.' : 'Purchase item details with issue tracking.'}</p>
                  </div>
                </div>

                {purchaseReportSubTab === 'shop-outstanding' && <ShopOutstandingReport suppliers={suppliers} purchases={purchases} companies={companies} />}
                {purchaseReportSubTab === 'item-report' && <ItemReport purchases={purchases} gins={gins} />}
                {purchaseReportSubTab === 'item-stock' && <ItemStockReport purchases={purchases} gins={gins} />}
                {purchaseReportSubTab === 'till-report' && <TillReport tills={tills} donors={donors} routes={routes} />}
                {purchaseReportSubTab === 'supplier-statement' && <SupplierStatement />}
              </div>
            </div>
          )}

          {/* TAB: ACCOUNT REPORT */}
          {activeTab === 'report-account' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {accountReportSubTab === 'pd-cheque' ? (
                <div className="report-print bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setActiveTab('reports')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">← Back</button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">PD Cheque Report</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Donor receipts paid via cheque.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Received Date From</label>
                      <input type="date" value={pdReceivedDateFrom} onChange={e => setPdReceivedDateFrom(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Received Date To</label>
                      <input type="date" value={pdReceivedDateTo} onChange={e => setPdReceivedDateTo(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Deposit Date From</label>
                      <input type="date" value={pdDepositDateFrom} onChange={e => setPdDepositDateFrom(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Deposit Date To</label>
                      <input type="date" value={pdDepositDateTo} onChange={e => setPdDepositDateTo(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Donor ID / Name</label>
                      <input type="text" value={pdDonorSearch} onChange={e => setPdDonorSearch(e.target.value)} placeholder="Search donor..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cheque Number</label>
                      <input type="text" value={pdChequeSearch} onChange={e => setPdChequeSearch(e.target.value)} placeholder="Search cheque..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <ReportExportButtons tableId="pd-cheque-table" filename="PD_Cheque_Report" />
                    <table id="pd-cheque-table" className="w-full mt-4 text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                          <th className="py-3 px-4 font-semibold">Receipt Date</th>
                          <th className="py-3 px-4 font-semibold">Receipt Number</th>
                          <th className="py-3 px-4 font-semibold">Donor ID</th>
                          <th className="py-3 px-4 font-semibold">Donor Name</th>
                          <th className="py-3 px-4 font-semibold">Category</th>
                          <th className="py-3 px-4 font-semibold">Cheque Date</th>
                          <th className="py-3 px-4 font-semibold">Cheque Number</th>
                          <th className="py-3 px-4 font-semibold text-right">Cheque Amount</th>
                          <th className="py-3 px-4 font-semibold">Deposit Date</th>
                          <th className="py-3 px-4 font-semibold">Deposit Account</th>
                          <th className="py-3 px-4 font-semibold">Return Reason</th>
                          <th className="py-3 px-4 font-semibold">Return Date</th>
                          <th className="py-3 px-4 font-semibold text-center">Status</th>
                          <th className="py-3 px-4 font-semibold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                        {(() => {
                          let chequeReceipts = donorReceiptRecords.filter(r => r.paymentMode === 'Cheque');
                          // Apply filters
                          if (pdReceivedDateFrom) chequeReceipts = chequeReceipts.filter(r => r.createdAt && new Date(r.createdAt).toISOString().slice(0,10) >= pdReceivedDateFrom);
                          if (pdReceivedDateTo) chequeReceipts = chequeReceipts.filter(r => r.createdAt && new Date(r.createdAt).toISOString().slice(0,10) <= pdReceivedDateTo);
                          if (pdDepositDateFrom) chequeReceipts = chequeReceipts.filter(r => r.depositDate && r.depositDate >= pdDepositDateFrom);
                          if (pdDepositDateTo) chequeReceipts = chequeReceipts.filter(r => r.depositDate && r.depositDate <= pdDepositDateTo);
                          if (pdDonorSearch) {
                            const term = pdDonorSearch.toLowerCase();
                            chequeReceipts = chequeReceipts.filter(r => (r.donorId && r.donorId.toLowerCase().includes(term)) || (r.donorName && r.donorName.toLowerCase().includes(term)));
                          }
                          if (pdChequeSearch) {
                            const term = pdChequeSearch.toLowerCase();
                            chequeReceipts = chequeReceipts.filter(r => r.chequeNumber && r.chequeNumber.toLowerCase().includes(term));
                          }
                          if (chequeReceipts.length === 0) {
                            return <tr><td colSpan="14" className="py-8 text-center text-slate-400">No cheque receipts found.</td></tr>;
                          }
                          return chequeReceipts.map((r, idx) => (
                            <tr key={r._id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{r.receiptNumber}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.donorId || '-'}</td>
                              <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{r.donorName}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.category || '-'}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.chequeDate || '-'}</td>
                              <td className="py-3 px-4 font-mono text-slate-900 dark:text-white font-semibold">
                                {r.chequeNumber ? (() => {
                                  const ch = r.chequeNumber.replace(/-/g, '');
                                  if (ch.length >= 13) return `${ch.slice(0,6)}-${ch.slice(6,10)}-${ch.slice(10,13)}`;
                                  if (ch.length >= 10) return `${ch.slice(0,6)}-${ch.slice(6,10)}`;
                                  return r.chequeNumber;
                                })() : '-'}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">LKR {Number(r.totalAmount?.replace(/,/g, '') || 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.depositDate || '-'}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.depositAccount || '-'}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.returnReason || '-'}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.returnDate || '-'}</td>
                              <td className="py-3 px-4 text-center">{r.deposited ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">Deposited</span> : <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">Pending</span>}</td>
                              <td className="py-3 px-4 text-center">
                                <button onClick={() => { setPdReturnModal(r); setPdReturnForm({ returnReason: r.returnReason || '', returnDate: r.returnDate || '' }); }} className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline">Update Return</button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Return Update Modal */}
                  {pdReturnModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Update Return Details</h3>
                          <button onClick={() => setPdReturnModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        <div className="p-6 space-y-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Cheque: {pdReturnModal.chequeNumber} · {pdReturnModal.donorName} · LKR {Number(pdReturnModal.totalAmount?.replace(/,/g, '') || 0).toLocaleString()}
                          </p>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Return Reason</label>
                            <input type="text" value={pdReturnForm.returnReason} onChange={e => setPdReturnForm({ ...pdReturnForm, returnReason: e.target.value })} placeholder="e.g. Insufficient funds" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-amber-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Return Date</label>
                            <input type="date" value={pdReturnForm.returnDate} onChange={e => setPdReturnForm({ ...pdReturnForm, returnDate: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-amber-500" />
                          </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex gap-3 justify-end">
                          <button onClick={async () => {
                            try {
                              const res = await fetch(`http://localhost:5000/api/receipt/${pdReturnModal._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ returnReason: pdReturnForm.returnReason, returnDate: pdReturnForm.returnDate })
                              });
                              if (!res.ok) throw new Error(await res.text());
                              setDonorReceiptRecords(prev => prev.map(r => r._id === pdReturnModal._id ? { ...r, returnReason: pdReturnForm.returnReason, returnDate: pdReturnForm.returnDate } : r));
                              setPdReturnModal(null);
                            } catch (err) { alert('Error: ' + err.message); }
                          }} className="rounded-xl bg-amber-600 px-5 py-2 font-semibold text-white shadow-lg shadow-amber-600/30 transition-all hover:bg-amber-700 text-sm">Save</button>
                          <button onClick={() => setPdReturnModal(null)} className="rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all text-sm">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="report-print bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setActiveTab('reports')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">← Back</button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Report</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Bank accounts, balances and ledger status.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">Linked Accounts</p>
                      <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{banks.filter(b => b.status === 'Linked').length}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Unlinked Accounts</p>
                      <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{banks.filter(b => b.status !== 'Linked').length}</p>
                    </div>
                    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/30 rounded-2xl p-5">
                      <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase mb-1">Total Accounts</p>
                      <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{banks.length}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                          <th className="py-3 px-4 font-medium">Bank Name</th>
                          <th className="py-3 px-4 font-medium">Branch</th>
                          <th className="py-3 px-4 font-medium">Account No.</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                        {banks.length === 0 ? (
                          <tr><td colSpan="4" className="py-8 text-center text-slate-400">No bank accounts registered.</td></tr>
                        ) : banks.map(b => (
                          <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{b.name}</td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{b.branch || '-'}</td>
                            <td className="py-3 px-4 font-mono text-purple-600 dark:text-purple-400">{b.accNo || '-'}</td>
                            <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${b.status === 'Linked' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>{b.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: LOG REPORT */}
          {activeTab === 'report-log' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setActiveTab('reports')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">← Back</button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Log Report</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">System audit trail and user activity logs.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { action: 'Donor record created', user: 'Admin', time: 'Just now', type: 'create' },
                    { action: 'Master Data fetched on login', user: 'Admin', time: '1 min ago', type: 'read' },
                    { action: 'System initialized', user: 'System', time: 'Session start', type: 'system' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${log.type === 'create' ? 'bg-emerald-500' : log.type === 'read' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{log.action}</p>
                        <p className="text-xs text-slate-400 mt-0.5">by <span className="font-semibold">{log.user}</span> · {log.time}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${log.type === 'create' ? 'bg-emerald-500/10 text-emerald-600' : log.type === 'read' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-500/10 text-slate-500'}`}>{log.type.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: TRANSACTION */}
          {activeTab === 'transaction' && (
            <div className="max-w-7xl mx-auto space-y-6">
              {transactionView === 'dashboard' ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl">
                    <h2 className="text-3xl font-extrabold">Transaction Dashboard</h2>
                    <p className="mt-2 text-purple-100 max-w-2xl">Open the module you need to record receipts, payments, journal entries, and related transaction workflows.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                      {
                        id: 'donor-receipt',
                        title: 'Donor Receipt',
                        description: 'Record donor income with category, outstanding details, print and WhatsApp options.',
                        accent: 'from-emerald-500 to-teal-600'
                      },
                      {
                        id: 'general-receipt',
                        title: 'General Receipt',
                        description: 'Capture miscellaneous incoming funds and supporting references.',
                        accent: 'from-sky-500 to-blue-600'
                      },
                      {
                        id: 'general-payment',
                        title: 'General Payment',
                        description: 'Enter expense and payment vouchers with clear accounting entries.',
                        accent: 'from-amber-500 to-orange-600'
                      },
                      {
                        id: 'general-journal',
                        title: 'General Journal',
                        description: 'Post non-standard accounting journals with narration and supporting notes.',
                        accent: 'from-fuchsia-500 to-violet-600'
                      }
                    ].map((module) => (
                      <button
                        key={module.id}
                        onClick={() => setTransactionView(module.id)}
                        className="text-left bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:-translate-y-1 hover:border-purple-500 transition-all"
                      >
                        <div className={`inline-flex rounded-2xl bg-gradient-to-r ${module.accent} px-3 py-2 text-sm font-semibold text-white shadow-lg`}>{module.title}</div>
                        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{module.description}</p>
                        <div className="mt-6 text-sm font-semibold text-purple-600 dark:text-purple-400">Open module →</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : transactionView === 'donor-receipt' ? (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                      <div className="text-left">
                        <button onClick={() => setTransactionView('dashboard')} className="mb-4 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900">← Back to Dashboard</button>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Donor Receipt</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create a donor receipt, review outstanding balances month-wise, and print or share it instantly.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="xl:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="relative" ref={donorReceiptDropdownRef}>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Donor ID</label>
                            <input
                              type="text"
                              placeholder="Type to search donor..."
                              value={donorReceiptSearch || donorReceiptForm.donorId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDonorReceiptSearch(val);
                                setDonorReceiptDropdownOpen(true);
                                setDonorReceiptHighlightIndex(-1);
                                if (val === '') {
                                  handleDonorReceiptChange({ target: { name: 'donorId', value: '' } });
                                }
                              }}
                              onFocus={() => { setDonorReceiptDropdownOpen(true); setDonorReceiptHighlightIndex(-1); }}
                              onKeyDown={(e) => {
                                const q = (donorReceiptSearch || '').toLowerCase();
                                const filtered = donors.filter(d => {
                                  if (!q) return true;
                                  return (d.donorCode || '').toLowerCase().includes(q)
                                    || (d.name || '').toLowerCase().includes(q)
                                    || (d.phone || '').toLowerCase().includes(q)
                                    || (d.whatsapp || '').toLowerCase().includes(q);
                                });
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setDonorReceiptHighlightIndex(i => i < filtered.length - 1 ? i + 1 : 0);
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setDonorReceiptHighlightIndex(i => i > 0 ? i - 1 : filtered.length - 1);
                                } else if (e.key === 'Enter' && donorReceiptDropdownOpen) {
                                  e.preventDefault();
                                  if (donorReceiptHighlightIndex >= 0 && donorReceiptHighlightIndex < filtered.length) {
                                    const selected = filtered[donorReceiptHighlightIndex];
                                    handleDonorReceiptChange({ target: { name: 'donorId', value: selected.donorCode } });
                                    setDonorReceiptSearch('');
                                    setDonorReceiptDropdownOpen(false);
                                    setDonorReceiptHighlightIndex(-1);
                                  }
                                } else if (e.key === 'Escape') {
                                  setDonorReceiptDropdownOpen(false);
                                  setDonorReceiptHighlightIndex(-1);
                                }
                              }}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-purple-500 outline-none"
                            />
                            {donorReceiptDropdownOpen && (() => {
                              const q = (donorReceiptSearch || '').toLowerCase();
                              const filtered = donors.filter(d => {
                                if (!q) return true;
                                return (d.donorCode || '').toLowerCase().includes(q)
                                  || (d.name || '').toLowerCase().includes(q)
                                  || (d.phone || '').toLowerCase().includes(q)
                                  || (d.whatsapp || '').toLowerCase().includes(q);
                              });
                              return (
                                <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                                  {filtered.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No donors found</div>
                                  ) : (
                                    filtered.map((donor, idx) => (
                                      <div
                                        key={donor._id}
                                        ref={idx === donorReceiptHighlightIndex ? el => el && el.scrollIntoView({ block: 'nearest' }) : undefined}
                                        onClick={() => {
                                          handleDonorReceiptChange({ target: { name: 'donorId', value: donor.donorCode } });
                                          setDonorReceiptSearch('');
                                          setDonorReceiptDropdownOpen(false);
                                          setDonorReceiptHighlightIndex(-1);
                                        }}
                                        onMouseEnter={() => setDonorReceiptHighlightIndex(idx)}
                                        className={`px-4 py-2.5 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors ${idx === donorReceiptHighlightIndex ? 'bg-purple-100 dark:bg-slate-800' : 'hover:bg-purple-50 dark:hover:bg-slate-800'}`}
                                      >
                                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{donor.donorCode}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{donor.name}{donor.phone ? ` · ${donor.phone}` : ''}</div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Receipt Number</label>
                            <input
                              type="text"
                              name="receiptNumber"
                              value={donorReceiptForm.receiptNumber}
                              onChange={handleDonorReceiptChange}
                              placeholder="Enter receipt number"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Date</label>
                            <input
                              type="date"
                              name="receiptDate"
                              value={donorReceiptForm.receiptDate}
                              onChange={handleDonorReceiptChange}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-purple-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Donor Name</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{donorReceiptForm.donorName || 'Auto-filled from donor ID'}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Route</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{donorReceiptForm.route || '—'}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Address</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{donorReceiptForm.address || 'Address will appear once a matching donor ID is entered.'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Category</label>
                            <select
                              name="category"
                              value={donorReceiptForm.category}
                              onChange={handleDonorReceiptChange}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-purple-500 outline-none"
                            >
                              <option value="">Select category</option>
                              {donorReceiptCategoryOptions.map((category) => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Total Received Amount</label>
                            <input
                              type="number"
                              name="totalAmount"
                              value={donorReceiptForm.totalAmount}
                              onChange={handleDonorReceiptChange}
                              placeholder="0"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-purple-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Receipt Type</label>
                            <select
                              name="paymentMode"
                              value={donorReceiptForm.paymentMode}
                              onChange={handleDonorReceiptChange}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-purple-500 outline-none"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Cheque">Cheque</option>
                            </select>
                          </div>
                          {donorReceiptForm.paymentMode === 'Cheque' && (
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Cheque Date</label>
                              <input
                                type="date"
                                name="chequeDate"
                                value={donorReceiptForm.chequeDate}
                                onChange={handleDonorReceiptChange}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-purple-500 outline-none"
                              />
                            </div>
                          )}
                        </div>

                        {donorReceiptForm.paymentMode === 'Cheque' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Cheque Number</label>
                              <input
                                type="text"
                                maxLength="6"
                                value={donorReceiptForm.chequeNumber.split('-')[0] || ''}
                                onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  const rest = donorReceiptForm.chequeNumber.split('-').slice(1);
                                  const combined = [val, ...(rest.length >= 2 ? rest : ['', ''])].join('-');
                                  setDonorReceiptForm({ ...donorReceiptForm, chequeNumber: combined });
                                }}
                                placeholder="XXXXXX"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-purple-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Bank Code</label>
                              <input
                                type="text"
                                maxLength="4"
                                value={donorReceiptForm.chequeNumber.split('-')[1] || ''}
                                onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                  const parts = donorReceiptForm.chequeNumber.split('-');
                                  const combined = [parts[0] || '', val, parts[2] || ''].join('-');
                                  setDonorReceiptForm({ ...donorReceiptForm, chequeNumber: combined });
                                }}
                                placeholder="XXXX"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-purple-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Branch Code</label>
                              <input
                                type="text"
                                maxLength="3"
                                value={donorReceiptForm.chequeNumber.split('-')[2] || ''}
                                onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                                  const parts = donorReceiptForm.chequeNumber.split('-');
                                  const combined = [parts[0] || '', parts[1] || '', val].join('-');
                                  setDonorReceiptForm({ ...donorReceiptForm, chequeNumber: combined });
                                }}
                                placeholder="XXX"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-purple-500 outline-none"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <button onClick={handleSaveDonorReceipt} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all text-sm">Save & Print Receipt</button>
                          <button onClick={() => handleSendWhatsAppReceipt()} className="px-5 py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-semibold text-sm">Send WhatsApp Message</button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Outstanding Summary</h3>
                            <select
                              value={outstandingSummaryYear}
                              onChange={e => setOutstandingSummaryYear(e.target.value)}
                              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                              {Array.from({ length: 5 }, (_, i) => String(2026 + i)).map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Month-wise FIFO allocation for the selected year.</p>
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                  <th className="py-2 pr-3 font-medium">Month</th>
                                  <th className="py-2 pr-3 font-medium">Due</th>
                                  <th className="py-2 pr-3 font-medium">Received</th>
                                  <th className="py-2 font-medium">Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getDonorReceiptOutstandingRows().map((row) => (
                                  <tr key={row.month} className={`border-b border-slate-200/70 dark:border-slate-800/80 ${row.balance === 0 ? 'bg-emerald-50/40 dark:bg-emerald-900/10' : ''}`}>
                                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-300 font-medium">{row.month}</td>
                                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">LKR {row.due.toLocaleString()}</td>
                                    <td className={`py-2 pr-3 font-semibold ${row.received > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>LKR {row.received.toLocaleString()}</td>
                                    <td className={`py-2 font-bold ${row.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>LKR {row.balance.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>


                      </div>
                    </div>
                  </div>
                </div>
              ) : transactionView === 'general-receipt' ? (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                      <div className="text-left">
                        <button onClick={() => setTransactionView('dashboard')} className="mb-4 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900">← Back to Dashboard</button>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">General Receipt</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Record a credit entry from an account master, with cash or cheque payment reference.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="xl:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Receipt Number</label>
                            <input type="text" value={generalReceiptForm.receiptNumber} readOnly className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Date</label>
                            <input type="date" value={generalReceiptForm.date} onChange={e => setGeneralReceiptForm({ ...generalReceiptForm, date: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                          </div>
                        </div>

                        <div className="relative" ref={grAccountDropdownRef}>
                          <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Account ID</label>
                          <input
                            type="text"
                            placeholder="Type to search account..."
                            value={grAccountSearch || generalReceiptForm.accountId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGrAccountSearch(val);
                              setGrAccountDropdownOpen(true);
                              setGrAccountHighlightIndex(-1);
                              if (val === '') {
                                setGeneralReceiptForm({ ...generalReceiptForm, accountId: '', accountName: '' });
                              }
                            }}
                            onFocus={() => { setGrAccountDropdownOpen(true); setGrAccountHighlightIndex(-1); }}
                            onKeyDown={(e) => {
                              const q = (grAccountSearch || '').toLowerCase();
                              const filtered = expenses.filter(ac => {
                                if (!q) return true;
                                return (ac.code || '').toLowerCase().includes(q)
                                  || (ac.description || '').toLowerCase().includes(q);
                              });
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setGrAccountHighlightIndex(i => i < filtered.length - 1 ? i + 1 : 0);
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setGrAccountHighlightIndex(i => i > 0 ? i - 1 : filtered.length - 1);
                              } else if (e.key === 'Enter' && grAccountDropdownOpen) {
                                e.preventDefault();
                                if (grAccountHighlightIndex >= 0 && grAccountHighlightIndex < filtered.length) {
                                  const selected = filtered[grAccountHighlightIndex];
                                  setGeneralReceiptForm({ ...generalReceiptForm, accountId: selected.code, accountName: selected.description });
                                  setGrAccountSearch('');
                                  setGrAccountDropdownOpen(false);
                                  setGrAccountHighlightIndex(-1);
                                }
                              } else if (e.key === 'Escape') {
                                setGrAccountDropdownOpen(false);
                                setGrAccountHighlightIndex(-1);
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none"
                          />
                          {grAccountDropdownOpen && (() => {
                            const q = (grAccountSearch || '').toLowerCase();
                            const filtered = expenses.filter(ac => {
                              if (!q) return true;
                              return (ac.code || '').toLowerCase().includes(q)
                                || (ac.description || '').toLowerCase().includes(q);
                            });
                            return (
                              <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                                {filtered.length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No accounts found</div>
                                ) : (
                                  filtered.map((ac, idx) => (
                                    <div
                                      key={ac._id}
                                      ref={idx === grAccountHighlightIndex ? el => el && el.scrollIntoView({ block: 'nearest' }) : undefined}
                                      onClick={() => {
                                        setGeneralReceiptForm({ ...generalReceiptForm, accountId: ac.code, accountName: ac.description });
                                        setGrAccountSearch('');
                                        setGrAccountDropdownOpen(false);
                                        setGrAccountHighlightIndex(-1);
                                      }}
                                      onMouseEnter={() => setGrAccountHighlightIndex(idx)}
                                      className={`px-4 py-2.5 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors ${idx === grAccountHighlightIndex ? 'bg-sky-100 dark:bg-slate-800' : 'hover:bg-sky-50 dark:hover:bg-slate-800'}`}
                                    >
                                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ac.code}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">{ac.description}</div>
                                    </div>
                                  ))
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Account Name</label>
                          <input type="text" value={generalReceiptForm.accountName} readOnly placeholder="Auto-filled from account code" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200" />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Description</label>
                          <input type="text" value={generalReceiptForm.description} onChange={e => setGeneralReceiptForm({ ...generalReceiptForm, description: e.target.value })} placeholder="Enter description" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Payment Mode</label>
                            <select value={generalReceiptForm.paymentMode} onChange={e => setGeneralReceiptForm({ ...generalReceiptForm, paymentMode: e.target.value, chequeNumber: '', chequeDate: '' })} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none">
                              <option value="Cash">Cash</option>
                              <option value="Cheque">Cheque</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Amount</label>
                            <input type="number" value={generalReceiptForm.amount} onChange={e => setGeneralReceiptForm({ ...generalReceiptForm, amount: e.target.value })} placeholder="0" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                          </div>
                        </div>

                        {generalReceiptForm.paymentMode === 'Cheque' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Cheque Date</label>
                              <input type="date" value={generalReceiptForm.chequeDate} onChange={e => setGeneralReceiptForm({ ...generalReceiptForm, chequeDate: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                            </div>
                          </div>
                        )}

                        {generalReceiptForm.paymentMode === 'Cheque' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Cheque Number</label>
                              <input type="text" maxLength="6" value={generalReceiptForm.chequeNumber.split('-')[0] || ''} onChange={e => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                const rest = generalReceiptForm.chequeNumber.split('-').slice(1);
                                const combined = [val, ...(rest.length >= 2 ? rest : ['', ''])].join('-');
                                setGeneralReceiptForm({ ...generalReceiptForm, chequeNumber: combined });
                              }} placeholder="XXXXXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Bank Code</label>
                              <input type="text" maxLength="4" value={generalReceiptForm.chequeNumber.split('-')[1] || ''} onChange={e => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                const parts = generalReceiptForm.chequeNumber.split('-');
                                const combined = [parts[0] || '', val, parts[2] || ''].join('-');
                                setGeneralReceiptForm({ ...generalReceiptForm, chequeNumber: combined });
                              }} placeholder="XXXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Branch Code</label>
                              <input type="text" maxLength="3" value={generalReceiptForm.chequeNumber.split('-')[2] || ''} onChange={e => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                                const parts = generalReceiptForm.chequeNumber.split('-');
                                const combined = [parts[0] || '', parts[1] || '', val].join('-');
                                setGeneralReceiptForm({ ...generalReceiptForm, chequeNumber: combined });
                              }} placeholder="XXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <button onClick={async () => {
                            const { receiptNumber, date, accountId, accountName, amount } = generalReceiptForm;
                            if (!receiptNumber || !accountId || !accountName || !amount || !date) {
                              alert('Please fill all required fields: Receipt Number, Date, Account ID, Account Name, and Amount.');
                              return;
                            }
                            try {
                              const res = await fetch('http://localhost:5000/api/general-receipt', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(generalReceiptForm)
                              });
                              if (!res.ok) throw new Error(await res.text());
                              const saved = await res.json();
                              setGeneralReceiptRecords(prev => [saved, ...prev]);
                              resetGeneralReceiptForm();
                              alert('General receipt saved successfully.');
                            } catch (err) {
                              alert('Error saving general receipt: ' + err.message);
                            }
                          }} className="rounded-xl bg-sky-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-700">Save Receipt</button>
                          <button onClick={resetGeneralReceiptForm} className="rounded-xl border border-slate-200 dark:border-slate-800 px-6 py-2.5 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">Reset</button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Saved Receipts</h3>
                          {generalReceiptRecords.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No general receipts saved yet.</p>
                          ) : (
                            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                              {generalReceiptRecords.map((receipt) => (
                                <div key={receipt._id || receipt.receiptNumber} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{receipt.accountName}</p>
                                    <span className="text-xs text-sky-600 dark:text-sky-400">{receipt.receiptNumber}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{receipt.description || receipt.accountId} · {receipt.paymentMode}</p>
                                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-2">LKR {Number(receipt.amount?.replace(/,/g, '') || 0).toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : transactionView === 'general-payment' ? (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                      <div className="text-left">
                        <button onClick={() => setTransactionView('dashboard')} className="mb-4 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900">← Back to Dashboard</button>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">General Payment</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Record a debit entry from an account master, with cash or cheque payment reference.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Payment Form */}
                      <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-5">New Payment Entry</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Payment Number</label>
                            <input type="text" value={generalPaymentForm.paymentNumber} readOnly className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Date</label>
                            <input type="date" value={generalPaymentForm.date} onChange={e => setGeneralPaymentForm({ ...generalPaymentForm, date: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                          </div>
                          <div className="relative" ref={gpAccountDropdownRef}>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Account ID</label>
                            <input
                              type="text"
                              placeholder="Type to search account..."
                              value={gpAccountSearch || generalPaymentForm.accountId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGpAccountSearch(val);
                                setGpAccountDropdownOpen(true);
                                setGpAccountHighlightIndex(-1);
                                if (val === '') {
                                  setGeneralPaymentForm({ ...generalPaymentForm, accountId: '', accountName: '' });
                                }
                              }}
                              onFocus={() => { setGpAccountDropdownOpen(true); setGpAccountHighlightIndex(-1); }}
                              onKeyDown={(e) => {
                                const q = (gpAccountSearch || '').toLowerCase();
                                const filtered = expenses.filter(ac => {
                                  if (!q) return true;
                                  return (ac.code || '').toLowerCase().includes(q)
                                    || (ac.description || '').toLowerCase().includes(q);
                                });
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setGpAccountHighlightIndex(i => i < filtered.length - 1 ? i + 1 : 0);
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setGpAccountHighlightIndex(i => i > 0 ? i - 1 : filtered.length - 1);
                                } else if (e.key === 'Enter' && gpAccountDropdownOpen) {
                                  e.preventDefault();
                                  if (gpAccountHighlightIndex >= 0 && gpAccountHighlightIndex < filtered.length) {
                                    const selected = filtered[gpAccountHighlightIndex];
                                    setGeneralPaymentForm({ ...generalPaymentForm, accountId: selected.code, accountName: selected.description });
                                    setGpAccountSearch('');
                                    setGpAccountDropdownOpen(false);
                                    setGpAccountHighlightIndex(-1);
                                  }
                                } else if (e.key === 'Escape') {
                                  setGpAccountDropdownOpen(false);
                                  setGpAccountHighlightIndex(-1);
                                }
                              }}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none"
                            />
                            {gpAccountDropdownOpen && (() => {
                              const q = (gpAccountSearch || '').toLowerCase();
                              const filtered = expenses.filter(ac => {
                                if (!q) return true;
                                return (ac.code || '').toLowerCase().includes(q)
                                  || (ac.description || '').toLowerCase().includes(q);
                              });
                              return (
                                <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                                  {filtered.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No accounts found</div>
                                  ) : (
                                    filtered.map((ac, idx) => (
                                      <div
                                        key={ac._id}
                                        ref={idx === gpAccountHighlightIndex ? el => el && el.scrollIntoView({ block: 'nearest' }) : undefined}
                                        onClick={() => {
                                          setGeneralPaymentForm({ ...generalPaymentForm, accountId: ac.code, accountName: ac.description });
                                          setGpAccountSearch('');
                                          setGpAccountDropdownOpen(false);
                                          setGpAccountHighlightIndex(-1);
                                        }}
                                        onMouseEnter={() => setGpAccountHighlightIndex(idx)}
                                        className={`px-4 py-2.5 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors ${idx === gpAccountHighlightIndex ? 'bg-sky-100 dark:bg-slate-800' : 'hover:bg-sky-50 dark:hover:bg-slate-800'}`}
                                      >
                                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ac.code}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{ac.description}</div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Account Name</label>
                            <input type="text" value={generalPaymentForm.accountName} readOnly placeholder="Auto-filled from account code" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Description</label>
                            <input type="text" value={generalPaymentForm.description} onChange={e => setGeneralPaymentForm({ ...generalPaymentForm, description: e.target.value })} placeholder="Enter description" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Deposit Type</label>
                            <select value={generalPaymentForm.depositType} onChange={e => {
                              const val = e.target.value;
                              setGeneralPaymentForm({ ...generalPaymentForm, depositType: val, depositedReceiptId: '', chequeNumber: '', chequeDate: '', bankName: '', amount: '' });
                            }} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none">
                              <option value="Normal">Normal</option>
                              <option value="Chq Deposit">Chq Deposit</option>
                            </select>
                          </div>
                          {generalPaymentForm.depositType === 'Chq Deposit' && (
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Select Cheque</label>
                              <select value={generalPaymentForm.depositedReceiptId} onChange={e => {
                                const id = e.target.value;
                                const receipt = donorReceiptRecords.find(r => r._id === id);
                                if (receipt) {
                                  setGeneralPaymentForm(prev => ({
                                    ...prev,
                                    depositedReceiptId: id,
                                    description: `Chq Deposit – ${receipt.donorName} (${receipt.receiptNumber})`,
                                    paymentMode: 'Cheque',
                                    amount: receipt.totalAmount ? String(receipt.totalAmount).replace(/,/g, '') : '',
                                    chequeNumber: receipt.chequeNumber || '',
                                    chequeDate: receipt.chequeDate || '',
                                    bankName: receipt.bankName || ''
                                  }));
                                }
                              }} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none appearance-none">
                                <option value="">-- Select Cheque --</option>
                                {donorReceiptRecords.filter(r => r.paymentMode === 'Cheque' && !r.deposited).map(r => (
                                  <option key={r._id} value={r._id}>
                                    {r.chequeNumber} – {r.donorName} – LKR {Number(r.totalAmount?.replace(/,/g, '') || 0).toLocaleString()}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Payment Mode</label>
                            <select value={generalPaymentForm.paymentMode} onChange={e => setGeneralPaymentForm({ ...generalPaymentForm, paymentMode: e.target.value, chequeNumber: '', chequeDate: '' })} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none">
                              <option value="Cash">Cash</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="Card">Card</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Amount (LKR)</label>
                            <input type="number" value={generalPaymentForm.amount} onChange={e => setGeneralPaymentForm({ ...generalPaymentForm, amount: e.target.value })} placeholder="0" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                          </div>
                          {generalPaymentForm.paymentMode === 'Cheque' && (
                            <>
                              <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Cheque Date</label>
                                <input type="date" value={generalPaymentForm.chequeDate} onChange={e => setGeneralPaymentForm({ ...generalPaymentForm, chequeDate: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Cheque No</label>
                                  <input type="text" maxLength="6" value={generalPaymentForm.chequeNumber.split('-')[0] || ''} onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    const rest = generalPaymentForm.chequeNumber.split('-').slice(1);
                                    const combined = [val, ...rest].join('-');
                                    setGeneralPaymentForm({ ...generalPaymentForm, chequeNumber: combined });
                                  }} placeholder="XXXXXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Sort Code</label>
                                  <input type="text" maxLength="4" value={generalPaymentForm.chequeNumber.split('-')[1] || ''} onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    const parts = generalPaymentForm.chequeNumber.split('-');
                                    const combined = [parts[0] || '', val, parts[2] || ''].join('-');
                                    setGeneralPaymentForm({ ...generalPaymentForm, chequeNumber: combined });
                                  }} placeholder="XXXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Branch Code</label>
                                  <input type="text" maxLength="3" value={generalPaymentForm.chequeNumber.split('-')[2] || ''} onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                                    const parts = generalPaymentForm.chequeNumber.split('-');
                                    const combined = [parts[0] || '', parts[1] || '', val].join('-');
                                    setGeneralPaymentForm({ ...generalPaymentForm, chequeNumber: combined });
                                  }} placeholder="XXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 outline-none" />
                                </div>
                              </div>
                            </>
                          )}

                          <div className="flex gap-3 pt-2">
                            <button onClick={async () => {
                              let { paymentNumber, date, accountId, accountName, amount } = generalPaymentForm;
                              if (!paymentNumber || !accountId || !accountName || !amount || !date) {
                                alert('Please fill all required fields: Payment Number, Date, Account ID, Account Name, and Amount.');
                                return;
                              }
                              try {
                                // Get fresh payment number from server to avoid duplicates
                                const numRes = await fetch('http://localhost:5000/api/general-payment/next-number');
                                if (numRes.ok) {
                                  const numData = await numRes.json();
                                  paymentNumber = numData.nextNumber;
                                }
                                const res = await fetch('http://localhost:5000/api/general-payment', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ ...generalPaymentForm, paymentNumber })
                                });
                                if (!res.ok) {
                                  const errText = await res.text();
                                  throw new Error(errText || 'Bad request');
                                }
                                const saved = await res.json();
                                setGeneralPaymentRecords(prev => [saved, ...prev]);
                                // If Chq Deposit, mark receipt as deposited
                                if (generalPaymentForm.depositType === 'Chq Deposit' && generalPaymentForm.depositedReceiptId) {
                                  try {
                                    await fetch(`http://localhost:5000/api/receipt/${generalPaymentForm.depositedReceiptId}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        deposited: true,
                                        depositDate: generalPaymentForm.date,
                                        depositAccount: generalPaymentForm.accountName
                                      })
                                    });
                                    setDonorReceiptRecords(prev => prev.map(r => r._id === generalPaymentForm.depositedReceiptId ? { ...r, deposited: true, depositDate: generalPaymentForm.date, depositAccount: generalPaymentForm.accountName } : r));
                                  } catch (e) { /* non-blocking */ }
                                }
                                resetGeneralPaymentForm();
                                if (generalPaymentForm.depositType === 'Chq Deposit') {
                                  setPaymentPrintPreview(saved);
                                  setPaymentPrintModalOpen(true);
                                } else {
                                  alert('General payment saved successfully.');
                                }
                              } catch (err) {
                                alert('Error saving general payment: ' + err.message);
                              }
                            }} className="rounded-xl bg-rose-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-700">Save Payment</button>
                            <button onClick={resetGeneralPaymentForm} className="rounded-xl border border-slate-200 dark:border-slate-800 px-6 py-2.5 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">Reset</button>
                          </div>
                        </div>
                      </div>

                      {/* Saved Payments List */}
                      <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Saved Payments</h3>
                          {generalPaymentRecords.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No general payments saved yet.</p>
                          ) : (
                            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                              {generalPaymentRecords.map((payment) => (
                                <div key={payment._id || payment.paymentNumber} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{payment.accountName}</p>
                                    <span className="text-xs text-rose-600 dark:text-rose-400">{payment.paymentNumber}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{payment.description || payment.accountId} · {payment.paymentMode}</p>
                                  <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-2">LKR {Number(payment.amount?.replace(/,/g, '') || 0).toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Print Preview Modal */}
                  {paymentPrintModalOpen && paymentPrintPreview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                          <h3 className="text-xl font-bold text-slate-900">Payment Voucher</h3>
                          <button onClick={() => setPaymentPrintModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        <div className="p-6 space-y-4 text-sm" id="payment-print-content">
                          <div className="text-center border-b border-slate-200 pb-4">
                            <h2 className="text-lg font-bold text-slate-900">CHEQUE DEPOSIT VOUCHER</h2>
                            <p className="text-slate-500">Payment #{paymentPrintPreview.paymentNumber}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-900">{paymentPrintPreview.date}</span></div>
                            <div><span className="text-slate-500">Amount:</span> <span className="font-semibold text-rose-600">LKR {Number(paymentPrintPreview.amount?.replace(/,/g, '') || 0).toLocaleString()}</span></div>
                            <div className="col-span-2"><span className="text-slate-500">Account:</span> <span className="font-semibold text-slate-900">{paymentPrintPreview.accountName} ({paymentPrintPreview.accountId})</span></div>
                            <div className="col-span-2"><span className="text-slate-500">Description:</span> <span className="text-slate-700">{paymentPrintPreview.description || '-'}</span></div>
                            <div><span className="text-slate-500">Cheque No:</span> <span className="font-mono font-semibold text-slate-900">{paymentPrintPreview.chequeNumber || '-'}</span></div>
                            <div><span className="text-slate-500">Cheque Date:</span> <span className="font-semibold text-slate-900">{paymentPrintPreview.chequeDate || '-'}</span></div>
                            <div className="col-span-2"><span className="text-slate-500">Bank:</span> <span className="font-semibold text-slate-900">{paymentPrintPreview.bankName || '-'}</span></div>
                          </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
                          <button onClick={() => { window.print(); }} className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-700 text-sm">Print</button>
                          <button onClick={() => setPaymentPrintModalOpen(false)} className="rounded-xl border border-slate-200 px-5 py-2 font-semibold text-slate-600 hover:bg-slate-100 transition-all text-sm">Close</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-left">
                  <button onClick={() => setTransactionView('dashboard')} className="mb-4 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900">← Back to Dashboard</button>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">General Journal</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">This module is ready for the next step of the transaction workflow.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-cyan-600 to-sky-600 p-8 text-white shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold">Inventory Dashboard</h2>
                    <p className="mt-2 max-w-2xl text-sm text-emerald-50">Manage purchase invoices, goods issue notes, suppliers, items, and stock quickly from one place.</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
                    <p className="font-semibold">Press F4</p>
                    <p className="text-emerald-50/90">Open stock checking for any item.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { id: 'purchase', title: 'Item Purchases', description: 'Create purchase invoices with supplier auto-fill and stock updates.', accent: 'from-emerald-500 to-teal-600' },
                  { id: 'gin', title: 'Goods Issue Note', description: 'Issue stock to departments while deducting available quantity.', accent: 'from-sky-500 to-blue-600' },
                  { id: 'payment', title: 'Supplier Payment', description: 'Record payments to suppliers against purchase invoices.', accent: 'from-rose-500 to-pink-600' },
                  { id: 'till', title: 'Till Issue & Collect', description: 'Issue tills to donors and collect payments with receipt.', accent: 'from-indigo-500 to-purple-600' },

                ].map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setInventoryView(module.id)}
                    className={`rounded-3xl border p-6 text-left shadow-sm transition-all hover:-translate-y-1 ${inventoryView === module.id ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/20' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'}`}
                  >
                    <div className={`inline-flex rounded-2xl bg-gradient-to-r ${module.accent} px-3 py-2 text-sm font-semibold text-white shadow-lg`}>{module.title}</div>
                    <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{module.description}</p>
                  </button>
                ))}
              </div>

              {inventoryView === 'dashboard' ? (
                <div></div>
              ) : inventoryView === 'purchase' ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950" style={{ minWidth: '900px' }}>
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <button onClick={() => { resetPurchaseForm(); setInventoryView('dashboard'); }} className="mb-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">← Back</button>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Item Purchase Entry</h3>
                    </div>
                    <button onClick={handleSavePurchase} className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700">Save Invoice</button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</label>
                          <input type="date" value={purchaseForm.date} onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Invoice #</label>
                          <input type="text" value={purchaseForm.invoiceNumber} onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })} placeholder="INV-001" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" />
                        </div>
                        <div className="relative">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Location</label>
                          <input type="text" value={purchaseForm.location} onChange={(e) => handleLocationNameChange(e.target.value)} onFocus={() => {
                            if (purchaseForm.location.trim().length >= 1) {
                              const matches = locations.filter(l => l.name.toLowerCase().includes(purchaseForm.location.toLowerCase()) && l.status === 'Active');
                              setLocationSuggestions(matches);
                              setShowLocationDropdown(matches.length > 0);
                              setActiveLocationIndex(-1);
                            }
                          }} onKeyDown={handleLocationInputKeyDown} placeholder="Select location" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" />
                          {showLocationDropdown && locationSuggestions.length > 0 && (
                            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                              {locationSuggestions.map((loc, idx) => (
                                <button key={loc._id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectLocation(loc)} className={`block w-full px-3 py-2 text-left text-sm ${idx === activeLocationIndex ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                  {loc.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Supplier</label>
                          <input type="text" value={purchaseForm.supplierName} onChange={(e) => handleSupplierNameChange(e.target.value)} onFocus={() => {
                            if (purchaseForm.supplierName.trim().length >= 1) {
                              const matches = suppliers.filter(s => s.name.toLowerCase().includes(purchaseForm.supplierName.toLowerCase()));
                              setSupplierSuggestions(matches);
                              setShowSupplierDropdown(matches.length > 0);
                              setActiveSupplierIndex(-1);
                            }
                          }} onKeyDown={handleSupplierInputKeyDown} placeholder="Type supplier" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" />
                          {showSupplierDropdown && supplierSuggestions.length > 0 && (
                            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                              {supplierSuggestions.map((supplier, idx) => (
                                <button key={supplier._id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectSupplier(supplier)} className={`block w-full px-3 py-2 text-left text-sm ${idx === activeSupplierIndex ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                  {supplier.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Address</label>
                          <input type="text" value={purchaseForm.supplierAddress} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierAddress: e.target.value })} placeholder="Supplier address" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Telephone</label>
                          <input type="text" value={purchaseForm.supplierTelephone} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierTelephone: e.target.value })} placeholder="Supplier telephone" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Invoice Summary</p>
                      <div className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold">LKR {purchaseInvoiceTotal.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-semibold text-rose-500">- LKR {purchaseDiscount.toLocaleString()}</span></div>
                        <div className="flex justify-between border-t border-emerald-300 pt-2 mt-1 text-sm font-bold text-slate-900 dark:text-white"><span>Net Amount</span><span>LKR {purchaseTotalAmount.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          <th className="py-2 pr-2 font-semibold">Item</th>
                          <th className="py-2 pr-2 font-semibold w-20">Qty</th>
                          <th className="py-2 pr-2 font-semibold w-24">Rate</th>
                          <th className="py-2 pr-2 font-semibold w-24">Amount</th>
                          <th className="py-2 font-semibold w-20 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(purchaseForm.lines && purchaseForm.lines.length > 0 ? purchaseForm.lines : [emptyPurchaseLine()]).map((line, index) => (
                          <tr key={index} className="border-b border-slate-100 dark:border-slate-800/70">
                            <td className="py-2 pr-2">
                              <div className="relative">
                                <input type="text" value={line.itemName} onChange={(e) => { handlePurchaseLineChange(index, 'itemName', e.target.value); setActiveLineIdx(index); setItemSearchTerm(e.target.value); setShowItemDropdown(true); setActiveItemIdx(-1); }} onKeyDown={(e) => handleItemInputKeyDown(e, index)} placeholder="Search item" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" />
                                {showItemDropdown && activeLineIdx === index && filteredInventoryItems.length > 0 && (
                                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                                    {filteredInventoryItems.map((item, i) => (
                                      <button key={item._id} type="button" onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActiveItemIdx(i)} onClick={() => { selectItemForLine(item, index, 'purchase'); setShowItemDropdown(false); setActiveItemIdx(-1); }} className={`block w-full px-3 py-2 text-left text-sm ${i === activeItemIdx ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                        {item.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-2 pr-2"><input type="number" value={line.qty} onChange={(e) => handlePurchaseLineChange(index, 'qty', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" /></td>
                            <td className="py-2 pr-2"><input type="number" value={line.rate} onChange={(e) => handlePurchaseLineChange(index, 'rate', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" /></td>
                            <td className="py-2 pr-2"><input type="text" value={line.amount || 0} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900" /></td>
                            <td className="py-2 text-center">
                              <button onClick={() => setPurchaseForm(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }))} className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-900/10">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={() => setPurchaseForm(prev => ({ ...prev, lines: [...prev.lines, emptyPurchaseLine()] }))} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500">+ Add Item</button>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs font-semibold text-slate-500">Discount</span>
                      <input type="number" value={purchaseForm.discount} onChange={(e) => setPurchaseForm({ ...purchaseForm, discount: e.target.value })} placeholder="0" className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                  </div>
                </div>
              ) : inventoryView === 'gin' ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950" style={{ minWidth: '900px' }}>
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <button onClick={() => { resetGinForm(); setInventoryView('dashboard'); }} className="mb-4 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">← Back</button>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Goods Issue Note</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Issue inventory items and deduct stock automatically.</p>
                    </div>
                    <button onClick={handleSaveGin} className="rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-700">Save GIN</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</label>
                      <input type="date" value={ginForm.date} onChange={(e) => setGinForm({ ...ginForm, date: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">GIN Number</label>
                      <input type="text" value={ginForm.ginNumber} onChange={(e) => setGinForm({ ...ginForm, ginNumber: e.target.value })} placeholder="GIN-001" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Issued To</label>
                      <input type="text" value={ginForm.issuedTo} onChange={(e) => setGinForm({ ...ginForm, issuedTo: e.target.value })} placeholder="Department / person" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Department</label>
                      <input type="text" value={ginForm.department} onChange={(e) => setGinForm({ ...ginForm, department: e.target.value })} placeholder="Department" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Remarks</label>
                      <input type="text" value={ginForm.remarks} onChange={(e) => setGinForm({ ...ginForm, remarks: e.target.value })} placeholder="Optional remarks" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900" />
                    </div>
                  </div>

                  <div className="mt-6">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          <th className="py-3 pr-3 font-semibold">Item</th>
                          <th className="py-3 pr-3 font-semibold">Qty</th>
                          <th className="py-3 pr-3 font-semibold">Unit</th>
                          <th className="py-3 pr-3 font-semibold">Remarks</th>
                          <th className="py-3 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ginForm.lines.map((line, index) => (
                          <tr key={index} className="border-b border-slate-100 dark:border-slate-800/70">
                            <td className="py-3 pr-3">
                              <div className="relative">
                                <input type="text" value={line.itemName} onChange={(e) => { handleGinLineChange(index, 'itemName', e.target.value); setActiveLineIdx(index); setItemSearchTerm(e.target.value); setShowItemDropdown(true); setActiveItemIdx(-1); }} onKeyDown={(e) => handleItemInputKeyDown(e, index)} placeholder="Search item" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900" />
                                {showItemDropdown && activeLineIdx === index && filteredInventoryItems.length > 0 && (
                                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                                    {filteredInventoryItems.map((item, i) => (
                                      <button key={item._id} type="button" onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActiveItemIdx(i)} onClick={() => { selectItemForLine(item, index, 'gin'); setShowItemDropdown(false); setActiveItemIdx(-1); }} className={`block w-full px-4 py-2.5 text-left text-sm ${i === activeItemIdx ? 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                        {item.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 pr-3"><input type="number" value={line.qty} onChange={(e) => handleGinLineChange(index, 'qty', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900" /></td>
                            <td className="py-3 pr-3"><input type="text" value={line.unit} onChange={(e) => handleGinLineChange(index, 'unit', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900" /></td>
                            <td className="py-3 pr-3"><input type="text" value={line.remarks} onChange={(e) => handleGinLineChange(index, 'remarks', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900" /></td>
                            <td className="py-3"><button onClick={() => setGinForm(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }))} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-900/10">Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4">
                    <button onClick={() => setGinForm(prev => ({ ...prev, lines: [...prev.lines, emptyGinLine()] }))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">+ Add Item</button>
                  </div>
                </div>
              ) : inventoryView === 'payment' ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950" style={{ minWidth: '900px' }}>
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <button onClick={() => { resetPaymentForm(); setInventoryView('dashboard'); }} className="mb-4 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">← Back</button>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Supplier Payment</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Record payments to suppliers against purchase invoices.</p>
                    </div>
                    <button onClick={handleSavePayment} className="rounded-xl bg-rose-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-700">Save Payment</button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</label>
                          <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-slate-800 dark:bg-slate-900" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Payment Number</label>
                          <input type="text" value={paymentForm.paymentNumber} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 cursor-not-allowed" />
                        </div>
                      </div>

                      <div className="relative">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Supplier Name</label>
                        <input type="text" value={paymentForm.supplierName} onChange={(e) => handlePaymentSupplierNameChange(e.target.value)} onFocus={() => {
                          if (paymentForm.supplierName.trim().length >= 1) {
                            const matches = suppliers.filter(s => s.name.toLowerCase().includes(paymentForm.supplierName.toLowerCase()));
                            setPaymentSupplierSuggestions(matches);
                            setShowPaymentSupplierDropdown(matches.length > 0);
                            setActivePaymentSupplierIndex(-1);
                          }
                        }} onKeyDown={handlePaymentSupplierInputKeyDown} placeholder="Type supplier name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-slate-800 dark:bg-slate-900" />
                        {showPaymentSupplierDropdown && paymentSupplierSuggestions.length > 0 && (
                          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            {paymentSupplierSuggestions.map((supplier, idx) => (
                              <button key={supplier._id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectPaymentSupplier(supplier)} className={`block w-full px-4 py-2 text-left text-sm ${idx === activePaymentSupplierIndex ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                {supplier.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {paymentForm.supplierName && filteredSupplierInvoices.length > 0 && (
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Select Invoice</label>
                          <div className="max-h-48 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="min-w-full text-left text-sm">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                  <th className="px-3 py-2">Invoice</th>
                                  <th className="px-3 py-2">Date</th>
                                  <th className="px-3 py-2 text-right">Total</th>
                                  <th className="px-3 py-2 text-right">Outstanding</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredSupplierInvoices.map((inv) => {
                                  const outstanding = getOutstanding(inv);
                                  return (
                                    <tr key={inv._id} onClick={() => selectPaymentInvoice(inv)} className={`cursor-pointer border-b border-slate-100 hover:bg-rose-50 dark:border-slate-800/70 dark:hover:bg-rose-900/10 ${paymentForm.invoiceNumber === inv.invoiceNumber ? 'bg-rose-50 dark:bg-rose-900/10' : ''}`}>
                                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{inv.date}</td>
                                      <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">LKR {Number(inv.totalAmount || 0).toLocaleString()}</td>
                                      <td className="px-3 py-2 text-right font-semibold text-rose-600 dark:text-rose-400">LKR {outstanding.toLocaleString()}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {paymentForm.supplierName && filteredSupplierInvoices.length === 0 && (
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Invoice</label>
                          <p className="text-sm text-slate-400 italic">No outstanding invoices found for this supplier.</p>
                        </div>
                      )}

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</label>
                        <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0.00" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-slate-800 dark:bg-slate-900" />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Payment Mode</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="paymentMode" value="Cash" checked={paymentForm.paymentMode === 'Cash'} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value, chequeNumber: '', bankName: '' })} className="accent-rose-600" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Cash</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="paymentMode" value="Cheque" checked={paymentForm.paymentMode === 'Cheque'} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })} className="accent-rose-600" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Cheque</span>
                          </label>
                        </div>
                      </div>

                      {paymentForm.paymentMode === 'Cheque' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cheque Number</label>
                            <input type="text" value={paymentForm.chequeNumber} onChange={(e) => setPaymentForm({ ...paymentForm, chequeNumber: e.target.value })} placeholder="CHQ-001" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-slate-800 dark:bg-slate-900" />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bank Name</label>
                            <input type="text" value={paymentForm.bankName} onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })} placeholder="Bank of Ceylon" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-slate-800 dark:bg-slate-900" />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Remarks</label>
                        <input type="text" value={paymentForm.remarks} onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })} placeholder="Optional notes" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-slate-800 dark:bg-slate-900" />
                      </div>
                    </div>
                </div>
              ) : inventoryView === 'till' ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <button onClick={() => setInventoryView('dashboard')} className="mb-4 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">← Back</button>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Till Issue & Collect</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Issue tills to donors and collect payments with receipt.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Left: Issue Till */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Issue New Till</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</label>
                          <input type="date" value={tillForm.issueDate} onChange={e => setTillForm({ ...tillForm, issueDate: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Till Number</label>
                          <input type="text" value={tillForm.tillNumber} onChange={e => setTillForm({ ...tillForm, tillNumber: e.target.value })} placeholder="T-001" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900" />
                        </div>
                      </div>
                      <div className="relative" ref={tillDonorDropdownRef}>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Till Donor <button type="button" onClick={() => setShowTillNewDonorForm(true)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 ml-1 font-bold text-xs">+ New</button></label>
                        <input
                          type="text"
                          placeholder="Type to search donor..."
                          value={tillDonorSearch || tillForm.donorName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTillDonorSearch(val);
                            setTillDonorDropdownOpen(true);
                            setTillDonorHighlightIndex(-1);
                            if (val === '') {
                              setTillForm({ ...tillForm, donorId: '', donorName: '' });
                            }
                          }}
                          onFocus={() => { setTillDonorDropdownOpen(true); setTillDonorHighlightIndex(-1); }}
                          onKeyDown={(e) => {
                            const q = (tillDonorSearch || '').toLowerCase();
                            const sorted = [...donors].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                            const filtered = sorted.filter(d => {
                              if (!q) return true;
                              return (d.name || '').toLowerCase().includes(q)
                                || (d.donorCode || '').toLowerCase().includes(q)
                                || (d.phone || '').toLowerCase().includes(q)
                                || (d.whatsapp || '').toLowerCase().includes(q);
                            });
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setTillDonorHighlightIndex(i => i < filtered.length - 1 ? i + 1 : 0);
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setTillDonorHighlightIndex(i => i > 0 ? i - 1 : filtered.length - 1);
                            } else if (e.key === 'Enter' && tillDonorDropdownOpen) {
                              e.preventDefault();
                              if (tillDonorHighlightIndex >= 0 && tillDonorHighlightIndex < filtered.length) {
                                const selected = filtered[tillDonorHighlightIndex];
                                setTillForm({ ...tillForm, donorId: selected._id, donorName: selected.name });
                                setTillDonorSearch('');
                                setTillDonorDropdownOpen(false);
                                setTillDonorHighlightIndex(-1);
                              }
                            } else if (e.key === 'Escape') {
                              setTillDonorDropdownOpen(false);
                              setTillDonorHighlightIndex(-1);
                            }
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                        />
                        {tillDonorDropdownOpen && (() => {
                          const q = (tillDonorSearch || '').toLowerCase();
                          const sorted = [...donors].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                          const filtered = sorted.filter(d => {
                            if (!q) return true;
                            return (d.name || '').toLowerCase().includes(q)
                              || (d.donorCode || '').toLowerCase().includes(q)
                              || (d.phone || '').toLowerCase().includes(q)
                              || (d.whatsapp || '').toLowerCase().includes(q);
                          });
                          return (
                            <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                              {filtered.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No donors found</div>
                              ) : (
                                filtered.map((d, idx) => (
                                  <div
                                    key={d._id}
                                    ref={idx === tillDonorHighlightIndex ? el => el && el.scrollIntoView({ block: 'nearest' }) : undefined}
                                    onClick={() => {
                                      setTillForm({ ...tillForm, donorId: d._id, donorName: d.name });
                                      setTillDonorSearch('');
                                      setTillDonorDropdownOpen(false);
                                      setTillDonorHighlightIndex(-1);
                                    }}
                                    onMouseEnter={() => setTillDonorHighlightIndex(idx)}
                                    className={`px-4 py-2.5 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors ${idx === tillDonorHighlightIndex ? 'bg-indigo-100 dark:bg-slate-800' : 'hover:bg-indigo-50 dark:hover:bg-slate-800'}`}
                                  >
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{d.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{d.donorCode || ''}{d.phone ? ` · ${d.phone}` : ''}</div>
                                  </div>
                                ))
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <button onClick={async () => {
                        if (!tillForm.tillNumber.trim()) return alert('Please enter a Till Number.');
                        if (!tillForm.donorName.trim()) return alert('Please select a Donor.');
                        try {
                          const res = await fetch('http://localhost:5000/api/inventory/till', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(tillForm)
                          });
                          const result = await res.json();
                          if (!res.ok) throw new Error(result.error || 'Failed to save till.');
                          setTills(prev => [result, ...prev]);
                          setTillForm({ issueDate: new Date().toISOString().slice(0, 10), tillNumber: '', donorName: '', donorId: '' });
                          setTillDonorSearch('');
                          setTillDonorDropdownOpen(false);
                          setTillDonorHighlightIndex(-1);
                          alert('Till issued successfully!');
                        } catch (err) { alert('Error: ' + err.message); }
                      }} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-700">Issue Till</button>

                      {/* New Donor from Till */}
                      {showTillNewDonorForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Donor</h3>
                              <button onClick={() => setShowTillNewDonorForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                            <div className="p-6 space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Route</label>
                                <select value={tillNewDonorForm.routeId} onChange={e => handleTillNewDonorChange('routeId', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                                  <option value="">Select Route</option>
                                  {routes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Donor ID (Auto Generated)</label>
                                <input type="text" readOnly value="Auto generated when saved" className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-all text-sm" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
                                <input type="text" value={tillNewDonorForm.name} onChange={e => handleTillNewDonorChange('name', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="Donor name" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                                <input type="text" value={tillNewDonorForm.address} onChange={e => handleTillNewDonorChange('address', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="Address" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Telephone</label>
                                  <input type="text" value={tillNewDonorForm.telephone} onChange={e => handleTillNewDonorChange('telephone', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="Phone" />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp</label>
                                  <input type="text" value={tillNewDonorForm.whatsapp} onChange={e => handleTillNewDonorChange('whatsapp', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="WhatsApp" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                                <select value={tillNewDonorForm.category} onChange={e => handleTillNewDonorChange('category', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                                  <option value="Till">Till</option>
                                  <option value="General">General</option>
                                </select>
                              </div>
                            </div>
                            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
                              <button onClick={() => setShowTillNewDonorForm(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm border border-transparent dark:border-slate-700">Cancel</button>
                              <button onClick={handleSaveTillNewDonor} className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all text-sm">Save</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Collect Till */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Collect Payment</h4>
                      <div className="flex gap-3 mb-3">
                        <input type="text" value={tillFilterTillNo} onChange={e => setTillFilterTillNo(e.target.value)} placeholder="Filter by Till No" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900" />
                        <input type="text" value={tillFilterDonor} onChange={e => setTillFilterDonor(e.target.value)} placeholder="Filter by Donor Name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900" />
                      </div>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sticky top-0">
                              <th className="px-3 py-2">Issue Date</th>
                              <th className="px-3 py-2">Donor Name</th>
                              <th className="px-3 py-2">Till No</th>
                              <th className="px-3 py-2 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const filteredTills = tills.filter(t => t.status === 'Issued' && (!tillFilterTillNo || t.tillNumber.toLowerCase().includes(tillFilterTillNo.toLowerCase())) && (!tillFilterDonor || t.donorName.toLowerCase().includes(tillFilterDonor.toLowerCase())));
                              return filteredTills.length === 0 ? (
                                <tr><td colSpan="4" className="py-6 text-center text-slate-400 text-sm">No unsettled tills.</td></tr>
                              ) : filteredTills.map(t => (
                              <tr key={t._id} className="border-b border-slate-100 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-xs">{t.issueDate}</td>
                                <td className="px-3 py-2 font-medium text-slate-900 dark:text-white text-xs">{t.donorName}</td>
                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300 text-xs">{t.tillNumber}</td>
                                <td className="px-3 py-2 text-center">
                                  <button onClick={() => { setTillCollectForm({ collectedDate: new Date().toISOString().slice(0, 10), receiptNumber: '', amount: '' }); setTillReceiptPreview(t); }} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Collect</button>
                                </td>
                              </tr>
                            )); })()}
                          </tbody>
                        </table>
                      </div>

                      {/* Collect form */}
                      {tillReceiptPreview && tillReceiptPreview.status === 'Issued' && (
                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 dark:border-indigo-900/30 dark:bg-indigo-900/10 p-5 space-y-4">
                          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Collecting: {tillReceiptPreview.tillNumber} - {tillReceiptPreview.donorName}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</label>
                              <input type="date" value={tillCollectForm.collectedDate} onChange={e => setTillCollectForm({ ...tillCollectForm, collectedDate: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900" />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Receipt Number</label>
                              <input type="text" value={tillCollectForm.receiptNumber} onChange={e => setTillCollectForm({ ...tillCollectForm, receiptNumber: e.target.value })} placeholder="RCP-001" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900" />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount (LKR)</label>
                              <input type="number" value={tillCollectForm.amount} onChange={e => setTillCollectForm({ ...tillCollectForm, amount: e.target.value })} placeholder="0.00" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900" />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={async () => {
                              if (!tillCollectForm.receiptNumber.trim()) return alert('Please enter a Receipt Number.');
                              if (!tillCollectForm.amount || Number(tillCollectForm.amount) <= 0) return alert('Please enter a valid Amount.');
                              try {
                                const res = await fetch(`http://localhost:5000/api/inventory/till/${tillReceiptPreview._id}`, {
                                  method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(tillCollectForm)
                                });
                                const result = await res.json();
                                if (!res.ok) throw new Error(result.error || 'Failed to collect.');
                                setTills(prev => prev.map(t => t._id === result._id ? result : t));
                                setTillReceiptPreview(result);
                                setTillCollectForm({ collectedDate: new Date().toISOString().slice(0, 10), receiptNumber: '', amount: '' });
                              } catch (err) { alert('Error: ' + err.message); }
                            }} className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700">Save Collection</button>
                            <button onClick={() => setTillReceiptPreview(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* Receipt preview after collection */}
                      {tillReceiptPreview && tillReceiptPreview.status === 'Collected' && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10 p-5 space-y-4">
                          <div className="text-center border-b border-emerald-200 dark:border-emerald-800/30 pb-4">
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{companies[0]?.name || 'DEENIYA'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Till Collection Receipt</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p className="text-slate-500 dark:text-slate-400">Till No:</p><p className="font-semibold text-slate-900 dark:text-white">{tillReceiptPreview.tillNumber}</p>
                            <p className="text-slate-500 dark:text-slate-400">Donor:</p><p className="font-semibold text-slate-900 dark:text-white">{tillReceiptPreview.donorName}</p>
                            <p className="text-slate-500 dark:text-slate-400">Issue Date:</p><p className="text-slate-700 dark:text-slate-300">{tillReceiptPreview.issueDate}</p>
                            <p className="text-slate-500 dark:text-slate-400">Receipt No:</p><p className="font-semibold text-slate-900 dark:text-white">{tillReceiptPreview.receiptNumber}</p>
                            <p className="text-slate-500 dark:text-slate-400">Amount:</p><p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">LKR {Number(tillReceiptPreview.amount || 0).toLocaleString()}</p>
                            <p className="text-slate-500 dark:text-slate-400">Collected Date:</p><p className="text-slate-700 dark:text-slate-300">{tillReceiptPreview.collectedDate}</p>
                          </div>
                          <div className="flex gap-3 justify-center pt-2 border-t border-emerald-200 dark:border-emerald-800/30">
                            <button onClick={() => window.print()} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-700 text-sm">Print Receipt</button>
                            <button onClick={() => {
                              const msg = `Assalamualaikum ${tillReceiptPreview.donorName}. Your Till Collection Receipt ${tillReceiptPreview.receiptNumber} for LKR ${Number(tillReceiptPreview.amount || 0).toLocaleString()} (Till: ${tillReceiptPreview.tillNumber}) has been recorded. Thank you.`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
                            }} className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700 text-sm">WhatsApp</button>
                            <button onClick={() => setTillReceiptPreview(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">Close</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : null}

            </div>
          )}


          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div className="max-w-6xl mx-auto">
              <UserManager />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-6xl mx-auto space-y-6 text-left">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">System Settings</h2>
                <div className="space-y-6">
                  <div className="p-6 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/60">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">General Settings</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Modify general portal parameters and branding values.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 block mb-2 font-medium uppercase">Portal Title</label>
                        <input type="text" defaultValue="Deeniya Management Console" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 block mb-2 font-medium uppercase">System Currency</label>
                        <input type="text" defaultValue="LKR" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:border-purple-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/60">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">API & Database Endpoint</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Connection parameters for MongoDB and third-party gateways.</p>
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 block mb-2 font-medium uppercase">Database connection URI</label>
                      <input type="text" readOnly value="mongodb+srv://******:******@cluster0.mj8kdo1.mongodb.net/" className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none cursor-not-allowed" />
                    </div>
                  </div>

                  <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30 transition-all text-sm">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Stock Checking Modal (F4) */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Stock Checking</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Search items by code or name and check current stock.</p>
              </div>
              <button onClick={() => setIsStockModalOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">✕</button>
            </div>
            <div className="p-6">
              <input type="text" value={stockSearchTerm} onChange={(e) => setStockSearchTerm(e.target.value)} placeholder="Search item name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" />
              <div className="mt-4 max-h-80 overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-3 pr-3 font-semibold">Item</th>
                      <th className="py-3 pr-3 font-semibold">Location</th>
                      <th className="py-3 font-semibold">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invItems.filter((item) => {
                      const term = stockSearchTerm.trim().toLowerCase();
                      if (!term) return false;
                      return String(item.code || '').toLowerCase().includes(term) || String(item.name || '').toLowerCase().includes(term);
                    })).map((item) => (
                      <tr key={item._id} className="border-b border-slate-100 dark:border-slate-800/70">
                        <td className="py-3 pr-3 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                        <td className="py-3 pr-3 text-slate-500 dark:text-slate-400 text-xs">{item.location || '-'}</td>
                        <td className={`py-3 font-semibold ${Number(item.currentStock || 0) <= Number(item.reorderLevel || 0) ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{Number(item.currentStock || 0)} {item.unit || 'Pcs'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Modal */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingCompanyId ? 'Edit Company' : 'Add New Company'}</h3>
              <button onClick={closeCompanyModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label>
                <input required type="text" name="name" value={companyForm.name} onChange={handleCompanyChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Deeniya Charity Corp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company Code</label>
                  <input type="text" name="code" value={companyForm.code} onChange={handleCompanyChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. CMP-01" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Registration Number</label>
                  <input type="text" name="regNo" value={companyForm.regNo} onChange={handleCompanyChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. GA-99388" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                <input type="text" name="address" value={companyForm.address} onChange={handleCompanyChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. 123 Main St, Colombo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Telephone Number</label>
                  <input type="tel" name="phone" value={companyForm.phone} onChange={handleCompanyChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. 0112345678" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp Number</label>
                  <input type="tel" name="whatsapp" value={companyForm.whatsapp} onChange={handleCompanyChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. 0771234567" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Corporate Email</label>
                <input type="email" name="email" value={companyForm.email} onChange={handleCompanyChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. info@deeniya.org" />
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button type="button" onClick={closeCompanyModal} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm border border-transparent dark:border-slate-700">
                Cancel
              </button>
              <button type="button" onClick={handleSaveCompany} className="px-5 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all text-sm">
                {editingCompanyId ? 'Update Company' : 'Save Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donor Upload Modal */}
      {donorUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col transform transition-all max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upload Donors</h3>
              <button onClick={() => { setDonorUploadModalOpen(false); setDonorUploadData([]); setDonorUploadResult(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              {!donorUploadResult && (
                <>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const parseCSV = (csv) => {
                          const rows = [];
                          let current = '', inQuotes = false;
                          for (const ch of csv) {
                            if (ch === '"') { inQuotes = !inQuotes; continue; }
                            if (ch === '\n' && !inQuotes) { rows.push(current); current = ''; continue; }
                            if (ch === '\r') continue;
                            current += ch;
                          }
                          if (current.trim()) rows.push(current);
                          return rows.map(r => {
                            const vals = [];
                            let field = '', q = false;
                            for (const ch of r) {
                              if (ch === '"') { q = !q; continue; }
                              if (ch === ',' && !q) { vals.push(field); field = ''; continue; }
                              field += ch;
                            }
                            vals.push(field);
                            return vals;
                          });
                        };
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const text = ev.target.result.replace(/^\uFEFF/, '');
                          const rows = parseCSV(text);
                          if (rows.length < 2) { alert('CSV must have a header row and at least one data row.'); return; }
                          const headers = rows[0].map(h => h.trim());
                          const parsed = [];
                          for (let i = 1; i < rows.length; i++) {
                            const row = {};
                            headers.forEach((h, idx) => { row[h] = (rows[i][idx] || '').trim(); });
                            if (row.Name) parsed.push(row);
                          }
                          setDonorUploadData(parsed);
                        };
                        reader.readAsText(file);
                      }}
                      className="hidden"
                      id="donorCsvInput"
                    />
                    <label htmlFor="donorCsvInput" className="cursor-pointer inline-flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Click to select a CSV file</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">Use the Download Template button to get the correct format</span>
                    </label>
                  </div>

                  {donorUploadData.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{donorUploadData.length} donor(s) found in file.</p>
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-64 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 font-medium">#</th>
                              <th className="px-3 py-2 font-medium">DonorCode</th>
                              <th className="px-3 py-2 font-medium">Name</th>
                              <th className="px-3 py-2 font-medium">Route</th>
                              <th className="px-3 py-2 font-medium">Categories</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-600 dark:text-slate-300">
                            {donorUploadData.map((row, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2">{idx + 1}</td>
                                <td className="px-3 py-2 font-mono text-purple-600 dark:text-purple-400">{row.DonorCode || '-'}</td>
                                <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{row.Name}</td>
                                <td className="px-3 py-2">{row.Route || '-'}</td>
                                <td className="px-3 py-2">{[1,2,3].map(ci => row[`Category${ci}_Name`] ? `${row[`Category${ci}_Name`]}: ${row[`Category${ci}_Amount`] || '0'}` : null).filter(Boolean).join(', ') || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {donorUploadResult && (
                <div className="space-y-4">
                  <div className={`rounded-2xl p-5 ${donorUploadResult.success > 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900'}`}>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{donorUploadResult.success} donor(s) imported successfully.</p>
                    {donorUploadResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{donorUploadResult.errors.length} error(s):</p>
                        <ul className="mt-1 text-sm text-red-500 dark:text-red-300 list-disc list-inside">
                          {donorUploadResult.errors.map((e, i) => (
                            <li key={i}>Row {e.row}: {e.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => { setDonorUploadModalOpen(false); setDonorUploadData([]); setDonorUploadResult(null); fetch('http://localhost:5000/api/master/donor').then(r => r.json()).then(setDonors); }} className="px-5 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all text-sm">Done</button>
                  </div>
                </div>
              )}
            </div>
            {donorUploadData.length > 0 && !donorUploadResult && (
              <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3 shrink-0">
                <button onClick={() => { setDonorUploadModalOpen(false); setDonorUploadData([]); setDonorUploadResult(null); }} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm border border-transparent dark:border-slate-700">Cancel</button>
                <button
                  onClick={async () => {
                    setDonorUploadLoading(true);
                    try {
                      const res = await fetch('http://localhost:5000/api/master/donor/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ donors: donorUploadData }),
                      });
                      const data = await res.json();
                      setDonorUploadResult(data);
                    } catch (err) {
                      setDonorUploadResult({ success: 0, errors: [{ row: '-', error: err.message }] });
                    } finally {
                      setDonorUploadLoading(false);
                    }
                  }}
                  disabled={donorUploadLoading}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white shadow-lg shadow-purple-600/30 transition-all text-sm"
                >
                  {donorUploadLoading ? 'Importing...' : `Import ${donorUploadData.length} Donor(s)`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingExpenseId ? 'Edit Account' : 'Add Account'}</h3>
              <button onClick={closeExpenseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Account Code</label>
                <input type="text" name="code" value={expenseForm.code} onChange={handleExpenseChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. EXP-003" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea name="description" value={expenseForm.description} onChange={handleExpenseChange} rows="3" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm resize-none" placeholder="e.g. Monthly office rent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                <select name="category" value={expenseForm.category} onChange={handleExpenseChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                  <option value="Expenses">Expenses</option>
                  <option value="Staff">Staff</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button onClick={closeExpenseModal} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm border border-transparent dark:border-slate-700">Cancel</button>
              <button onClick={handleSaveExpense} className="px-5 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all text-sm">{editingExpenseId ? 'Update Account' : 'Save Account'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingBankId ? 'Edit Bank Account' : 'Link Bank Account'}</h3>
              <button onClick={closeBankModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bank Name</label>
                <input type="text" name="name" value={bankForm.name} onChange={handleBankChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Amana Bank" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Branch</label>
                <input type="text" name="branch" value={bankForm.branch} onChange={handleBankChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Main Branch, Colombo" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Account Number</label>
                <input type="text" name="accNo" value={bankForm.accNo} onChange={handleBankChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. 012-345678-001" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                <select name="status" value={bankForm.status} onChange={handleBankChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                  <option value="Linked">Linked</option>
                  <option value="Unlinked">Unlinked</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button onClick={closeBankModal} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm border border-transparent dark:border-slate-700">Cancel</button>
              <button onClick={handleSaveBank} className="px-5 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all text-sm">{editingBankId ? 'Update Bank' : 'Save Bank'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingCategoryId ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={closeCategoryModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Fund/Category Name</label>
                <input type="text" name="name" value={categoryForm.name} onChange={handleCategoryChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Madrasa Building Fund" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category Type</label>
                <select name="type" value={categoryForm.type} onChange={handleCategoryChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                  <option value="General">General</option>
                  <option value="Capital">Capital</option>
                  <option value="Zakat">Zakat</option>
                  <option value="Sadaqah">Sadaqah</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea name="desc" value={categoryForm.desc} onChange={handleCategoryChange} rows="3" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm resize-none" placeholder="Details about the fund..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Target Amount</label>
                <input type="text" name="target" value={categoryForm.target} onChange={handleCategoryChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. LKR 1,500,000 or 'Ongoing'" />
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button onClick={closeCategoryModal} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm border border-transparent dark:border-slate-700">Cancel</button>
              <button onClick={handleSaveCategory} className="px-5 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all text-sm">{editingCategoryId ? 'Update Category' : 'Save Category'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingRouteId ? 'Edit Route' : 'Add New Route'}</h3>
              <button onClick={closeRouteModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Route Name</label>
                <input type="text" name="name" value={routeForm.name} onChange={handleRouteChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Colombo North" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Coverage Areas</label>
                <input type="text" name="areas" value={routeForm.areas} onChange={handleRouteChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Mattakkuliya, Mutwal" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                <select name="status" value={routeForm.status} onChange={handleRouteChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button onClick={closeRouteModal} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm border border-transparent dark:border-slate-700">Cancel</button>
              <button onClick={handleSaveRoute} className="px-5 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all text-sm">{editingRouteId ? 'Update Route' : 'Save Route'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingLocationId ? 'Edit Location' : 'Add New Location'}</h3>
              <button onClick={closeLocationModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location Name</label>
                <input type="text" name="name" value={locationForm.name} onChange={handleLocationChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Main Store" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <input type="text" name="description" value={locationForm.description} onChange={handleLocationChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Ground floor storage room" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                <select name="status" value={locationForm.status} onChange={handleLocationChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button onClick={closeLocationModal} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm border border-transparent dark:border-slate-700">Cancel</button>
              <button onClick={handleSaveLocation} className="px-5 py-2.5 rounded-xl font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/30 transition-all text-sm">{editingLocationId ? 'Update Location' : 'Save Location'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingItemId ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => { setIsItemModalOpen(false); setEditingItemId(null); setItemForm({ code: '', name: '', unit: 'Pcs', category: '', location: '', currentStock: '', reorderLevel: '' }); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Item Name</label>
                <input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Cement" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Unit</label>
                  <input type="text" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="Pcs" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                  <input type="text" value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="e.g. Building" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
                  <select value={itemForm.location} onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm appearance-none">
                    <option value="">Select Location</option>
                    {locations.filter(l => l.status === 'Active').map(loc => (
                      <option key={loc._id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Current Stock</label>
                  <input type="number" value={itemForm.currentStock} onChange={(e) => setItemForm({ ...itemForm, currentStock: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reorder Level</label>
                  <input type="number" value={itemForm.reorderLevel} onChange={(e) => setItemForm({ ...itemForm, reorderLevel: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-slate-900 dark:text-white transition-all text-sm" placeholder="0" />
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button onClick={() => { setIsItemModalOpen(false); setEditingItemId(null); setItemForm({ code: '', name: '', unit: 'Pcs', category: '', location: '', currentStock: '', reorderLevel: '' }); }} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm border border-transparent dark:border-slate-700">Cancel</button>
              <button onClick={handleSaveItem} className="px-5 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all text-sm">{editingItemId ? 'Update Item' : 'Save Item'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Donor Receipt Modal */}
      {donorReceiptModalOpen && currentReceiptPreview && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col transform transition-all no-print">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Receipt Preview</h3>
                <button onClick={() => setDonorReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50 dark:bg-slate-900 flex justify-center">

                {/* Visual Preview Container */}
                <div className="bg-white text-black p-8 border border-gray-300 shadow-sm" style={{ width: '100%', maxWidth: '800px', fontFamily: 'Arial, sans-serif' }}>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold uppercase">{companies[0]?.name || 'DEENIYA DONATION APP'}</h2>
                    <p className="text-sm">{companies[0]?.address || 'Company Address Here'}</p>
                  </div>

                  <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-6">
                    <h3 className="text-xl font-bold uppercase tracking-widest">Official Receipt</h3>
                    <div className="text-right">
                      <p className="font-bold">No: {currentReceiptPreview.receiptNumber}</p>
                      <p>Date: {new Date(currentReceiptPreview.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm leading-relaxed mb-8">
                    <div className="flex">
                      <span className="w-40 font-bold">Received with thanks from:</span>
                      <span className="flex-1 border-b border-dashed border-gray-400">{currentReceiptPreview.donorName}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 font-bold">Category:</span>
                      <span className="flex-1 border-b border-dashed border-gray-400">{currentReceiptPreview.category}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 font-bold">The sum of Rupees:</span>
                      <span className="flex-1 border-b border-dashed border-gray-400 font-semibold italic">
                        {numberToWords(Number(currentReceiptPreview.totalAmount.replace(/,/g, '')) || 0)}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-40 font-bold">Balance Amount:</span>
                      <span className="flex-1 border-b border-dashed border-gray-400">
                        {currentReceiptPreview.balanceAmount || '0'} LKR
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-40 font-bold">Payment Mode:</span>
                      <span className="flex-1 border-b border-dashed border-gray-400">
                        {currentReceiptPreview.paymentMode}
                        {currentReceiptPreview.paymentMode === 'Cheque' ? ` (No: ${currentReceiptPreview.chequeNumber})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-12">
                    <div className="p-3 border-2 border-black rounded-lg">
                      <p className="text-xl font-bold">LKR {currentReceiptPreview.totalAmount}/-</p>
                    </div>
                    <div className="text-center text-xs italic text-gray-500">
                      "This is Computer Generated Receipt no Signature Required"
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
                <button onClick={() => setDonorReceiptModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm border border-transparent dark:border-slate-700">Cancel</button>
                <button onClick={() => handleSendWhatsAppReceipt(currentReceiptPreview)} className="px-5 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all text-sm">WhatsApp</button>
                <button onClick={handlePrintDonorReceipt} className="px-5 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all text-sm">Print Receipt</button>
              </div>
            </div>
          </div>

          <DonorReceiptPrint receipt={currentReceiptPreview} companies={companies} />
        </>
      )}

    </div>
  );
}


