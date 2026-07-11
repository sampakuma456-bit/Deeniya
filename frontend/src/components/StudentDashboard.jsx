import React, { useState, useEffect } from 'react';
import UserManager from './UserManager';

const STUDENT_API = 'http://localhost:5000/api/students';
const EXAM_API = 'http://localhost:5000/api/exams';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { key: 'data-entry', label: 'Data Entry', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { key: 'exam-results', label: 'Exam Results', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { key: 'report', label: 'Report', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'user-control', label: 'User Control', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }
];

export default function StudentDashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash && navItems.some(n => n.key === hash) ? hash : 'dashboard';
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && navItems.some(n => n.key === hash)) setActiveNav(hash);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const sidebarItem = (item) => (
    <a key={item.key} href={`#${item.key}`} onClick={(e) => { e.preventDefault(); setActiveNav(item.key); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        activeNav === item.key
          ? 'bg-indigo-500/20 text-indigo-400 shadow-sm'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}>
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
      </svg>
      <span>{item.label}</span>
    </a>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-slate-900/60 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-lg font-bold text-white tracking-tight">Student MS</h1>
          <p className="text-xs text-slate-500 mt-0.5">Welcome, {user?.username || user?.name || 'User'}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(sidebarItem)}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 relative" style={{
        backgroundImage: `linear-gradient(rgba(15,23,42,0.88), rgba(15,23,42,0.88)), url('https://images.pexels.com/photos/37350652/pexels-photo-37350652.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {activeNav === 'dashboard' && <DashboardClock time={currentTime} formatTime={formatTime} formatDate={formatDate} />}
        {activeNav === 'data-entry' && <DataEntry />}
        {activeNav === 'exam-results' && <ExamResults />}
        {activeNav === 'report' && <ReportSection />}
        {activeNav === 'user-control' && <UserControl />}
      </main>
    </div>
  );
}

/* ── Dashboard Clock ── */
function DashboardClock({ time, formatTime, formatDate }) {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <div className="text-8xl font-bold text-white tracking-widest tabular-nums mb-4">
          {formatTime(time)}
        </div>
        <div className="text-2xl text-slate-400 font-light">
          {formatDate(time)}
        </div>
      </div>
    </div>
  );
}

/* ── Data Entry (Students) ── */
function DataEntry() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', course: '', fee: '' });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch(STUDENT_API);
      const data = await res.json();
      setStudents(data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch(`${STUDENT_API}/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch(STUDENT_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      setForm({ name: '', email: '', phone: '', course: '', fee: '' });
      setEditingId(null);
      fetchStudents();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (s) => {
    setForm({ name: s.name, email: s.email, phone: s.phone, course: s.course, fee: s.fee });
    setEditingId(s._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    await fetch(`${STUDENT_API}/${id}`, { method: 'DELETE' });
    fetchStudents();
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.course?.toLowerCase().includes(search.toLowerCase())
  );

  const totalFee = students.reduce((sum, s) => sum + (Number(s.fee) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit' : 'Add'} Student</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          <input name="course" placeholder="Course" value={form.course} onChange={handleChange} required
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          <input name="fee" type="number" placeholder="Fee (LKR)" value={form.fee} onChange={handleChange} required
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          <div className="flex gap-2 items-end">
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all">
              {editingId ? 'Update' : 'Save'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setForm({ name: '', email: '', phone: '', course: '', fee: '' }); setEditingId(null); }}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-all">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Students List</h2>
          <input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 w-64" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-3 px-3 font-semibold">#</th>
                <th className="py-3 px-3 font-semibold">Name</th>
                <th className="py-3 px-3 font-semibold">Email</th>
                <th className="py-3 px-3 font-semibold">Phone</th>
                <th className="py-3 px-3 font-semibold">Course</th>
                <th className="py-3 px-3 font-semibold text-right">Fee (LKR)</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((s, i) => (
                <tr key={s._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                  <td className="py-3 px-3 text-white font-medium">{s.name}</td>
                  <td className="py-3 px-3 text-slate-300">{s.email}</td>
                  <td className="py-3 px-3 text-slate-300">{s.phone || '-'}</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/10 text-indigo-400">{s.course}</span></td>
                  <td className="py-3 px-3 text-right text-white font-semibold">{Number(s.fee).toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">
                    <button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold mr-3">Edit</button>
                    <button onClick={() => handleDelete(s._id)} className="text-rose-400 hover:text-rose-300 text-xs font-semibold">Del</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No students found</td></tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-800 font-bold text-sm">
                  <td colSpan={5} className="py-3 px-3 text-slate-400 uppercase tracking-wide text-xs">Total ({filtered.length} students)</td>
                  <td className="py-3 px-3 text-right text-rose-400">{totalFee.toLocaleString()}</td>
                  <td className="py-3 px-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Exam Results ── */
function ExamResults() {
  const [results, setResults] = useState([]);
  const [form, setForm] = useState({ studentName: '', subject: '', marks: '', totalMarks: '100', examType: 'Midterm', date: '' });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchResults(); }, []);

  const fetchResults = async () => {
    try {
      const res = await fetch(EXAM_API);
      const data = await res.json();
      setResults(data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, marks: Number(form.marks), totalMarks: Number(form.totalMarks) };
      if (editingId) {
        await fetch(`${EXAM_API}/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(EXAM_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setForm({ studentName: '', subject: '', marks: '', totalMarks: '100', examType: 'Midterm', date: '' });
      setEditingId(null);
      fetchResults();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (r) => {
    setForm({ studentName: r.studentName, subject: r.subject, marks: r.marks, totalMarks: r.totalMarks, examType: r.examType, date: r.date || '' });
    setEditingId(r._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam result?')) return;
    await fetch(`${EXAM_API}/${id}`, { method: 'DELETE' });
    fetchResults();
  };

  const filtered = results.filter(r =>
    r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    r.subject?.toLowerCase().includes(search.toLowerCase()) ||
    r.examType?.toLowerCase().includes(search.toLowerCase())
  );

  const avgMarks = results.length ? (results.reduce((s, r) => s + (Number(r.marks) || 0), 0) / results.length).toFixed(1) : '0';
  const passed = results.filter(r => (Number(r.marks) / Number(r.totalMarks || 100)) * 100 >= 50).length;

  const gradeColor = (grade) => {
    if (grade === 'A') return 'text-emerald-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    if (grade === 'D') return 'text-orange-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Exams" value={results.length} color="text-indigo-400" />
        <StatCard label="Average Marks" value={avgMarks} color="text-blue-400" />
        <StatCard label="Passed" value={`${passed}/${results.length}`} color="text-emerald-400" />
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit' : 'Add'} Exam Result</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input name="studentName" placeholder="Student Name" value={form.studentName} onChange={handleChange} required
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          <input name="subject" placeholder="Subject" value={form.subject} onChange={handleChange} required
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          <input name="marks" type="number" placeholder="Marks" value={form.marks} onChange={handleChange} required
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          <input name="totalMarks" type="number" placeholder="Total Marks" value={form.totalMarks} onChange={handleChange}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          <select name="examType" value={form.examType} onChange={handleChange}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
            <option value="Midterm">Midterm</option>
            <option value="Final">Final</option>
            <option value="Quiz">Quiz</option>
            <option value="Assignment">Assignment</option>
          </select>
          <input name="date" type="date" value={form.date} onChange={handleChange}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          <div className="flex gap-2 items-end">
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all">
              {editingId ? 'Update' : 'Save'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setForm({ studentName: '', subject: '', marks: '', totalMarks: '100', examType: 'Midterm', date: '' }); setEditingId(null); }}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-all">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Exam Results List</h2>
          <input placeholder="Search results..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 w-64" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-3 px-3 font-semibold">#</th>
                <th className="py-3 px-3 font-semibold">Student</th>
                <th className="py-3 px-3 font-semibold">Subject</th>
                <th className="py-3 px-3 font-semibold text-right">Marks</th>
                <th className="py-3 px-3 font-semibold text-right">Total</th>
                <th className="py-3 px-3 font-semibold text-center">Grade</th>
                <th className="py-3 px-3 font-semibold">Type</th>
                <th className="py-3 px-3 font-semibold">Date</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((r, i) => (
                <tr key={r._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                  <td className="py-3 px-3 text-white font-medium">{r.studentName}</td>
                  <td className="py-3 px-3 text-slate-300">{r.subject}</td>
                  <td className="py-3 px-3 text-right text-white">{r.marks}</td>
                  <td className="py-3 px-3 text-right text-slate-400">{r.totalMarks || 100}</td>
                  <td className="py-3 px-3 text-center"><span className={`font-bold ${gradeColor(r.grade)}`}>{r.grade || '-'}</span></td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/10 text-indigo-400">{r.examType}</span></td>
                  <td className="py-3 px-3 text-slate-400">{r.date || '-'}</td>
                  <td className="py-3 px-3 text-right">
                    <button onClick={() => handleEdit(r)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold mr-3">Edit</button>
                    <button onClick={() => handleDelete(r._id)} className="text-rose-400 hover:text-rose-300 text-xs font-semibold">Del</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-slate-500">No exam results found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Report ── */
function ReportSection() {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(STUDENT_API).then(r => r.json()),
      fetch(EXAM_API).then(r => r.json())
    ]).then(([s, e]) => {
      setStudents(s);
      setResults(e);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-slate-400 py-20">Loading report data...</div>;

  const totalStudents = students.length;
  const totalFee = students.reduce((sum, s) => sum + (Number(s.fee) || 0), 0);
  const totalExams = results.length;
  const avgMarks = results.length ? (results.reduce((s, r) => s + (Number(r.marks) || 0), 0) / results.length).toFixed(1) : '0';
  const passed = results.filter(r => (Number(r.marks) / Number(r.totalMarks || 100)) * 100 >= 50).length;
  const passRate = results.length ? ((passed / results.length) * 100).toFixed(1) : '0';
  const topSubject = results.length ? [...new Set(results.map(r => r.subject))].reduce((a, b) => {
    const aMarks = results.filter(r => r.subject === a).reduce((s, r) => s + (Number(r.marks) || 0), 0) / results.filter(r => r.subject === a).length;
    const bMarks = results.filter(r => r.subject === b).reduce((s, r) => s + (Number(r.marks) || 0), 0) / results.filter(r => r.subject === b).length;
    return aMarks > bMarks ? a : b;
  }, '') : '-';

  const courseDist = students.reduce((acc, s) => {
    acc[s.course] = (acc[s.course] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={totalStudents} color="text-indigo-400" />
        <StatCard label="Total Fees (LKR)" value={totalFee.toLocaleString()} color="text-emerald-400" />
        <StatCard label="Total Exams" value={totalExams} color="text-blue-400" />
        <StatCard label="Pass Rate" value={`${passRate}%`} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">Exam Statistics</h3>
          <div className="space-y-3">
            <Row label="Average Marks" value={avgMarks} />
            <Row label="Passed" value={`${passed} / ${totalExams}`} />
            <Row label="Top Subject" value={topSubject} />
            <Row label="Total Exams Taken" value={totalExams} />
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">Student Statistics</h3>
          <div className="space-y-3">
            <Row label="Total Students" value={totalStudents} />
            <Row label="Total Fees Collected" value={`LKR ${totalFee.toLocaleString()}`} />
            <Row label="Average Fee/Student" value={totalStudents ? `LKR ${(totalFee / totalStudents).toFixed(0)}` : 'LKR 0'} />
          </div>
          <h4 className="text-sm font-semibold text-slate-400 mt-5 mb-2">Course Distribution</h4>
          <div className="space-y-2">
            {Object.entries(courseDist).map(([course, count]) => (
              <div key={course} className="flex items-center gap-3">
                <span className="text-sm text-slate-300 w-32 truncate">{course}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(count / totalStudents) * 100}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── User Control (links to Donor Management User Manager) ── */
function UserControl() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">User Control</h2>
      <p className="text-sm text-slate-400 mb-6">Manage users from the Donor Management System.</p>
      <UserManager />
    </div>
  );
}

/* ── Shared Components ── */
function StatCard({ label, value, color }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
