import React from 'react';

export default function JournalReport() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
      <svg className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Journal Transaction</p>
      <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">Journal entry module is under development. Once journal entries are recorded, this report will display all journal transactions with date-range filtering and export support.</p>
    </div>
  );
}
