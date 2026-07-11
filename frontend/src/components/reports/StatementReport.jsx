import React, { useState } from 'react';
import ReportExportButtons from './ReportExportButtons';

export default function StatementReport({ expenses }) {
  const [statementFromDate, setStatementFromDate] = useState('');
  const [statementToDate, setStatementToDate] = useState('');
  const [statementAccountId, setStatementAccountId] = useState('');
  const [statementAccountName, setStatementAccountName] = useState('');
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementReady, setStatementReady] = useState(false);

  const fetchStatement = async () => {
    if (!statementAccountId) { alert('Please select an account.'); return; }
    if (!statementFromDate || !statementToDate) { alert('Please select from and to dates.'); return; }
    setStatementLoading(true);
    try {
      const params = new URLSearchParams({ accountId: statementAccountId, fromDate: statementFromDate, toDate: statementToDate });
      const res = await fetch(`http://localhost:5000/api/statement/statement?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatementData(data);
      setStatementReady(true);
    } catch (err) {
      alert('Error fetching statement: ' + err.message);
    } finally {
      setStatementLoading(false);
    }
  };

  if (!statementReady) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">From Date</label>
            <input type="date" value={statementFromDate} onChange={e => setStatementFromDate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">To Date</label>
            <input type="date" value={statementToDate} onChange={e => setStatementToDate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Select Account</label>
            <select value={statementAccountId} onChange={e => {
              const sel = e.target.value;
              setStatementAccountId(sel);
              const found = expenses.find(ex => ex.code === sel);
              setStatementAccountName(found ? found.description : '');
            }} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="">-- Select Account --</option>
              {expenses.map(ex => (
                <option key={ex._id} value={ex.code}>{ex.code} - {ex.description}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchStatement} disabled={statementLoading} className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all">
              {statementLoading ? 'Loading...' : 'View Report →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-print space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">{statementAccountId} - {statementAccountName}</span>
          <span className="mx-2">·</span>
          {statementFromDate} to {statementToDate}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="text-slate-500">Open: </span>
            <span className="font-bold text-slate-900 dark:text-white">LKR {statementData?.openingBalance || '0.00'}</span>
          </div>
          <div className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="text-slate-500">Close: </span>
            <span className="font-bold text-slate-900 dark:text-white">LKR {statementData?.closingBalance || '0.00'}</span>
          </div>
          <button onClick={() => { setStatementReady(false); setStatementData(null); }} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Change Filters</button>
        </div>
      </div>

      <ReportExportButtons tableId="statement-report-table" filename={`Statement_${statementAccountId}`} />

      <div className="overflow-x-auto">
        <table id="statement-report-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Receipt / Payment No</th>
              <th className="py-3 px-4 font-semibold">Description</th>
              <th className="py-3 px-4 font-semibold text-right">Dr Amount (LKR)</th>
              <th className="py-3 px-4 font-semibold text-right">Cr Amount (LKR)</th>
              <th className="py-3 px-4 font-semibold text-right">Running Balance (LKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
            <tr className="bg-slate-50 dark:bg-slate-900/40 font-semibold text-slate-700 dark:text-slate-300">
              <td className="py-3 px-4" colSpan="3">Opening Balance</td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">LKR {statementData?.openingBalance || '0.00'}</td>
            </tr>
            {(!statementData?.transactions || statementData.transactions.length === 0) ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">No transactions found for this account in the selected date range.</td>
              </tr>
            ) : (
              statementData.transactions.map((t, i) => (
                <tr key={`${t.type}-${t._id || i}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{t.date}</td>
                  <td className="py-3 px-4 font-mono text-xs">{t.number}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{t.description}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${t.rawDr > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>{t.drAmount || '-'}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${t.rawCr > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{t.crAmount || '-'}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">LKR {t.runningBalance}</td>
                </tr>
              ))
            )}
            <tr className="bg-slate-50 dark:bg-slate-900/40 font-semibold border-t-2 border-slate-300 dark:border-slate-700">
              <td className="py-3 px-4 text-slate-700 dark:text-slate-300" colSpan="2">Period Totals</td>
              <td className="py-3 px-4 text-slate-500"></td>
              <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">LKR {statementData?.totalDr || '0.00'}</td>
              <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">LKR {statementData?.totalCr || '0.00'}</td>
              <td className="py-3 px-4"></td>
            </tr>
            <tr className="bg-indigo-50 dark:bg-indigo-900/10 font-bold text-sm">
              <td className="py-3 px-4 text-slate-700 dark:text-slate-300" colSpan="5">Closing Balance</td>
              <td className="py-3 px-4 text-right text-indigo-700 dark:text-indigo-300">LKR {statementData?.closingBalance || '0.00'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
