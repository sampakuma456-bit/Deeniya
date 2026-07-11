import React, { useState } from 'react';
import ReportExportButtons from './ReportExportButtons';
import DonorReceiptPrint from '../DonorReceiptPrint';

export default function DonorReceiptReport() {
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [reprintReceipt, setReprintReceipt] = useState(null);

  const handleReprint = (receipt) => {
    setReprintReceipt(receipt);
    setTimeout(() => {
      const el = document.getElementById('reprint-container');
      if (!el) { setReprintReceipt(null); return; }
      const html = el.innerHTML;
      const win = window.open('', '_blank');
      if (!win) { setReprintReceipt(null); return; }
      win.document.write(`<!DOCTYPE html><html><head><style>
@page{size:8.55in 5.55in;margin:0;}
@media print{body{margin:0;padding:0;overflow:hidden}
.receipt-print-area{display:block!important;position:fixed!important;top:0!important;left:0!important;width:8.55in!important;height:5.55in!important;overflow:hidden!important;margin:0!important;padding:0!important;box-sizing:border-box!important;background:#fff!important;color:#000!important;font-family:Arial,sans-serif!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
*{visibility:visible!important}
}
</style></head><body><div class="receipt-print-area">${html}</div></body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 200);
      setReprintReceipt(null);
    }, 100);
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/receipt');
      if (!res.ok) throw new Error('Failed to fetch donor receipts');
      let data = await res.json();

      if (filterDateFrom) {
        data = data.filter(r => r.createdAt && r.createdAt.slice(0, 10) >= filterDateFrom);
      }
      if (filterDateTo) {
        data = data.filter(r => r.createdAt && r.createdAt.slice(0, 10) <= filterDateTo);
      }

      data.sort((a, b) => {
        const da = a.createdAt || '';
        const db = b.createdAt || '';
        if (da < db) return -1;
        if (da > db) return 1;
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

  const totalAmount = reportData.reduce((s, r) => s + (parseFloat(String(r.totalAmount).replace(/,/g, '')) || 0), 0);

  return (
    <div className="report-print space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <button onClick={() => { setReportReady(false); setReportData(null); setError(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">Donor Receipt Transaction</span>
          <span className="mx-2">·</span>
          {dateLabel}
          <span className="mx-2">·</span>
          {reportData.length} receipts
        </div>
      </div>

      <ReportExportButtons tableId="donor-receipt-table" filename={`Donor_Receipt_${dateLabel.replace(/\s/g, '_')}`} />

      <div className="overflow-x-auto">
        <table id="donor-receipt-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              <th className="py-3 px-4 font-semibold">#</th>
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Receipt No</th>
              <th className="py-3 px-4 font-semibold">Donor ID</th>
              <th className="py-3 px-4 font-semibold">Donor Name</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold text-right">Amount (LKR)</th>
              <th className="py-3 px-4 font-semibold text-right">Balance (LKR)</th>
              <th className="py-3 px-4 font-semibold">Mode</th>
              <th className="py-3 px-4 font-semibold text-center">Print</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
            {reportData.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-8 text-center text-slate-400">No receipts found.</td>
              </tr>
            ) : (
              reportData.map((r, i) => (
                <tr key={r._id || i} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400 text-xs">{i + 1}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.createdAt ? r.createdAt.slice(0, 10) : '-'}</td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{r.receiptNumber}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.donorId}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.donorName}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">{r.category}</span></td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">{r.totalAmount}</td>
                  <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">{r.balanceAmount || '-'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.paymentMode || 'Cash'}{r.paymentMode === 'Cheque' ? ` (${r.bankName || ''})` : ''}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleReprint(r)} title="Reprint Receipt" className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {reportData.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white">
                <td colSpan="6" className="py-3 px-4 uppercase tracking-wide text-slate-500 dark:text-slate-400 text-xs">Total ({reportData.length} receipts)</td>
                <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td colSpan="3" className="py-3 px-4"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {reprintReceipt && (
        <div id="reprint-container" style={{ display: 'none' }}>
          <DonorReceiptPrint receipt={reprintReceipt} companies={[]} duplicate />
        </div>
      )}
    </div>
  );
}
