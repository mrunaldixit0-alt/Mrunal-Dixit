const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const { getDocuments } = require('../firebase');
const { dbAll } = require('../db');

/**
 * Helper to fetch orders and bookings from Firestore with safe SQLite fallback
 */
async function fetchReportingData() {
  let orders = [];
  let bookings = [];
  let source = 'Firestore';

  try {
    const [ordersResult, bookingsResult] = await Promise.all([
      getDocuments('orders', 500),
      getDocuments('table_bookings', 500)
    ]);

    if (ordersResult.success && Array.isArray(ordersResult.documents)) {
      orders = ordersResult.documents;
    }
    if (bookingsResult.success && Array.isArray(bookingsResult.documents)) {
      bookings = bookingsResult.documents;
    }
  } catch (fsErr) {
    console.warn('Firestore reporting fetch warning, falling back to SQLite:', fsErr.message);
  }

  // Fallback to SQLite if Firestore returned empty or failed
  if (orders.length === 0) {
    source = 'SQLite Fallback';
    const sqliteOrders = await dbAll('SELECT * FROM orders ORDER BY id DESC');
    for (const ord of sqliteOrders) {
      const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
      orders.push({ ...ord, items });
    }
  }

  if (bookings.length === 0) {
    bookings = await dbAll('SELECT * FROM table_bookings ORDER BY id DESC');
  }

  return { orders, bookings, source };
}

