import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, RefreshCw, Eye, X, CheckCircle, Clock } from 'lucide-react';

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = '/api/orders';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      const res = await axios.get(url);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Order Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Monitor incoming orders, inspect item details, and update live preparation statuses.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center space-x-2 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {['all', 'Pending', 'Confirmed', 'Preparing', 'Completed', 'Cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase shrink-0 transition-all ${
              statusFilter === st
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer Info</th>
                  <th className="p-4">Items Count</th>
                  <th className="p-4">Total Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/50">
                    <td className="p-4 font-mono font-bold text-amber-400">#{order.order_number}</td>
                    <td className="p-4">
                      <div className="font-bold text-white">{order.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{order.phone}</div>
                    </td>
                    <td className="p-4 font-bold">{order.items?.length || 0} items</td>
                    <td className="p-4 font-extrabold text-white text-sm">₹{order.total_amount}</td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-xl border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400">Order Details</span>
                <h3 className="text-xl font-black text-white">#{selectedOrder.order_number}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl space-y-1.5">
                <div className="text-white font-bold text-sm">{selectedOrder.customer_name}</div>
                <div className="text-slate-400"><strong>Email:</strong> {selectedOrder.customer_email || 'N/A'}</div>
                <div className="text-slate-400"><strong>Phone:</strong> {selectedOrder.phone}</div>
                <div className="text-slate-400"><strong>Address:</strong> {selectedOrder.delivery_address}</div>
                <div className="text-slate-400"><strong>Payment Method:</strong> {selectedOrder.payment_method}</div>
                {selectedOrder.notes && (
                  <div className="text-amber-300 pt-1"><strong>Notes:</strong> {selectedOrder.notes}</div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-400 uppercase mb-2">Order Items</h4>
                <div className="bg-slate-950 rounded-2xl divide-y divide-slate-800 p-3">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between text-slate-300">
                      <span>{item.quantity}x {item.food_name}</span>
                      <span className="font-bold text-white">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between text-white font-extrabold text-sm">
                    <span>Grand Total</span>
                    <span className="text-amber-400">₹{selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
