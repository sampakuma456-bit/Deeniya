import React, { useState } from 'react';
import ReportExportButtons from './ReportExportButtons';

export default function TillReport({ tills, donors, routes }) {
  const [tillReportFromDate, setTillReportFromDate] = useState('');
  const [tillReportToDate, setTillReportToDate] = useState('');
  const [tillReportRouteId, setTillReportRouteId] = useState('');
  const [tillReportYear, setTillReportYear] = useState('');
  const [tillReportDonorId, setTillReportDonorId] = useState('');

  return (
    <div className="report-print">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">From Date</label>
          <input type="date" value={tillReportFromDate} onChange={e => setTillReportFromDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">To Date</label>
          <input type="date" value={tillReportToDate} onChange={e => setTillReportToDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Route</label>
          <select value={tillReportRouteId} onChange={e => setTillReportRouteId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 appearance-none">
            <option value="">All Routes</option>
            {routes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Year</label>
          <select value={tillReportYear} onChange={e => setTillReportYear(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 appearance-none">
            <option value="">All Years</option>
            {(() => {
              const years = new Set();
              tills.forEach(t => {
                ['issueDate', 'collectedDate'].forEach(f => { if (t[f]) { const y = t[f].slice(0, 4); if (y) years.add(y); } });
              });
              return [...years].sort().reverse().map(y => <option key={y} value={y}>{y}</option>);
            })()}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Donor</label>
          <select value={tillReportDonorId} onChange={e => setTillReportDonorId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 appearance-none">
            <option value="">All Donors</option>
            {[...donors].sort((a, b) => a.name.localeCompare(b.name)).map(d => (
              <option key={d._id} value={d._id}>{d.name} {d.donorCode ? `(${d.donorCode})` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <ReportExportButtons tableId="till-report-table" filename="Till_Report" />
        <table id="till-report-table" className="w-full mt-4 text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              <th className="py-3 px-4 font-semibold">Issue Date</th>
              <th className="py-3 px-4 font-semibold">Till No</th>
              <th className="py-3 px-4 font-semibold">Donor Name</th>
              <th className="py-3 px-4 font-semibold text-right">Received Amount</th>
              <th className="py-3 px-4 font-semibold">Receipt Number</th>
              <th className="py-3 px-4 font-semibold">Receipt Date</th>
              <th className="py-3 px-4 font-semibold text-right">Age (Days)</th>
              <th className="py-3 px-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
            {(() => {
              const today = new Date();
              let filtered = tills.filter(t => {
                const dates = [t.issueDate, t.collectedDate].filter(Boolean);
                if (tillReportFromDate && dates.length) {
                  if (!dates.some(d => d >= tillReportFromDate)) return false;
                }
                if (tillReportToDate && dates.length) {
                  if (!dates.some(d => d <= tillReportToDate)) return false;
                }
                if (tillReportYear) {
                  if (!dates.some(d => d.slice(0, 4) === tillReportYear)) return false;
                }
                if (tillReportRouteId) {
                  const donor = donors.find(d => d._id === t.donorId);
                  if (!donor || donor.routeId !== tillReportRouteId) return false;
                }
                if (tillReportDonorId && t.donorId !== tillReportDonorId) return false;
                return true;
              });
              if (filtered.length === 0) {
                return <tr><td colSpan="8" className="py-8 text-center text-slate-400">No till records found.</td></tr>;
              }
              return filtered.map(t => {
                const issueDate = t.issueDate ? new Date(t.issueDate) : null;
                const ageDays = issueDate && !isNaN(issueDate) ? Math.floor((today - issueDate) / (1000 * 60 * 60 * 24)) : 0;
                const ageClass = t.status === 'Collected' ? 'text-slate-500 dark:text-slate-400' : ageDays > 90 ? 'text-red-600 dark:text-red-400' : ageDays > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300';
                return (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{t.issueDate || '-'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{t.tillNumber}</td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white">{t.donorName}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">{t.amount ? `LKR ${Number(t.amount).toLocaleString()}` : '-'}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{t.receiptNumber || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{t.collectedDate || '-'}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${ageClass}`}>{ageDays > 0 ? `${ageDays}d` : '-'}</td>
                    <td className="py-3 px-4">{t.status === 'Collected' ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Collected</span> : <span className="text-amber-600 dark:text-amber-400 font-semibold">Issued</span>}</td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