// GET /api/reports/analytics (Admin-Only, Read-Only)
router.get('/analytics', verifyToken, isAdmin, async (req, res) => {
  try {
    const { orders, bookings, source } = await fetchReportingData();

    // 1. Sales & Revenue Report
    const nonCancelledOrders = orders.filter(o => o.status !== 'Cancelled');
    const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const completedRevenue = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const pendingRevenue = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const averageOrderValue = nonCancelledOrders.length > 0 ? Math.round(totalRevenue / nonCancelledOrders.length) : 0;

    // Daily revenue aggregation
    const dailyRevenueMap = {};
    orders.forEach(o => {
      if (o.status === 'Cancelled') return;
      const dateKey = o.created_at ? o.created_at.split(' ')[0].split('T')[0] : 'Unknown';
      dailyRevenueMap[dateKey] = (dailyRevenueMap[dateKey] || 0) + (Number(o.total_amount) || 0);
    });
    const dailyRevenue = Object.entries(dailyRevenueMap).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => b.date.localeCompare(a.date));

    const salesReport = {
      totalRevenue,
      completedRevenue,
      pendingRevenue,
      averageOrderValue,
      totalTransactions: nonCancelledOrders.length,
      dailyRevenue
    };

    // 2. Food Orders Report
    const orderStatuses = ['Pending', 'Confirmed', 'Preparing', 'Completed', 'Cancelled'];
    const orderStatusCounts = {};
    orderStatuses.forEach(st => {
      orderStatusCounts[st] = orders.filter(o => (o.status || '').toLowerCase() === st.toLowerCase()).length;
    });

    const ordersReport = {
      totalOrders: orders.length,
      statusCounts: orderStatusCounts,
      statusPercentages: orderStatuses.map(st => ({
        status: st,
        count: orderStatusCounts[st],
        percentage: orders.length > 0 ? Math.round((orderStatusCounts[st] / orders.length) * 100) : 0
      }))
    };

    // 3. Table Bookings Report
    const totalGuests = bookings.reduce((sum, b) => sum + (parseInt(b.guests, 10) || 2), 0);
    const bookingStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    const bookingStatusCounts = {};
    bookingStatuses.forEach(st => {
      bookingStatusCounts[st] = bookings.filter(b => (b.status || '').toLowerCase() === st.toLowerCase()).length;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookingsCount = bookings.filter(b => b.booking_date === todayStr).length;

    const bookingsReport = {
      totalBookings: bookings.length,
      totalGuests,
      todayBookings: todayBookingsCount,
      statusCounts: bookingStatusCounts,
      recentBookings: bookings.slice(0, 10)
    };

    // 4. Customer Bills & Receipts Report
    const billsReport = orders.map(ord => {
      const itemsList = Array.isArray(ord.items) ? ord.items : [];
      const itemsCount = itemsList.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 1), 0);
      const itemsSubtotal = itemsList.reduce((sum, it) => sum + ((Number(it.price) || 0) * (parseInt(it.quantity, 10) || 1)), 0);
      return {
        id: ord.id,
        billNumber: ord.order_number,
        customerName: ord.customer_name || 'Guest Customer',
        customerEmail: ord.customer_email || '',
        phone: ord.phone || '',
        deliveryAddress: ord.delivery_address || '',
        paymentMethod: ord.payment_method || 'Cash on Delivery',
        itemsCount,
        itemsSummary: itemsList.map(it => `${it.quantity}x ${it.food_name || it.name}`).join(', ') || 'Food items',
        items: itemsList,
        subtotal: itemsSubtotal || Number(ord.total_amount) || 0,
        totalAmount: Number(ord.total_amount) || 0,
        status: ord.status || 'Pending',
        createdAt: ord.created_at || ''
      };
    }).sort((a, b) => (b.id || 0) - (a.id || 0));

    // 5. Top Selling Food Items Report
    const itemMap = {};
    orders.forEach(ord => {
      if (ord.status === 'Cancelled') return;
      const items = Array.isArray(ord.items) ? ord.items : [];
      items.forEach(it => {
        const name = (it.food_name || it.name || 'Food Item').trim();
        const qty = parseInt(it.quantity, 10) || 1;
        const price = Number(it.price) || 0;
        if (!itemMap[name]) {
          itemMap[name] = { name, quantitySold: 0, totalRevenue: 0, ordersCount: 0 };
        }
        itemMap[name].quantitySold += qty;
        itemMap[name].totalRevenue += (price * qty);
        itemMap[name].ordersCount += 1;
      });
    });

    const topSellingItems = Object.values(itemMap).sort((a, b) => b.quantitySold - a.quantitySold);
    const topItemsReport = {
      totalDistinctItemsSold: topSellingItems.length,
      items: topSellingItems
    };

    // 6. Payment Methods Breakdown Report
    const paymentMap = {};
    nonCancelledOrders.forEach(ord => {
      const method = (ord.payment_method || 'Cash on Delivery').trim();
      if (!paymentMap[method]) {
        paymentMap[method] = { method, count: 0, revenue: 0 };
      }
      paymentMap[method].count += 1;
      paymentMap[method].revenue += (Number(ord.total_amount) || 0);
    });

    const paymentMethods = Object.values(paymentMap).map(pm => ({
      ...pm,
      percentage: totalRevenue > 0 ? Math.round((pm.revenue / totalRevenue) * 100) : 0
    })).sort((a, b) => b.revenue - a.revenue);

    const paymentReport = {
      methods: paymentMethods
    };

    // 7. Customer Spending & Repeat Orders Report
    const customerMap = {};
    orders.forEach(ord => {
      const email = (ord.customer_email || '').toLowerCase().trim();
      const phone = (ord.phone || '').trim();
      const key = email || phone || (ord.customer_name || 'unknown');
      if (!customerMap[key]) {
        customerMap[key] = {
          name: ord.customer_name || 'Customer',
          email,
          phone,
          totalSpent: 0,
          ordersCount: 0,
          lastOrderDate: ord.created_at || ''
        };
      }
      if (ord.status !== 'Cancelled') {
        customerMap[key].totalSpent += (Number(ord.total_amount) || 0);
      }
      customerMap[key].ordersCount += 1;
      if (ord.created_at && (!customerMap[key].lastOrderDate || ord.created_at > customerMap[key].lastOrderDate)) {
        customerMap[key].lastOrderDate = ord.created_at;
      }
    });

    const customersList = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
    const customerReport = {
      totalUniqueCustomers: customersList.length,
      repeatCustomersCount: customersList.filter(c => c.ordersCount > 1).length,
      customers: customersList
    };

    // 8. Daily & Time-Slot Trends Report
    const hourlyDistribution = {
      'Morning (08:00 - 12:00)': 0,
      'Lunch / Afternoon (12:00 - 16:00)': 0,
      'Evening (16:00 - 20:00)': 0,
      'Night (20:00 - 24:00)': 0
    };

    orders.forEach(ord => {
      if (ord.created_at) {
        try {
          const parts = ord.created_at.split(' ');
          const timePart = parts[1] || '';
          const hour = parseInt(timePart.split(':')[0], 10);
          if (!isNaN(hour)) {
            if (hour >= 8 && hour < 12) hourlyDistribution['Morning (08:00 - 12:00)']++;
            else if (hour >= 12 && hour < 16) hourlyDistribution['Lunch / Afternoon (12:00 - 16:00)']++;
            else if (hour >= 16 && hour < 20) hourlyDistribution['Evening (16:00 - 20:00)']++;
            else hourlyDistribution['Night (20:00 - 24:00)']++;
          }
        } catch {
          // silent fallback
        }
      }
    });

    const trendsReport = {
      dailyRevenue,
      hourlyDistribution: Object.entries(hourlyDistribution).map(([slot, count]) => ({ slot, count }))
    };

    res.json({
      success: true,
      dataSource: source,
      timestamp: new Date(),
      reports: {
        salesReport,
        ordersReport,
        bookingsReport,
        billsReport,
        topItemsReport,
        paymentReport,
        customerReport,
        trendsReport
      }
    });
  } catch (err) {
    console.error('Analytics reports generation error:', err);
    res.status(500).json({ error: 'Failed to generate dynamic reports.' });
  }
});

module.exports = router;
