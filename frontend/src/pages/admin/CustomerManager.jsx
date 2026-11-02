import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function CustomerManager() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showFeedback = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchCustomers = async () => {
    try {
      setIsRefreshing(true);
      const res = await axios.get('/api/users/customers');
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      showFeedback('Failed to load registered customers.', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone || '');
    setPassword('');
    setModalOpen(true);
  };

  const handleDelete = async (id, customerName) => {
    if (!window.confirm(`Are you sure you want to delete customer account "${customerName}"? This will update the total customers count immediately.`)) {
      return;
    }

    try {
      await axios.delete(`/api/users/customers/${id}`);
      setCustomers(prev => prev.filter(c => c.id !== id));
      showFeedback(`Customer "${customerName}" deleted successfully.`);
    } catch (err) {
      console.error('Failed to delete customer:', err);
      showFeedback(err.response?.data?.error || 'Failed to delete customer.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCustomer) {
        const res = await axios.put(`/api/users/customers/${editingCustomer.id}`, {
          name,
          email,
          phone
        });
        setCustomers(prev =>
          prev.map(c => (c.id === editingCustomer.id ? { ...c, ...res.data.customer } : c))
        );
        showFeedback('Customer details updated successfully!');
      } else {
        const res = await axios.post('/api/users/customers', {
          name,
          email,
          phone,
          password
        });
        setCustomers(prev => [res.data.customer, ...prev]);
        showFeedback('New customer registered successfully!');
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save customer account.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered list
  const filteredCustomers = customers.filter(c => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.phone || '').includes(term)
    );
  });

  const totalRegistered = customers.length;
  const activeCustomers = customers.filter(c => (c.total_orders || 0) > 0).length;
  const totalOrdersPlaced = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
  const totalSpentAll = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Customer Management</h1>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>{totalRegistered} Registered</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage registered customer accounts, add new customers, inspect contact info, and track order spending.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCustomers}
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-3 rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 border transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{totalRegistered}</p>
          <p className="text-[11px] text-slate-500 font-medium">Realtime registered count</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Buyers</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{activeCustomers}</p>
          <p className="text-[11px] text-slate-500 font-medium">Placed 1+ restaurant orders</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Orders</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{totalOrdersPlaced}</p>
          <p className="text-[11px] text-slate-500 font-medium">Accumulated order total</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Spending</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400">₹{totalSpentAll}</p>
          <p className="text-[11px] text-slate-500 font-medium">Total customer revenue</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
        <Search className="w-4 h-4 text-slate-400 mr-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers dynamically by name, email, or phone number..."
          className="w-full bg-transparent text-white text-xs placeholder-slate-500 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-400 hover:text-white text-xs">
            Clear
          </button>
        )}
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading customer directory...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
            <p>No customers found matching "{search}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-center">Orders</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block">{c.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID #{c.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 font-mono">{c.email}</td>
                    <td className="p-4 text-slate-400">{c.phone || 'N/A'}</td>
                    <td className="p-4 text-slate-400">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 font-bold text-white">
                        {c.total_orders || 0}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-amber-400">₹{c.total_spent || 0}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          title="Delete Customer"
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingCustomer ? 'Edit Customer Details' : 'Register New Customer'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {!editingCustomer && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Initial Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Defaults to Customer@123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Leave blank to automatically assign "Customer@123".
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
