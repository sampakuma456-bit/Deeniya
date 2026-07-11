import React, { useState } from 'react';
import ReportExportButtons from './ReportExportButtons';

export default function ItemReport({ purchases, gins }) {
  const [itemReportSupplierFilter, setItemReportSupplierFilter] = useState('');
  const [itemReportItemFilter, setItemReportItemFilter] = useState('');
  const [itemReportFromDate, setItemReportFromDate] = useState('');
  const [itemReportToDate, setItemReportToDate] = useState('');

  return (
    <div className="report-print">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">From Date</label>
          <input type="date" value={itemReportFromDate} onChange={e => setItemReportFromDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">To Date</label>
          <input type="date" value={itemReportToDate} onChange={e => setItemReportToDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Supplier Name</label>
          <input type="text" value={itemReportSupplierFilter} onChange={e => setItemReportSupplierFilter(e.target.value)} placeholder="Filter by supplier..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Item Name</label>
          <input type="text" value={itemReportItemFilter} onChange={e => setItemReportItemFilter(e.target.value)} placeholder="Filter by item name..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <ReportExportButtons tableId="item-report-table" filename="Item_Report" />
        <table id="item-report-table" className="w-full mt-4 text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              <th className="py-3 px-4 font-semibold">Purchase Date</th>
              <th className="py-3 px-4 font-semibold">Supplier Name</th>
              <th className="py-3 px-4 font-semibold">Invoice Number</th>
              <th className="py-3 px-4 font-semibold">Item Name</th>
              <th className="py-3 px-4 font-semibold text-right">Qty</th>
              <th className="py-3 px-4 font-semibold text-right">Rate</th>
              <th className="py-3 px-4 font-semibold">Item Issue Date</th>
              <th className="py-3 px-4 font-semibold text-right">Issue Qty</th>
              <th className="py-3 px-4 font-semibold">Hand Over Person</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
            {(() => {
              const rows = [];
              purchases.forEach(inv => {
                (inv.items || []).forEach(line => {
                  const itemName = String(line.itemName || '').trim();
                  const matchSupplier = !itemReportSupplierFilter || inv.supplierName.toLowerCase().includes(itemReportSupplierFilter.toLowerCase());
                  const matchItem = !itemReportItemFilter || itemName.toLowerCase().includes(itemReportItemFilter.toLowerCase());
                  const matchFromDate = !itemReportFromDate || (inv.date && inv.date >= itemReportFromDate);
                  const matchToDate = !itemReportToDate || (inv.date && inv.date <= itemReportToDate);
                  if (!matchSupplier || !matchItem || !matchFromDate || !matchToDate) return;
                  const matchingGins = gins.filter(g => (g.items || []).some(gi => String(gi.itemName || '').trim().toLowerCase() === itemName.toLowerCase()));
                  if (matchingGins.length === 0) {
                    rows.push({ inv, line, ginDate: '', ginQty: 0, handOver: '' });
                  } else {
                    matchingGins.forEach(g => {
                      const matchedGinLine = (g.items || []).find(gi => String(gi.itemName || '').trim().toLowerCase() === itemName.toLowerCase());
                      rows.push({
                        inv,
                        line,
                        ginDate: g.date || '',
                        ginQty: matchedGinLine ? Number(matchedGinLine.qty) || 0 : 0,
                        handOver: g.issuedTo || ''
                      });
                    });
                  }
                });
              });
              if (rows.length === 0) {
                return <tr><td colSpan="9" className="py-8 text-center text-slate-400">No purchase items found.</td></tr>;
              }
              return rows.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.inv.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{r.inv.supplierName}</td>
                  <td className="py-3 px-4 text-slate-900 dark:text-white">{r.inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{r.line.itemName}</td>
                  <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{Number(r.line.qty) || 0}</td>
                  <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{Number(r.line.rate) || 0}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.ginDate || '-'}</td>
                  <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{r.ginQty > 0 ? r.ginQty : '-'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.handOver || '-'}</td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
