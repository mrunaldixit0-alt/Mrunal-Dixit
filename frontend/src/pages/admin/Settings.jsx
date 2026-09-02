import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Save, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchInfo();
  }, []);

  const fetchInfo = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/restaurant');
      if (res.data) {
        setName(res.data.name || '');
        setDescription(res.data.description || '');
        setAddress(res.data.address || '');
        setPhone(res.data.phone || '');
        setEmail(res.data.email || '');
        setOpeningHours(res.data.opening_hours || '');
      }
    } catch (err) {
      console.error('Failed to fetch restaurant settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const res = await axios.put('/api/restaurant', {
        name,
        description,
        address,
        phone,
        email,
        opening_hours: openingHours
      });
      setMsg('Restaurant details updated successfully! Changes reflected live across customer website.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMsg(err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500 text-xs">Loading restaurant configuration...</div>;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-black text-white tracking-tight">Restaurant Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Update restaurant name, location address, contact numbers, hours & description.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase">Restaurant Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase">Restaurant Description</label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase">Physical Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase">Opening Hours</label>
          <input
            type="text"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="Mon - Sun: 08:00 AM - 11:00 PM"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Information...' : 'Save Restaurant Details'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
