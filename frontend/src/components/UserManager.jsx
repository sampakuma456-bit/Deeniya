import React, { useState, useEffect } from 'react';
import PERMISSION_GROUPS, { ALL_PERMISSIONS, actionLabels, DONOR_ALLOWED_MODULES, getDonorPermissions } from '../config/permissions';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit'
  const [editingUser, setEditingUser] = useState(null);
  
  const [companyCode, setCompanyCode] = useState('CMP');
  
  const [form, setForm] = useState({ 
    name: '', 
    userIdInput: '', 
    phone: '',
    password: '', 
    role: 'staff', 
    permissions: [] 
  });
  
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyCode = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/master/company');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const comp = data[0];
          setCompanyCode(comp.code || comp.regNo || comp.name.substring(0, 3).toUpperCase());
        }
      }
    } catch (err) {
      console.error('Failed to fetch company code', err);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
    fetchCompanyCode();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ 
      name: '', 
      userIdInput: '', 
      phone: '',
      password: '', 
      role: 'staff', 
      permissions: [...ALL_PERMISSIONS] 
    });
    setFormError(null);
    setView('create');
  };

  const openEdit = (user) => {
    setEditingUser(user);
    
    let extractedUserId = user.email;
    if (user.email && user.email.includes('@')) {
      const parts = user.email.split('@');
      extractedUserId = parts.slice(1).join('@');
    }
    
    setForm({
      name: user.name,
      userIdInput: extractedUserId,
      phone: user.phone || '',
      password: '',
      role: user.role,
      permissions: user.permissions && user.permissions.length ? [...user.permissions] : [...ALL_PERMISSIONS]
    });
    setFormError(null);
    setView('edit');
  };

  const permKey = (moduleKey, action) => `${moduleKey}:${action}`;

  const togglePermission = (fullKey) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(fullKey)
        ? prev.permissions.filter(p => p !== fullKey)
        : [...prev.permissions, fullKey]
    }));
  };

  const toggleModule = (moduleKey, actions, checked) => {
    setForm(prev => {
      const keys = actions.map(a => permKey(moduleKey, a));
      const filtered = prev.permissions.filter(p => !keys.includes(p));
      return { ...prev, permissions: checked ? [...filtered, ...keys] : filtered };
    });
  };

  const selectAll = () => setForm(prev => ({
    ...prev,
    permissions: prev.role === 'customer' ? getDonorPermissions() : [...ALL_PERMISSIONS]
  }));
  const clearAll = () => setForm(prev => ({ ...prev, permissions: [] }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.userIdInput) { setFormError('Name and User ID are required'); return; }
    if (!editingUser && !form.password) { setFormError('Password is required'); return; }
    setSaving(true);
    setFormError(null);
    try {
      const email = `${companyCode}@${form.userIdInput}`;
      
      const body = { 
        name: form.name, 
        email, 
        phone: form.phone,
        password: form.password, 
        role: form.role, 
        permissions: form.permissions 
      };
      
      if (editingUser && !body.password) delete body.password;
      
      const url = editingUser
        ? `http://localhost:5000/api/users/${editingUser._id}`
        : 'http://localhost:5000/api/users';
        
      const res = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save user');
      
      setView('list');
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const roleColors = {
    'super-admin': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    'admin': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    'staff': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    'customer': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  };

  const roleLabels = {
    'super-admin': 'Super Admin',
    'admin': 'Admin',
    'staff': 'Staff',
    'customer': 'Customer (Donor)'
  };

  const lastLoginText = (user) => {
    if (!user.lastLogin) return 'Never';
    const diff = Date.now() - new Date(user.lastLogin).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (view === 'create' || view === 'edit') {
    return (
      <div className="max-w-4xl mx-auto pb-10">
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {editingUser ? 'Edit User Details' : 'Add User Details'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Fill in the details below to {editingUser ? 'update the' : 'create a new'} user account.
              </p>
            </div>
            <button onClick={() => setView('list')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          {formError && <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-800/30">{formError}</div>}
          
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">User Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">User ID</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {companyCode}@
                  </span>
                  <input type="text" value={form.userIdInput} onChange={e => setForm({ ...form, userIdInput: e.target.value })} placeholder="username" required
                    className="flex-1 rounded-r-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Telephone No</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Password {editingUser && <span className="text-amber-500 normal-case font-normal">(leave blank to keep current)</span>}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editingUser ? 'Leave blank to keep' : 'Min 6 characters'}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Role</label>
                <select value={form.role} onChange={e => {
                    const newRole = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      role: newRole,
                      permissions: newRole === 'customer' ? getDonorPermissions() : prev.permissions
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                  <option value="customer">Customer (Donor)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Page & Control Permissions</label>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Select the specific modules and actions this user can access.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={selectAll} className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/30 transition-colors">Select All</button>
                  <button type="button" onClick={clearAll} className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors">Clear All</button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {PERMISSION_GROUPS.map(group => {
                  const filteredModules = form.role === 'customer'
                    ? group.modules.filter(m => DONOR_ALLOWED_MODULES.includes(m.key))
                    : group.modules;
                  if (filteredModules.length === 0) return null;
                  return (
                    <div key={group.label} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/20">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">{group.label}</p>
                      <div className="space-y-1.5">
                        {filteredModules.map(mod => {
                        const allChecked = mod.actions.every(a => form.permissions.includes(permKey(mod.key, a)));
                        const someChecked = mod.actions.some(a => form.permissions.includes(permKey(mod.key, a)));
                        return (
                          <div key={mod.key} className="flex flex-col sm:flex-row sm:items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                            <div className="flex items-center gap-3 shrink-0">
                              <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                                onChange={() => toggleModule(mod.key, mod.actions, !allChecked)}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500" />
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 min-w-[150px]">{mod.label}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                              {mod.actions.map(action => {
                                const fullKey = permKey(mod.key, action);
                                const isChecked = form.permissions.includes(fullKey);
                                return (
                                  <label key={fullKey}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${isChecked ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50' : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'}`}>
                                    <input type="checkbox" checked={isChecked} onChange={() => togglePermission(fullKey)}
                                      className="sr-only" />
                                    {actionLabels[action]}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setView('list')}
                className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all">
                {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Accounts</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage system administrators and staff access levels.</p>
          </div>
          <button onClick={openCreate}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add User
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading users...</div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="py-4 px-6 font-medium">User Name</th>
                  <th className="py-4 px-6 font-medium">User ID</th>
                  <th className="py-4 px-6 font-medium">Telephone no</th>
                  <th className="py-4 px-6 font-medium">Role</th>
                  <th className="py-4 px-6 font-medium">Privileges</th>
                  <th className="py-4 px-6 font-medium">Last Login</th>
                  <th className="py-4 px-6 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">No users found. Click "Add User" to add one.</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                            {getInitials(user.name)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{user.email}</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{user.phone || '-'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[user.role] || roleColors.staff}`}>
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {user.permissions && user.permissions.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            {user.permissions.length} modules
                          </span>
                        ) : (
                          <span className="text-xs text-amber-500">None</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500">{lastLoginText(user)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Edit user">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(user._id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete user">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
