import React, { useState } from 'react';
import ReportExportButtons from './ReportExportButtons';

export default function ItemStockReport({ purchases, gins }) {
  const [itemStockWithDetails, setItemStockWithDetails] = useState(false);

  return (
    <div className="report-print">
      <div className="flex items-center gap-6 mb-6">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">View Mode:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="itemStockView" checked={!itemStockWithDetails} onChange={() => setItemStockWithDetails(false)} className="w-4 h-4 text-teal-600 border-slate-300 dark:border-slate-700" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Without Details</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="itemStockView" checked={itemStockWithDetails} onChange={() => setItemStockWithDetails(true)} className="w-4 h-4 text-teal-600 border-slate-300 dark:border-slate-700" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">With Details</span>
        </label>
      </div>

      {!itemStockWithDetails ? (
        <div className="overflow-x-auto">
          <ReportExportButtons tableId="item-stock-summary-table" filename="Item_Stock_Summary" />
          <table id="item-stock-summary-table" className="w-full mt-4 text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                <th className="py-3 px-4 font-semibold">Item Name</th>
                <th className="py-3 px-4 font-semibold text-right">Total Qty</th>
                <th className="py-3 px-4 font-semibold text-right">Issue Qty</th>
                <th className="py-3 px-4 font-semibold text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
              {(() => {
                const itemMap = {};
                purchases.forEach(inv => {
                  (inv.items || []).forEach(line => {
                    const name = String(line.itemName || '').trim();
                    if (!name) return;
                    if (!itemMap[name]) itemMap[name] = { totalQty: 0, issueQty: 0 };
                    itemMap[name].totalQty += Number(line.qty) || 0;
                  });
                });
                gins.forEach(g => {
                  (g.items || []).forEach(gi => {
                    const name = String(gi.itemName || '').trim();
                    if (!name) return;
                    if (!itemMap[name]) itemMap[name] = { totalQty: 0, issueQty: 0 };
                    itemMap[name].issueQty += Number(gi.qty) || 0;
                  });
                });
                const entries = Object.entries(itemMap);
                if (entries.length === 0) {
                  return <tr><td colSpan="4" className="py-8 text-center text-slate-400">No items found.</td></tr>;
                }
                return entries.map(([itemName, data], idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{itemName}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{data.totalQty}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{data.issueQty}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">{data.totalQty - data.issueQty}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <ReportExportButtons tableId="item-stock-detail-table" filename="Item_Stock_Details" />
          <table id="item-stock-detail-table" className="w-full mt-4 text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                <th className="py-3 px-4 font-semibold">Item Name</th>
                <th className="py-3 px-4 font-semibold">Purchase Date</th>
                <th className="py-3 px-4 font-semibold">Supplier Name</th>
                <th className="py-3 px-4 font-semibold">Invoice Number</th>
                <th className="py-3 px-4 font-semibold text-right">Qty</th>
                <th className="py-3 px-4 font-semibold">Issue Date</th>
                <th className="py-3 px-4 font-semibold text-right">Issue Qty</th>
                <th className="py-3 px-4 font-semibold">Takeover Person</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
              {(() => {
                const rows = [];
                purchases.forEach(inv => {
                  (inv.items || []).forEach(line => {
                    const itemName = String(line.itemName || '').trim();
                    if (!itemName) return;
                    const matchingGins = gins.filter(g => (g.items || []).some(gi => String(gi.itemName || '').trim().toLowerCase() === itemName.toLowerCase()));
                    if (matchingGins.length === 0) {
                      rows.push({ itemName, inv, line, ginDate: '', ginQty: 0, handOver: '' });
                    } else {
                      matchingGins.forEach(g => {
                        const matchedGinLine = (g.items || []).find(gi => String(gi.itemName || '').trim().toLowerCase() === itemName.toLowerCase());
                        rows.push({
                          itemName,
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
                  return <tr><td colSpan="8" className="py-8 text-center text-slate-400">No items found.</td></tr>;
                }
                return rows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{r.itemName}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.inv.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{r.inv.supplierName}</td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white">{r.inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{Number(r.line.qty) || 0}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.ginDate || '-'}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{r.ginQty > 0 ? r.ginQty : '-'}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.handOver || '-'}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
