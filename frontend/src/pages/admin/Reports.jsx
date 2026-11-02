import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  CalendarCheck,
  RefreshCw,
  Printer,
  Utensils,
  ArrowUpRight,
  CreditCard,
  FileText,
  Clock,
  Search,
  CheckCircle,
  AlertCircle,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLiveReports();
  }, []);

  const fetchLiveReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/reports/analytics');
      if (res.data?.reports) {
        setData(res.data);
      } else {
        throw new Error('Invalid reports data structure received.');
      }
    } catch (err) {
      console.error('Failed to fetch live reports:', err);
      setError(err.response?.data?.error || err.message || 'Unable to connect to reports service.');
    } finally {
      setLoading(false);
    }
  };

  const reportsList = [
    { id: 'overview', name: 'All Reports Overview', icon: Layers },
    { id: 'sales', name: '1. Sales & Revenue', icon: DollarSign },
    { id: 'orders', name: '2. Food Orders', icon: ShoppingBag },
    { id: 'bookings', name: '3. Table Bookings', icon: CalendarCheck },
    { id: 'bills', name: '4. Customer Bills', icon: FileText },
    { id: 'topItems', name: '5. Top Selling Items', icon: Utensils },
    { id: 'payments', name: '6. Payment Methods', icon: CreditCard },
    { id: 'customers', name: '7. Customer Spending', icon: Users },
    { id: 'trends', name: '8. Time & Day Trends', icon: TrendingUp }
  ];

  // Helper date filtering on bills
  const filterByDate = (dateStr) => {
    if (!dateStr || dateFilter === 'all') return true;
    try {
      const itemDate = new Date(dateStr.replace(' ', 'T'));
      const now = new Date();
      if (dateFilter === 'today') {
        return itemDate.toDateString() === now.toDateString();
      }
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return itemDate >= weekAgo;
      }
      if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return itemDate >= monthAgo;
      }
    } catch {
      return true;
    }
    return true;
  };

  // Safe references to Firestore report datasets
  const reports = data?.reports || {};
  const sales = reports.salesReport || {};
  const ordersReport = reports.ordersReport || {};
  const bookings = reports.bookingsReport || {};
  const bills = (reports.billsReport || []).filter(b => filterByDate(b.createdAt));
  const topItems = reports.topItemsReport || {};
  const payments = reports.paymentReport || {};
  const customers = reports.customerReport || {};
  const trends = reports.trendsReport || {};

  // Filter bills by search query
  const filteredBills = bills.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.billNumber && b.billNumber.toLowerCase().includes(q)) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      (b.phone && b.phone.includes(q)) ||
      (b.itemsSummary && b.itemsSummary.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <BarChart3 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center space-x-2">
                <span>Restaurant Reports & Analytics</span>
              </h1>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live {data?.dataSource || 'Firestore'} Data</span>
                </span>
                <span>•</span>
                <span>Refreshed: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Live'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            {[
              { label: 'All Time', val: 'all' },
              { label: 'Today', val: 'today' },
              { label: '7 Days', val: 'week' },
              { label: '30 Days', val: 'month' }
            ].map(tf => (
              <button
                key={tf.val}
                onClick={() => setDateFilter(tf.val)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dateFilter === tf.val
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
            title="Print Current Report"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Report</span>
          </button>

          <button
            onClick={fetchLiveReports}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 8 Reports Navigation Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {reportsList.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black scale-[1.02]'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton State */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-900 animate-pulse rounded-3xl border border-slate-800" />
            ))}
          </div>
          <div className="h-64 bg-slate-900 animate-pulse rounded-3xl border border-slate-800" />
        </div>
      )}

      {/* Error State with Retry Button */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Error Loading Live Firestore Reports</h3>
          <p className="text-rose-300 text-xs max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchLiveReports}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center space-x-1.5 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Live Reports Content */}
      {!loading && data && (
        <div className="space-y-8">

          {/* ========================================================= */}
          {/* TAB 0: ALL 8 REPORTS OVERVIEW */}
          {/* ========================================================= */}
          {(activeTab === 'overview' || activeTab === 'sales') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  <span>Report 1: Sales & Revenue Overview</span>
                </h2>
                {activeTab === 'overview' && (
                  <button onClick={() => setActiveTab('sales')} className="text-xs text-amber-400 hover:underline flex items-center space-x-1 font-bold">
                    <span>View Full Sales Report</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sales KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
                  <div className="text-3xl font-black text-white">₹{(sales.totalRevenue || 0).toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>From {sales.totalTransactions || 0} valid orders</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed Sales</span>
                  <div className="text-3xl font-black text-emerald-400">₹{(sales.completedRevenue || 0).toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">Fulfilled & delivered meals</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">In-Pipeline Revenue</span>
                  <div className="text-3xl font-black text-amber-400">₹{(sales.pendingRevenue || 0).toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">Pending & preparing orders</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Average Bill Value</span>
                  <div className="text-3xl font-black text-purple-400">₹{(sales.averageOrderValue || 0).toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">Average ticket size per order</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: FOOD ORDERS REPORT */}
          {/* ========================================================= */}
          {(activeTab === 'overview' || activeTab === 'orders') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                  <span>Report 2: Food Orders Status Distribution</span>
                </h2>
                {activeTab === 'overview' && (
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-amber-400 hover:underline flex items-center space-x-1 font-bold">
                    <span>View Orders Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Total Live Food Orders: <strong className="text-white text-sm font-black">{ordersReport.totalOrders || 0}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Pending', count: ordersReport.statusCounts?.Pending || 0, color: 'bg-amber-500 text-amber-400 border-amber-500/20' },
                    { label: 'Confirmed', count: ordersReport.statusCounts?.Confirmed || 0, color: 'bg-blue-500 text-blue-400 border-blue-500/20' },
                    { label: 'Preparing', count: ordersReport.statusCounts?.Preparing || 0, color: 'bg-purple-500 text-purple-400 border-purple-500/20' },
                    { label: 'Completed', count: ordersReport.statusCounts?.Completed || 0, color: 'bg-emerald-500 text-emerald-400 border-emerald-500/20' },
                    { label: 'Cancelled', count: ordersReport.statusCounts?.Cancelled || 0, color: 'bg-rose-500 text-rose-400 border-rose-500/20' }
                  ].map(st => {
                    const pct = ordersReport.totalOrders > 0 ? Math.round((st.count / ordersReport.totalOrders) * 100) : 0;
                    return (
                      <div key={st.label} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300">{st.label}</span>
                          <span className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${st.color}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-white">{st.count}</div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${st.color.split(' ')[0]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: TABLE BOOKINGS REPORT */}
          {/* ========================================================= */}
          {(activeTab === 'overview' || activeTab === 'bookings') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center space-x-2">
                  <CalendarCheck className="w-5 h-5 text-emerald-400" />
                  <span>Report 3: Table Bookings & Occupancy</span>
                </h2>
                {activeTab === 'overview' && (
                  <button onClick={() => setActiveTab('bookings')} className="text-xs text-amber-400 hover:underline flex items-center space-x-1 font-bold">
                    <span>View Bookings Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Bookings</span>
                  <div className="text-3xl font-black text-white">{bookings.totalBookings || 0}</div>
                  <div className="text-[11px] text-slate-400">Total table reservations</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Guests</span>
                  <div className="text-3xl font-black text-amber-400">{bookings.totalGuests || 0}</div>
                  <div className="text-[11px] text-slate-400">Expected & hosted patrons</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Confirmed</span>
                  <div className="text-3xl font-black text-emerald-400">{bookings.statusCounts?.Confirmed || 0}</div>
                  <div className="text-[11px] text-slate-400">Confirmed dining tables</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Confirmation</span>
                  <div className="text-3xl font-black text-amber-400">{bookings.statusCounts?.Pending || 0}</div>
                  <div className="text-[11px] text-slate-400">Awaiting host approval</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: CUSTOMER BILLS & RECEIPTS REPORT */}
          {/* ========================================================= */}
          {(activeTab === 'overview' || activeTab === 'bills') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-black text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>Report 4: Customer Bills & Invoices ({filteredBills.length})</span>
                </h2>
                
                {/* Search in Bills */}
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bill #, customer, item..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {filteredBills.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="font-bold text-white">No customer bills found</p>
                  <p>Try clearing your search query or timeframe filter.</p>
                </div>
              ) : (
                <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-4">Bill / Order #</th>
                          <th className="p-4">Customer Details</th>
                          <th className="p-4">Food Items Ordered</th>
                          <th className="p-4">Payment</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Total Bill</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {(activeTab === 'overview' ? filteredBills.slice(0, 8) : filteredBills).map((bill) => (
                          <tr key={bill.id || bill.billNumber} className="hover:bg-slate-800/50">
                            <td className="p-4 font-mono font-bold text-amber-400">
                              #{bill.billNumber}
                              <div className="text-[10px] text-slate-500 font-normal">
                                {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-white">{bill.customerName}</div>
                              <div className="text-[10px] text-slate-400">{bill.phone}</div>
                            </td>
                            <td className="p-4 max-w-xs">
                              <div className="font-semibold text-slate-200 truncate" title={bill.itemsSummary}>
                                {bill.itemsSummary}
                              </div>
                              <div className="text-[10px] text-slate-500">{bill.itemsCount} total items</div>
                            </td>
                            <td className="p-4 text-slate-400">{bill.paymentMethod}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                bill.status === 'Completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : bill.status === 'Cancelled'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {bill.status}
                              </span>
                            </td>
                            <td className="p-4 text-right font-black text-white text-sm">
                              ₹{bill.totalAmount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: TOP SELLING FOOD ITEMS REPORT */}
          {/* ========================================================= */}
          {(activeTab === 'overview' || activeTab === 'topItems') && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-amber-400" />
                <span>Report 5: Top Selling Food Items & Popularity</span>
              </h2>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-4">Rank</th>
                        <th className="p-4">Food Item Name</th>
                        <th className="p-4">Quantity Sold</th>
                        <th className="p-4">Orders Featured</th>
                        <th className="p-4 text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(topItems.items || []).slice(0, activeTab === 'overview' ? 6 : 50).map((item, idx) => (
                        <tr key={item.name} className="hover:bg-slate-800/50">
                          <td className="p-4 font-black text-amber-400">#{idx + 1}</td>
                          <td className="p-4 font-extrabold text-white text-sm">{item.name}</td>
                          <td className="p-4 font-bold text-slate-200">
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                              {item.quantitySold} sold
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{item.ordersCount} orders</td>
                          <td className="p-4 text-right font-black text-emerald-400 text-sm">
                            ₹{item.totalRevenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: PAYMENT METHODS BREAKDOWN REPORT */}
          {/* ========================================================= */}
          {(activeTab === 'overview' || activeTab === 'payments') && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <span>Report 6: Payment Methods & Billing Breakdown</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(payments.methods || []).map(pm => (
                  <div key={pm.method} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{pm.method}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-extrabold text-xs border border-purple-500/20">
                        {pm.percentage}%
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white">₹{pm.revenue.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{pm.count} total transactions</div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${pm.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: CUSTOMER SPENDING & REPEAT ORDERS REPORT */}
          {/* ========================================================= */}
          {(activeTab === 'overview' || activeTab === 'customers') && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Report 7: Customer Spending & Order Frequency</span>
              </h2>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Unique Ordering Patrons: <strong className="text-white">{customers.totalUniqueCustomers || 0}</strong></span>
                  <span>Repeat Customers: <strong className="text-amber-400">{customers.repeatCustomersCount || 0}</strong></span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Phone / Contact</th>
                        <th className="p-4">Orders Placed</th>
                        <th className="p-4">Last Order</th>
                        <th className="p-4 text-right">Lifetime Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(customers.customers || []).slice(0, activeTab === 'overview' ? 6 : 50).map(c => (
                        <tr key={c.email || c.phone || c.name} className="hover:bg-slate-800/50">
                          <td className="p-4 font-bold text-white">{c.name}</td>
                          <td className="p-4 text-slate-400 font-mono">{c.phone || c.email || 'N/A'}</td>
                          <td className="p-4 font-bold text-amber-400">{c.ordersCount} orders</td>
                          <td className="p-4 text-slate-400">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-4 text-right font-black text-emerald-400 text-sm">
                            ₹{c.totalSpent.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: TIME-OF-DAY & DAILY TRENDS REPORT */}
          {/* ========================================================= */}
          {(activeTab === 'overview' || activeTab === 'trends') && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span>Report 8: Daily & Hourly Order Velocity Trends</span>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Time-Slots */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Peak Dining & Ordering Hours</span>
                  </h3>
                  <div className="space-y-3">
                    {(trends.hourlyDistribution || []).map(slot => {
                      const totalOrders = ordersReport.totalOrders || 1;
                      const pct = Math.round((slot.count / totalOrders) * 100);
                      return (
                        <div key={slot.slot} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300">{slot.slot}</span>
                            <span className="text-slate-400">{slot.count} orders ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day-by-Day Revenue */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Recent Daily Sales Log</span>
                  </h3>
                  <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto">
                    {(trends.dailyRevenue || []).slice(0, 7).map(d => (
                      <div key={d.date} className="py-2.5 flex justify-between items-center text-xs">
                        <span className="font-mono text-slate-300">{d.date}</span>
                        <span className="font-black text-emerald-400 text-sm">₹{d.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
