import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, PackageCheck, AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Orders() {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/orders/my-orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'Confirmed':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'Preparing':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto font-bold">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Please Log In to View Orders</h2>
        <p className="text-slate-500 text-sm">
          Log in with your customer account to view live order updates and history.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase"
        >
          Log In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900">My Orders & History</h1>
          <p className="text-slate-500 text-sm">Track your live meal preparation and status.</p>
        </div>
        <button
          onClick={fetchMyOrders}
          className="flex items-center space-x-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Orders Placed Yet</h3>
          <p className="text-slate-500 text-sm">You haven't placed any orders with us yet.</p>
          <Link
            to="/menu"
            className="inline-block px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase"
          >
            Explore Dynamic Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
            >
              {/* Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-mono font-extrabold text-amber-600">
                    #{order.order_number}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Placed on: {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadge(order.status)}`}>
                    ● Status: {order.status}
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    ₹{order.total_amount}
                  </span>
                </div>
              </div>

              {/* Status Stepper Visual */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-5 gap-2 text-center text-[10px] font-bold">
                {['Pending', 'Confirmed', 'Preparing', 'Completed', 'Cancelled'].map((st, idx) => {
                  const isCurrent = order.status === st;
                  const isPast = ['Pending', 'Confirmed', 'Preparing', 'Completed'].indexOf(order.status) >= idx && order.status !== 'Cancelled';
                  return (
                    <div
                      key={st}
                      className={`p-2 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold scale-105 shadow-md'
                          : isPast
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      {st}
                    </div>
                  );
                })}
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase">Ordered Items</h4>
                <div className="divide-y divide-slate-100">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="py-2 flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {item.quantity}x {item.food_name}
                      </span>
                      <span className="text-slate-500 font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address & Notes */}
              <div className="pt-2 text-xs text-slate-500 flex justify-between border-t border-slate-100">
                <span>📍 <strong>Delivery to:</strong> {order.delivery_address} ({order.phone})</span>
                <span>💳 <strong>Payment:</strong> {order.payment_method}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
