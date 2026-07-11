import React, { useState } from 'react';
import ReportExportButtons from './ReportExportButtons';

export default function ShopOutstandingReport({ suppliers, purchases, companies }) {
  const [outstandingBreakdown, setOutstandingBreakdown] = useState(null);

  const activeSuppliers = suppliers.filter(s => s.status !== 'Inactive');

  const getSupplierStats = (supplier) => {
    const supplierPurchases = purchases.filter(p => p.supplierName.toLowerCase() === supplier.name.toLowerCase());
    const totalAmount = supplierPurchases.reduce((s, p) => s + (p.totalAmount || 0), 0);
    const paidAmount = supplierPurchases.reduce((s, p) => s + (p.paidAmount || 0), 0);
    const outstanding = totalAmount - paidAmount;
    const today = new Date();
    let maxAge = 0;
    supplierPurchases.forEach(inv => {
      const bal = (inv.totalAmount || 0) - (inv.paidAmount || 0);
      if (bal > 0 && inv.date) {
        const invDate = new Date(inv.date);
        if (!isNaN(invDate)) {
          const days = Math.floor((today - invDate) / (1000 * 60 * 60 * 24));
          if (days > maxAge) maxAge = days;
        }
      }
    });
    return { supplierPurchases, totalAmount, paidAmount, outstanding, maxAge };
  };

  return (
    <div className="report-print">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/30 rounded-2xl p-5">
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase mb-1">Outstanding Suppliers</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {activeSuppliers.filter(s => {
              const { outstanding } = getSupplierStats(s);
              return outstanding > 0;
            }).length}
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">Total Invoice Amount</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">LKR {purchases.reduce((s, p) => s + (p.totalAmount || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 rounded-2xl p-5">
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase mb-1">Total Outstanding</p>
          <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">LKR {purchases.reduce((s, p) => s + ((p.totalAmount || 0) - (p.paidAmount || 0)), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Supplier Table */}
      <div className="overflow-x-auto">
        <ReportExportButtons tableId="shop-outstanding-table" filename="Shop_Outstanding_Report" />
        <table id="shop-outstanding-table" className="w-full mt-4 text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              <th className="py-3 px-4 font-semibold">Supplier</th>
              <th className="py-3 px-4 font-semibold text-right">Invoices</th>
              <th className="py-3 px-4 font-semibold text-right">Total Amount</th>
              <th className="py-3 px-4 font-semibold text-right">Paid</th>
              <th className="py-3 px-4 font-semibold text-right">Outstanding</th>
              <th className="py-3 px-4 font-semibold text-right">Age (Days)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
            {activeSuppliers.length === 0 ? (
              <tr><td colSpan="6" className="py-8 text-center text-slate-400">No suppliers registered.</td></tr>
            ) : (
              activeSuppliers.map(supplier => {
                const { supplierPurchases, totalAmount, paidAmount, outstanding, maxAge } = getSupplierStats(supplier);
                if (outstanding <= 0) return null;
                const ageClass = maxAge > 90 ? 'text-red-600 dark:text-red-400' : maxAge > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300';
                return (
                  <tr key={supplier._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{supplier.name}</td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">{supplierPurchases.length}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">LKR {totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">LKR {paidAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => setOutstandingBreakdown({ supplier, invoices: supplierPurchases })} className="font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer">
                        LKR {outstanding.toLocaleString()}
                      </button>
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${ageClass}`}>{maxAge > 0 ? `${maxAge}d` : '-'}</td>
                  </tr>
                );
              }).filter(Boolean)
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-sm">
              <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Total</td>
              <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{purchases.length}</td>
              <td className="py-3 px-4 text-right text-slate-900 dark:text-white">LKR {purchases.reduce((s, p) => s + (p.totalAmount || 0), 0).toLocaleString()}</td>
              <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">LKR {purchases.reduce((s, p) => s + (p.paidAmount || 0), 0).toLocaleString()}</td>
              <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">LKR {purchases.reduce((s, p) => s + ((p.totalAmount || 0) - (p.paidAmount || 0)), 0).toLocaleString()}</td>
              <td className="py-3 px-4 text-right text-slate-500">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Outstanding Breakdown Modal */}
      {outstandingBreakdown && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/50 backdrop-blur-sm" onClick={() => setOutstandingBreakdown(null)}>
          <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{companies[0]?.name || 'DEENIYA'}</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{outstandingBreakdown.supplier.name}</h3>
              </div>
              <button onClick={() => setOutstandingBreakdown(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-3 pr-4 font-semibold">Invoice Date</th>
                    <th className="py-3 pr-4 font-semibold">Invoice No</th>
                    <th className="py-3 pr-4 font-semibold text-right">Invoice Amount</th>
                    <th className="py-3 pr-4 font-semibold text-right">Paid Amount</th>
                    <th className="py-3 pr-4 font-semibold text-right">Balance</th>
                    <th className="py-3 font-semibold text-right">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {(() => {
                    const today = new Date();
                    return outstandingBreakdown.invoices.map(inv => {
                      const bal = (inv.totalAmount || 0) - (inv.paidAmount || 0);
                      let ageDays = 0;
                      if (inv.date) {
                        const invDate = new Date(inv.date);
                        if (!isNaN(invDate)) ageDays = Math.floor((today - invDate) / (1000 * 60 * 60 * 24));
                      }
                      const ageClass = ageDays > 90 ? 'text-red-600 dark:text-red-400' : ageDays > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500';
                      return (
                        <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{inv.date}</td>
                          <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                          <td className="py-3 pr-4 text-right text-slate-900 dark:text-white">LKR {Number(inv.totalAmount || 0).toLocaleString()}</td>
                          <td className="py-3 pr-4 text-right text-emerald-600 dark:text-emerald-400">LKR {Number(inv.paidAmount || 0).toLocaleString()}</td>
                          <td className={`py-3 pr-4 text-right font-bold ${bal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>{bal > 0 ? `LKR ${bal.toLocaleString()}` : 'Settled'}</td>
                          <td className={`py-3 text-right font-semibold ${ageClass}`}>{ageDays > 0 ? `${ageDays}d` : '-'}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-sm">
                    <td colSpan="2" className="py-3 pr-4 text-slate-700 dark:text-slate-300">Grand Total</td>
                    <td className="py-3 pr-4 text-right text-slate-900 dark:text-white">LKR {outstandingBreakdown.invoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right text-emerald-600 dark:text-emerald-400">LKR {outstandingBreakdown.invoices.reduce((s, inv) => s + (inv.paidAmount || 0), 0).toLocaleString()}</td>
                    <td className="py-3 text-right text-rose-600 dark:text-rose-400">LKR {outstandingBreakdown.invoices.reduce((s, inv) => s + ((inv.totalAmount || 0) - (inv.paidAmount || 0)), 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
