import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';

export default function CustomerManager() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users/customers');
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-black text-white tracking-tight">Customer Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          View registered customer accounts, contact information, and order metrics.
        </p>
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading customer directory...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No registered customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4">Total Orders</th>
                  <th className="p-4">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-white text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">{c.email}</td>
                    <td className="p-4 text-slate-400">{c.phone || 'N/A'}</td>
                    <td className="p-4 text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-white">{c.total_orders}</td>
                    <td className="p-4 font-extrabold text-amber-400">₹{c.total_spent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
