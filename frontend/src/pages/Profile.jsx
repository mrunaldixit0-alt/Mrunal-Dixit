import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Save, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await updateProfile(name, phone);
    if (res.success) {
      setMsg('Profile updated successfully!');
    } else {
      setMsg(res.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-2xl border border-amber-500/40">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-extrabold text-[10px] uppercase">
              {user?.role} Account
            </span>
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Updates</span>
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex justify-between text-xs">
          <Link to="/orders" className="font-bold text-amber-600 hover:underline">
            View My Order History →
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="font-bold text-purple-600 hover:underline">
              Go to Admin Dashboard →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
