import React, { useState, useEffect } from 'react';
import ReportExportButtons from './ReportExportButtons';

export default function SupplierStatement() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierName, setSupplierName] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/inventory/supplier')
      .then(r => r.json())
      .then(setSuppliers)
      .catch(() => {});
  }, []);

  const fetchReport = async () => {
    if (!fromDate || !toDate || !supplierName) {
      alert('Please select From Date, To Date, and Supplier.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/inventory/supplier-statement?supplierName=${encodeURIComponent(supplierName)}&fromDate=${fromDate}&toDate=${toDate}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReportData(data);
      setReportReady(true);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!reportReady) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-end gap-4 flex-wrap max-w-3xl">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-teal-500" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-teal-500" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">Supplier</label>
            <select value={supplierName} onChange={e => setSupplierName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-teal-500">
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <button onClick={fetchReport} disabled={loading}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold rounded-xl shadow-lg shadow-teal-600/30 transition-all whitespace-nowrap">
            {loading ? 'Loading...' : 'View Statement →'}
          </button>
        </div>
      </div>
    );
  }

  const { supplierName: supName, fromDate: fDate, toDate: tDate, openingBalanceLabel, closingBalanceLabel, entries, totalDr, totalCr } = reportData;

  return (
    <div className="report-print space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <button onClick={() => { setReportReady(false); setReportData(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
          ← Back
        </button>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">Supplier Statement</span>
          <span className="mx-2">·</span>
          {supName}
          <span className="mx-2">·</span>
          {fDate} to {tDate}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-4 py-2">
          <span className="text-slate-500 dark:text-slate-400">Opening: </span>
          <span className="font-semibold text-slate-900 dark:text-white">{openingBalanceLabel}</span>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-4 py-2">
          <span className="text-slate-500 dark:text-slate-400">Closing: </span>
          <span className="font-semibold text-slate-900 dark:text-white">{closingBalanceLabel}</span>
        </div>
      </div>

      <ReportExportButtons tableId="supplier-statement-table" filename={`Supplier_Statement_${supName}`} />

      <div className="overflow-x-auto">
        <table id="supplier-statement-table" className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Ref No</th>
              <th className="py-3 px-4 font-semibold min-w-[220px]">Description</th>
              <th className="py-3 px-4 font-semibold text-right">Dr (LKR)</th>
              <th className="py-3 px-4 font-semibold text-right">Cr (LKR)</th>
              <th className="py-3 px-4 font-semibold text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {entries.length === 0 ? (
              <tr><td colSpan="6" className="py-10 text-center text-slate-400">No transactions found.</td></tr>
            ) : entries.map((entry, i) => (
              <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${entry.type === 'opening' ? 'bg-amber-50/40 dark:bg-amber-900/10 font-semibold' : ''}`}>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{entry.date}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{entry.number}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{entry.description}</td>
                <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">{entry.rawDr > 0 ? entry.dr.toLocaleString() : '-'}</td>
                <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">{entry.rawCr > 0 ? entry.cr.toLocaleString() : '-'}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">{entry.runningBalanceLabel}</td>
              </tr>
            ))}
          </tbody>
          {entries.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white">
                <td colSpan="3" className="py-3 px-4 uppercase tracking-wide text-slate-500 dark:text-slate-400 text-xs">Total</td>
                <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">{totalDr.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">{totalCr.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">{closingBalanceLabel}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
