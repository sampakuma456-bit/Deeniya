import React, { useState } from 'react';
import ReportExportButtons from './ReportExportButtons';

export default function GeneralReceiptReport() {
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/general-receipt');
      if (!res.ok) throw new Error('Failed to fetch general receipts');
      let data = await res.json();

      if (filterDateFrom) {
        data = data.filter(r => r.date >= filterDateFrom);
      }
      if (filterDateTo) {
        data = data.filter(r => r.date <= filterDateTo);
      }

      data.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
      });

      setReportData(data);
      setReportReady(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!reportReady) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-end gap-4 flex-wrap max-w-2xl">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">
              <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              From Date
            </label>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">
              <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              To Date
            </label>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500" />
          </div>
          <button onClick={fetchReport} disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all whitespace-nowrap">
            {loading ? 'Loading...' : 'Generate Report →'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }

  const dateLabel = filterDateFrom && filterDateTo
    ? `${filterDateFrom} to ${filterDateTo}`
    : filterDateFrom || filterDateTo || 'All';

  const totalAmount = reportData.reduce((s, r) => s + (parseFloat(String(r.amount).replace(/,/g, '')) || 0), 0);

  return (
    <div className="report-print space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <button onClick={() => { setReportReady(false); setReportData(null); setError(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">General Receipt Transaction</span>
          <span className="mx-2">·</span>
          {dateLabel}
          <span className="mx-2">·</span>
          {reportData.length} receipts
        </div>
      </div>

      <ReportExportButtons tableId="general-receipt-table" filename={`General_Receipt_${dateLabel.replace(/\s/g, '_')}`} />

      <div className="overflow-x-auto">
        <table id="general-receipt-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              <th className="py-3 px-4 font-semibold">#</th>
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Receipt No</th>
              <th className="py-3 px-4 font-semibold">Account ID</th>
              <th className="py-3 px-4 font-semibold">Account Name</th>
              <th className="py-3 px-4 font-semibold">Description</th>
              <th className="py-3 px-4 font-semibold text-right">Amount (LKR)</th>
              <th className="py-3 px-4 font-semibold">Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
            {reportData.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-400">No receipts found.</td>
              </tr>
            ) : (
              reportData.map((r, i) => (
                <tr key={r._id || i} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400 text-xs">{i + 1}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.date || '-'}</td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{r.receiptNumber}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.accountId}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.accountName}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{r.description || '-'}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">{Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.paymentMode || 'Cash'}{r.paymentMode === 'Cheque' && r.chequeNumber ? ` (${r.chequeNumber})` : ''}</td>
                </tr>
              ))
            )}
          </tbody>
          {reportData.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white">
                <td colSpan="6" className="py-3 px-4 uppercase tracking-wide text-slate-500 dark:text-slate-400 text-xs">Total ({reportData.length} receipts)</td>
                <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
