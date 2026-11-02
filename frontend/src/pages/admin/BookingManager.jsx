import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Ban
} from 'lucide-react';

export default function BookingManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });

  // Modal State for New Booking
  const [modalOpen, setModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(2);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('19:00');
  const [specialRequests, setSpecialRequests] = useState('');
  const [status, setStatus] = useState('Confirmed');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [statusFilter]);

  const showFeedback = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchBookings = async () => {
    try {
      setIsRefreshing(true);
      const url = statusFilter === 'all' ? '/api/bookings' : `/api/bookings?status=${statusFilter}`;
      const res = await axios.get(url);
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      showFeedback('Failed to load table reservations.', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/bookings/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch booking stats:', err);
    }
  };

  const handleOpenAdd = () => {
    setCustomerName('');
    setCustomerEmail('');
    setPhone('');
    setGuests(2);
    setBookingDate(new Date().toISOString().split('T')[0]);
    setBookingTime('19:30');
    setSpecialRequests('');
    setStatus('Confirmed');
    setModalOpen(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(`/api/bookings/${id}/status`, { status: newStatus });
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, status: newStatus } : b))
      );
      fetchStats();
      showFeedback(`Booking status changed to ${newStatus}.`);
    } catch (err) {
      console.error('Failed to update status:', err);
      showFeedback('Failed to update booking status.', 'error');
    }
  };

  const handleDelete = async (id, bookingNumber) => {
    if (!window.confirm(`Are you sure you want to delete reservation ${bookingNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/bookings/${id}`);
      setBookings(prev => prev.filter(b => b.id !== id));
      fetchStats();
      showFeedback(`Reservation ${bookingNumber} deleted.`);
    } catch (err) {
      console.error('Failed to delete reservation:', err);
      showFeedback('Failed to delete reservation.', 'error');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        phone,
        guests: parseInt(guests, 10),
        booking_date: bookingDate,
        booking_time: bookingTime,
        special_requests: specialRequests,
        status
      };

      const res = await axios.post('/api/bookings', payload);
      setBookings(prev => [res.data.booking, ...prev]);
      fetchStats();
      setModalOpen(false);
      showFeedback(`Table booked successfully! Reference: ${res.data.booking.booking_number}`);
    } catch (err) {
      console.error('Failed to create booking:', err);
      showFeedback(err.response?.data?.error || 'Failed to create reservation.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.booking_number?.toLowerCase().includes(q) ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.phone?.toLowerCase().includes(q) ||
      b.customer_email?.toLowerCase().includes(q) ||
      b.booking_date?.includes(q)
    );
  });

  const getStatusBadge = (st) => {
    switch (st?.toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'completed':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'cancelled':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'pending':
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed top-20 right-4 z-50">
          <div
            className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-medium text-xs border ${
              feedback.type === 'error'
                ? 'bg-rose-900/90 border-rose-700'
                : 'bg-emerald-900/90 border-emerald-700'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        </div>
      )}

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Table Bookings</h1>
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Realtime Reservations</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage customer table reservations, guest seating capacities, and dining requests.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              fetchBookings();
              fetchStats();
            }}
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            title="Refresh bookings"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Reservation</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats.total}</p>
          <p className="text-[11px] text-slate-500">All registered reservations</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Pending Approval</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-400">{stats.pending}</p>
          <p className="text-[11px] text-slate-500">Awaiting confirmation</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Confirmed Tables</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.confirmed}</p>
          <p className="text-[11px] text-slate-500">Ready for dining</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Completed Diners</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-400">{stats.completed}</p>
          <p className="text-[11px] text-slate-500">Successfully served</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name, phone, ref..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-2" />
            Loading table reservations...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CalendarCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-white font-bold text-sm">No reservations found</p>
            <p className="text-slate-500 text-xs">
              {search ? 'Try adjusting your search criteria.' : 'No customer bookings currently in this category.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Ref #</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Dining Schedule</th>
                  <th className="p-4">Party Size</th>
                  <th className="p-4">Special Notes</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-amber-400">
                      <div>{b.booking_number}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {new Date(b.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{b.customer_name}</div>
                      <div className="flex items-center space-x-1 text-slate-400 text-[11px] mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{b.phone}</span>
                      </div>
                      {b.customer_email && (
                        <div className="flex items-center space-x-1 text-slate-500 text-[10px]">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{b.customer_email}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center space-x-1.5 font-bold text-white">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>{b.booking_date}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{b.booking_time}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>{b.guests} {b.guests === 1 ? 'Guest' : 'Guests'}</span>
                      </span>
                    </td>

                    <td className="p-4 max-w-xs">
                      {b.special_requests ? (
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-amber-200/90 italic">
                          "{b.special_requests}"
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[11px]">— None —</span>
                      )}
                    </td>

                    <td className="p-4">
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border uppercase tracking-wider focus:outline-none cursor-pointer bg-slate-950 ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        <option value="Pending" className="bg-slate-900 text-amber-400">Pending</option>
                        <option value="Confirmed" className="bg-slate-900 text-emerald-400">Confirmed</option>
                        <option value="Completed" className="bg-slate-900 text-blue-400">Completed</option>
                        <option value="Cancelled" className="bg-slate-900 text-rose-400">Cancelled</option>
                      </select>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                          <button
                            onClick={() => handleStatusChange(b.id, 'Cancelled')}
                            className="p-2 rounded-xl bg-amber-500/10 hover:bg-rose-500/20 text-amber-400 hover:text-rose-400 transition-colors"
                            title="Cancel Reservation"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(b.id, b.booking_number)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                          title="Delete reservation"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Manual Add Reservation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">New Table Reservation</h3>
                  <p className="text-xs text-slate-400">Create an in-person or phone reservation</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Customer Email (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Special Requests / Seating Notes
                </label>
                <textarea
                  rows="2"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Window side, high chair for infant, birthday anniversary..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 shadow-lg shadow-amber-500/20"
                >
                  {saving ? 'Saving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
