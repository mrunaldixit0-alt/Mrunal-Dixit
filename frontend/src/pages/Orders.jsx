import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, PackageCheck, AlertCircle, RefreshCw, ShoppingBag, Printer, FileText, X, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lookupPhone, setLookupPhone] = useState('');
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);

  useEffect(() => {
    fetchMyOrders();
  }, [user]);

  const fetchMyOrders = async (phoneFilter = '') => {
    try {
      setLoading(true);
      const phone = phoneFilter || lookupPhone || user?.phone || '';
      const email = user?.email || '';
      const params = new URLSearchParams();
      if (phone) params.append('phone', phone);
      if (email && !email.includes('guest')) params.append('email', email);

      const url = params.toString() ? `/api/orders/my-orders?${params.toString()}` : '/api/orders/my-orders';
      const res = await axios.get(url);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (lookupPhone.trim()) {
      fetchMyOrders(lookupPhone.trim());
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

              {/* Delivery Address & Notes & View Bill Button */}
              <div className="pt-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <div className="space-y-1">
                  <div>📍 <strong>Delivery to:</strong> {order.delivery_address} ({order.phone})</div>
                  <div>💳 <strong>Payment:</strong> {order.payment_method}</div>
                </div>
                <button
                  onClick={() => setSelectedBillOrder(order)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>View & Print Bill</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Customer Bill Modal */}
      {selectedBillOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl border border-slate-200 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBillOrder(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Bill Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 pr-8">
              <div>
                <div className="flex items-center space-x-2">
                  <Utensils className="w-5 h-5 text-amber-500" />
                  <span className="font-black text-slate-900 text-sm uppercase tracking-wider">Smart Dine Restaurant</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Official Customer Bill & Order Receipt</p>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${getStatusBadge(selectedBillOrder.status)}`}>
                  ● {selectedBillOrder.status}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {selectedBillOrder.created_at ? new Date(selectedBillOrder.created_at).toLocaleString() : ''}
                </p>
              </div>
            </div>

            {/* Order Details Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Number</span>
                <span className="font-mono font-extrabold text-slate-900">#{selectedBillOrder.order_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                <span className="font-semibold text-slate-800">{selectedBillOrder.payment_method || 'Cash on Delivery'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Name</span>
                <span className="font-semibold text-slate-800">{selectedBillOrder.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                <span className="font-semibold text-slate-800">{selectedBillOrder.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Address</span>
                <span className="font-semibold text-slate-800">{selectedBillOrder.delivery_address}</span>
              </div>
            </div>

            {/* Itemized Food Bill Section (Food Names Prominently Displayed) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Food Items In Your Bill</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {(selectedBillOrder.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0)} items
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {(selectedBillOrder.items || []).map((item, idx) => {
                  const itemTotal = (item.price || 0) * (item.quantity || 1);
                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-slate-900 text-sm">
                          {item.food_name || item.name || 'Food Item'}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Quantity: <span className="font-bold text-slate-700">{item.quantity}</span> × ₹{item.price} each
                        </p>
                      </div>
                      <div className="text-right font-black text-slate-900 text-sm">
                        ₹{itemTotal}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Summary */}
            <div className="pt-3 border-t-2 border-dashed border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center pt-2">
                <span className="font-black text-slate-900 text-sm uppercase">Total Amount Paid</span>
                <span className="font-black text-xl text-amber-600">₹{selectedBillOrder.total_amount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSelectedBillOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
