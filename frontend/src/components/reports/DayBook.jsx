import React, { useState } from 'react';
import ReportExportButtons from './ReportExportButtons';

export default function DayBook() {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [reportData, setReportData] = useState(null);

  const fetchReport = async () => {
    if (!filterDate) { alert('Please select a date.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/daybook/daybook?date=${filterDate}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReportData(data);
      setReportReady(true);
    } catch (err) {
      alert('Error fetching Day Book: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!reportReady) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Day Book</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Select a date to view all transactions for that day</p>
        </div>
        <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Select Date</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            {loading ? 'Loading...' : 'View Report →'}
          </button>
        </div>
      </div>
    );
  }

  const { date, openingBalance, openingBalanceRaw, closingBalance, closingBalanceRaw, entries, totalDr, totalCr } = reportData;

  const formatAmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const showInDr = (val) => {
    const n = parseFloat(String(val).replace(/,/g, ''));
    return n < 0 ? formatAmt(Math.abs(n)) : null;
  };
  const showInCr = (val) => {
    const n = parseFloat(String(val).replace(/,/g, ''));
    return n >= 0 ? formatAmt(n) : null;
  };

  return (
    <div className="report-print">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl px-5 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setReportReady(false); setReportData(null); }}
            className="no-print text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← Change Filters
          </button>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Day Book <span className="text-purple-600 dark:text-purple-400">| {date}</span>
            {entries && entries.length > 0 && (
              <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal">| {entries.length} entries</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 no-print">
          <ReportExportButtons tableId="daybook-table" filename={`DayBook_${date}`} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table id="daybook-table" className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4 font-semibold">Account Code</th>
              <th className="py-3 px-4 font-semibold">Account Name</th>
              <th className="py-3 px-4 font-semibold">Description</th>
              <th className="py-3 px-4 font-semibold text-right">Dr (LKR)</th>
              <th className="py-3 px-4 font-semibold text-right">Cr (LKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
            {entries.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-10 text-center text-slate-400">No transactions found for this date.</td>
              </tr>
            ) : (
              <>
                <tr className="bg-slate-50 dark:bg-slate-900/40 font-semibold text-slate-700 dark:text-slate-300">
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 italic">Opening Balance</td>
                  <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">{showInDr(openingBalance) || '-'}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">{showInCr(openingBalance) || '-'}</td>
                </tr>
                {entries.map((entry, i) => (
                  <tr key={i} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{entry.accountId}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{entry.accountName}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-900 dark:text-white">{entry.number}</span>
                      {entry.description ? <span className="ml-1">- {entry.description}</span> : null}
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${entry.rawDr > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>{entry.dr || '-'}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${entry.rawCr > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{entry.cr || '-'}</td>
                  </tr>
                ))}
                <tr className="bg-indigo-50 dark:bg-indigo-900/10 font-bold text-sm border-t-2 border-indigo-200 dark:border-indigo-800/30">
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 italic">Closing Balance</td>
                  <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">{showInDr(closingBalance) || '-'}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">{showInCr(closingBalance) || '-'}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {entries.length > 0 && (
        <div className="flex justify-end gap-6 mt-4 text-xs font-semibold">
          <span className="text-rose-600 dark:text-rose-400">Total Dr: {formatAmt(totalDr)}</span>
          <span className="text-emerald-600 dark:text-emerald-400">Total Cr: {formatAmt(totalCr)}</span>
        </div>
      )}
    </div>
  );
}
