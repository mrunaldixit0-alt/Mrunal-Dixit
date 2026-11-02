import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  UtensilsCrossed,
  Layers,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  IndianRupee,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  CalendarCheck,
  Calendar,
  Clock,
  Phone,
  Mail,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchStats(true);
    // Realtime auto-refresh interval every 15 seconds
    const interval = setInterval(() => {
      fetchStats(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const showFeedback = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchStats = async (showFullLoading = false) => {
    try {
      if (showFullLoading) setLoading(true);
      setIsRefreshing(true);
      const res = await axios.get('/api/users/dashboard-stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      if (showFullLoading) setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      fetchStats(false);
      showFeedback(`Order #${orderId} status updated to ${newStatus}.`);
    } catch (err) {
      console.error('Failed to update order status:', err);
      showFeedback('Failed to update order status.', 'error');
    }
  };

  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      await axios.patch(`/api/bookings/${bookingId}/status`, { status: newStatus });
      fetchStats(false);
      showFeedback(`Reservation status updated to ${newStatus}.`);
    } catch (err) {
      console.error('Failed to update booking status:', err);
      showFeedback('Failed to update reservation status.', 'error');
    }
  };

  const getBookingBadge = (st) => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-800 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 bg-slate-900 animate-pulse rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Floating Feedback Notification */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
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

      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Realtime Synced</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            Realtime overview of restaurant performance, table bookings, menu availability & customer orders.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/bookings"
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Table Reservations</span>
          </Link>

          <button
            onClick={() => fetchStats(false)}
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid - Clickable & Dynamic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Total Customers Card */}
        <Link
          to="/admin/customers"
          className="group bg-slate-900 hover:bg-slate-850 p-5 rounded-3xl border border-slate-800 hover:border-blue-500/50 shadow-xl space-y-2 transition-all duration-200 transform hover:-translate-y-1 block relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-blue-400 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Customers</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-white group-hover:text-blue-300 transition-colors">
              {stats?.totalCustomers || 0}
            </p>
            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate">
            {stats?.activeOrderingCustomers ? `${stats.activeOrderingCustomers} active buyers` : 'Registered accounts'}
          </p>
        </Link>

        {/* Table Bookings Card */}
        <Link
          to="/admin/bookings"
          className="group bg-slate-900 hover:bg-slate-850 p-5 rounded-3xl border border-slate-800 hover:border-amber-500/50 shadow-xl space-y-2 transition-all duration-200 transform hover:-translate-y-1 block relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-400 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider">Table Bookings</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-white group-hover:text-amber-300 transition-colors">
              {stats?.totalBookings || 0}
            </p>
            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-bold pt-1">
            <span className="text-amber-400">● {stats?.pendingBookings || 0} Pending</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400">● {stats?.todayBookings || 0} Today</span>
          </div>
        </Link>

        {/* Total Orders Card */}
        <Link
          to="/admin/orders"
          className="group bg-slate-900 hover:bg-slate-850 p-5 rounded-3xl border border-slate-800 hover:border-purple-500/50 shadow-xl space-y-2 transition-all duration-200 transform hover:-translate-y-1 block relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-400 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-white group-hover:text-purple-300 transition-colors">
              {stats?.totalOrders || 0}
            </p>
            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-bold pt-1">
            <span className="text-purple-400">● {stats?.pendingOrders || 0} Pending</span>
            <span className="text-slate-500">| Live</span>
          </div>
        </Link>

        {/* Total Food Items Card */}
        <Link
          to="/admin/foods"
          className="group bg-slate-900 hover:bg-slate-850 p-5 rounded-3xl border border-slate-800 hover:border-emerald-500/50 shadow-xl space-y-2 transition-all duration-200 transform hover:-translate-y-1 block relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-400 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider">Food Items</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-white group-hover:text-emerald-300 transition-colors">
              {stats?.totalFoods || 0}
            </p>
            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="flex space-x-2 text-[10px] font-bold pt-1">
            <span className="text-emerald-400">● {stats?.availableFoods || 0} Live</span>
            <span className="text-rose-400">● {stats?.unavailableFoods || 0} Off</span>
          </div>
        </Link>

        {/* Total Categories Card */}
        <Link
          to="/admin/categories"
          className="group bg-slate-900 hover:bg-slate-850 p-5 rounded-3xl border border-slate-800 hover:border-emerald-500/50 shadow-xl space-y-2 transition-all duration-200 transform hover:-translate-y-1 block relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-400 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider">Categories</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-white group-hover:text-emerald-300 transition-colors">
              {stats?.totalCategories || 0}
            </p>
            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Active food categories</p>
        </Link>

      </div>

      {/* Table Reservation Operations Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Table Reservation & Seating Overview</h3>
            <p className="text-xs text-slate-400">
              Manage live customer bookings, party capacities, and dining requests dynamically.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            Total: <span className="text-white font-extrabold ml-1">{stats?.totalBookings || 0}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            Pending: <span className="font-extrabold ml-1">{stats?.pendingBookings || 0}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Confirmed: <span className="font-extrabold ml-1">{stats?.confirmedBookings || 0}</span>
          </div>
          <Link
            to="/admin/bookings"
            className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-colors"
          >
            <span>Open Booking Portal</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Live Table Reservations Feed on Dashboard */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Recent Table Reservations</h3>
          </div>
          <Link
            to="/admin/bookings"
            className="inline-flex items-center space-x-1 text-xs font-bold text-amber-400 hover:text-amber-300"
          >
            <span>View All Reservations</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!stats?.recentBookings || stats.recentBookings.length === 0) ? (
          <div className="text-center py-8 space-y-2">
            <CalendarCheck className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-xs">No table reservations placed yet.</p>
            <Link
              to="/admin/bookings"
              className="inline-block px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              Add New Reservation
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Ref #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Schedule</th>
                  <th className="p-3">Party</th>
                  <th className="p-3">Special Requests</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats.recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-400">
                      <div>{b.booking_number}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {new Date(b.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{b.customer_name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{b.phone}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>{b.booking_date}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{b.booking_time}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-[11px]">
                        <Users className="w-3 h-3 text-amber-400" />
                        <span>{b.guests} Guests</span>
                      </span>
                    </td>
                    <td className="p-3 max-w-[160px] truncate">
                      {b.special_requests ? (
                        <span className="text-amber-200 text-[11px] italic">"{b.special_requests}"</span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">— None —</span>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        value={b.status}
                        onChange={(e) => handleBookingStatusChange(b.id, e.target.value)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border uppercase tracking-wider focus:outline-none cursor-pointer bg-slate-950 ${getBookingBadge(
                          b.status
                        )}`}
                      >
                        <option value="Pending" className="bg-slate-900 text-amber-400">Pending</option>
                        <option value="Confirmed" className="bg-slate-900 text-emerald-400">Confirmed</option>
                        <option value="Completed" className="bg-slate-900 text-blue-400">Completed</option>
                        <option value="Cancelled" className="bg-slate-900 text-rose-400">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-slate-950 flex flex-col sm:flex-row items-center justify-between shadow-2xl space-y-4 sm:space-y-0">
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wider opacity-80">
            Total Revenue Generated
          </span>
          <h2 className="text-4xl font-black tracking-tight">
            ₹{stats?.totalRevenue || 0}
          </h2>
        </div>
        <div className="flex items-center space-x-2 bg-slate-950/20 backdrop-blur-md px-4 py-2 rounded-2xl font-extrabold text-sm">
          <TrendingUp className="w-5 h-5" />
          <span>Realtime DB Tracking</span>
        </div>
      </div>

      {/* Recent Orders Feed */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Recent Customer Orders</h3>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center space-x-1 text-xs font-bold text-purple-400 hover:text-purple-300"
          >
            <span>View All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
          <p className="text-slate-500 text-xs text-center py-6">No recent orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-amber-400">{order.order_number}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{order.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{order.phone}</div>
                    </td>
                    <td className="p-3 max-w-[180px] truncate">{order.delivery_address}</td>
                    <td className="p-3 font-bold text-white">₹{order.total_amount}</td>
                    <td className="p-3 text-slate-400">{order.payment_method}</td>
                    <td className="p-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
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
