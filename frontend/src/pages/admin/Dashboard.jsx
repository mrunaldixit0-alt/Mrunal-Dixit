import React, { useState, useEffect } from 'react';
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
  TrendingUp
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users/dashboard-stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      fetchStats();
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-800 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-900 animate-pulse rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Title Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Realtime overview of restaurant performance, menu availability & customer orders.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{stats?.totalCustomers || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Registered account holders</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Food Items</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{stats?.totalFoods || 0}</p>
          <div className="flex space-x-3 text-[11px] font-bold pt-1">
            <span className="text-emerald-400">● {stats?.availableFoods || 0} Available</span>
            <span className="text-rose-400">● {stats?.unavailableFoods || 0} Off</span>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{stats?.totalOrders || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Customer order requests</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Categories</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{stats?.totalCategories || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Active menu categories</p>
        </div>

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
        <h3 className="text-lg font-bold text-white">Recent Customer Orders</h3>

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
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
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
