const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { dbAll, dbGet, dbRun } = require('../db');
const { verifyToken, isAdmin, requireCustomerAuth, JWT_SECRET } = require('../middleware/auth');
const { setDocument, deleteDocument } = require('../firebase');

// POST create table booking (Mandatory Customer Authentication)
router.post('/', requireCustomerAuth, async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      phone,
      guests,
      booking_date,
      booking_time,
      special_requests
    } = req.body;

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Contact phone number is required.' });
    }

    if (!booking_date) {
      return res.status(400).json({ error: 'Booking date is required.' });
    }

    if (!booking_time) {
      return res.status(400).json({ error: 'Booking time slot is required.' });
    }

    const guestCount = Math.max(1, parseInt(guests, 10) || 2);
    const bookingNumber = 'TB-' + Math.floor(100000 + Math.random() * 900000);
    // Security: NEVER trust client-supplied user_id. Always bind strictly to verified authenticated user.
    const userIdVal = req.user.id;
    const customerEmailVal = customer_email && customer_email.trim() ? customer_email.trim() : (req.user.email || '');

    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    const initialStatus = req.body.status
      ? (req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1).toLowerCase())
      : 'Pending';
    const statusToSave = validStatuses.includes(initialStatus) ? initialStatus : 'Pending';

    const result = await dbRun(
      `INSERT INTO table_bookings (
        booking_number, user_id, customer_name, customer_email, phone,
        guests, booking_date, booking_time, special_requests, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingNumber,
        userIdVal,
        customer_name.trim(),
        customerEmailVal,
        phone.trim(),
        guestCount,
        booking_date,
        booking_time,
        special_requests ? special_requests.trim() : '',
        statusToSave
      ]
    );

    const newBooking = await dbGet('SELECT * FROM table_bookings WHERE id = ?', [result.id]);

    try {
      setDocument('table_bookings', newBooking.id, newBooking);
    } catch (fsErr) {
      console.warn('Firestore booking sync warning:', fsErr.message);
    }

    res.status(201).json({
      message: 'Table reservation placed successfully! We look forward to serving you.',
      booking: newBooking
    });
  } catch (err) {
    console.error('Create table booking error:', err);
    res.status(500).json({ error: 'Failed to complete table reservation. Please try again.' });
  }
});

// GET customer's own bookings (Authenticated customer only)
router.get('/my-bookings', requireCustomerAuth, async (req, res) => {
  try {
    const bookings = await dbAll(
      `SELECT * FROM table_bookings
       WHERE user_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );

    res.json(bookings);
  } catch (err) {
    console.error('Fetch my bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch your table reservations.' });
  }
});

// GET lookup booking by reference number or phone (Open to all customers/guests)
router.get('/lookup', async (req, res) => {
  try {
    const { ref, phone } = req.query;
    if (!ref && !phone) {
      return res.status(400).json({ error: 'Please provide either a booking reference number (e.g. TB-123456) or phone number.' });
    }

    let booking = null;
    let bookings = [];

    if (ref && ref.trim()) {
      const cleanRef = ref.trim().toUpperCase();
      booking = await dbGet('SELECT * FROM table_bookings WHERE UPPER(booking_number) = ?', [cleanRef]);
      if (booking) bookings = [booking];
    } else if (phone && phone.trim()) {
      bookings = await dbAll('SELECT * FROM table_bookings WHERE phone LIKE ? ORDER BY id DESC', [`%${phone.trim()}%`]);
    }

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'No reservation found matching the provided details.' });
    }

    res.json({ bookings, count: bookings.length });
  } catch (err) {
    console.error('Lookup booking error:', err);
    res.status(500).json({ error: 'Failed to look up table reservation.' });
  }
});

// POST cancel a booking (Customer, Guest, or Admin)
router.post('/cancel', async (req, res) => {
  try {
    const { id, booking_number, phone, reason } = req.body;

    if (!id && !booking_number && !phone) {
      return res.status(400).json({ error: 'Booking ID or Booking Reference is required to cancel a reservation.' });
    }

    let booking = null;
    if (id) {
      booking = await dbGet('SELECT * FROM table_bookings WHERE id = ?', [id]);
    } else if (booking_number) {
      booking = await dbGet('SELECT * FROM table_bookings WHERE UPPER(booking_number) = ?', [booking_number.trim().toUpperCase()]);
    } else if (phone) {
      booking = await dbGet('SELECT * FROM table_bookings WHERE phone = ? ORDER BY id DESC LIMIT 1', [phone.trim()]);
    }

    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found. Please check your booking reference or contact phone.' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ error: `Reservation #${booking.booking_number} is already cancelled.` });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ error: 'Completed dining reservations cannot be cancelled.' });
    }

    let updatedRequests = booking.special_requests || '';
    if (reason && reason.trim()) {
      updatedRequests = updatedRequests
        ? `${updatedRequests} | [Cancellation Reason: ${reason.trim()}]`
        : `[Cancellation Reason: ${reason.trim()}]`;
    }

    await dbRun(
      'UPDATE table_bookings SET status = ?, special_requests = ? WHERE id = ?',
      ['Cancelled', updatedRequests, booking.id]
    );

    const updatedBooking = await dbGet('SELECT * FROM table_bookings WHERE id = ?', [booking.id]);

    try {
      setDocument('table_bookings', booking.id, updatedBooking);
    } catch (fsErr) {
      console.warn('Firestore booking cancel sync warning:', fsErr.message);
    }

    res.json({
      message: `Table reservation #${booking.booking_number} has been cancelled successfully.`,
      booking: updatedBooking
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel reservation. Please try again.' });
  }
});

// PATCH cancel by ID
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await dbGet('SELECT * FROM table_bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ error: `Reservation #${booking.booking_number} is already cancelled.` });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ error: 'Completed dining reservations cannot be cancelled.' });
    }

    let updatedRequests = booking.special_requests || '';
    if (reason && reason.trim()) {
      updatedRequests = updatedRequests
        ? `${updatedRequests} | [Cancellation Reason: ${reason.trim()}]`
        : `[Cancellation Reason: ${reason.trim()}]`;
    }

    await dbRun(
      'UPDATE table_bookings SET status = ?, special_requests = ? WHERE id = ?',
      ['Cancelled', updatedRequests, id]
    );

    const updatedBooking = await dbGet('SELECT * FROM table_bookings WHERE id = ?', [id]);

    try {
      setDocument('table_bookings', id, updatedBooking);
    } catch (fsErr) {
      console.warn('Firestore booking cancel sync warning:', fsErr.message);
    }

    res.json({
      message: `Table reservation #${booking.booking_number} has been cancelled successfully.`,
      booking: updatedBooking
    });
  } catch (err) {
    console.error('Cancel booking by ID error:', err);
    res.status(500).json({ error: 'Failed to cancel reservation.' });
  }
});

// GET all bookings (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM table_bookings WHERE 1=1';
    const params = [];

    if (status && status.toLowerCase() !== 'all') {
      query += ' AND LOWER(status) = LOWER(?)';
      params.push(status);
    }

    if (search && search.trim()) {
      query += ' AND (booking_number LIKE ? OR customer_name LIKE ? OR phone LIKE ? OR customer_email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY id DESC';

    const bookings = await dbAll(query, params);
    res.json(bookings);
  } catch (err) {
    console.error('Fetch all bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch table bookings.' });
  }
});

// GET booking stats (Admin only)
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalBookings = await dbGet('SELECT COUNT(*) as count FROM table_bookings');
    const pendingBookings = await dbGet("SELECT COUNT(*) as count FROM table_bookings WHERE LOWER(status) = 'pending'");
    const confirmedBookings = await dbGet("SELECT COUNT(*) as count FROM table_bookings WHERE LOWER(status) = 'confirmed'");
    const completedBookings = await dbGet("SELECT COUNT(*) as count FROM table_bookings WHERE LOWER(status) = 'completed'");
    const cancelledBookings = await dbGet("SELECT COUNT(*) as count FROM table_bookings WHERE LOWER(status) = 'cancelled'");
    
    // Today's bookings in YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = await dbGet('SELECT COUNT(*) as count FROM table_bookings WHERE booking_date = ?', [todayStr]);

    res.json({
      total: totalBookings ? totalBookings.count : 0,
      pending: pendingBookings ? pendingBookings.count : 0,
      confirmed: confirmedBookings ? confirmedBookings.count : 0,
      completed: completedBookings ? completedBookings.count : 0,
      cancelled: cancelledBookings ? cancelledBookings.count : 0,
      today: todayBookings ? todayBookings.count : 0
    });
  } catch (err) {
    console.error('Fetch booking stats error:', err);
    res.status(500).json({ error: 'Failed to fetch booking statistics.' });
  }
});

// PATCH update booking status (Admin only)
router.patch('/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    const normalizedStatus = status ? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) : '';
    if (!status || !validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const booking = await dbGet('SELECT * FROM table_bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    await dbRun('UPDATE table_bookings SET status = ? WHERE id = ?', [normalizedStatus, id]);
    const updated = await dbGet('SELECT * FROM table_bookings WHERE id = ?', [id]);

    try {
      setDocument('table_bookings', id, updated);
    } catch (fsErr) {
      console.warn('Firestore booking status update sync warning:', fsErr.message);
    }

    res.json({ message: 'Booking status updated successfully.', booking: updated });
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Failed to update booking status.' });
  }
});

// DELETE table booking (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await dbGet('SELECT * FROM table_bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    await dbRun('DELETE FROM table_bookings WHERE id = ?', [id]);

    try {
      deleteDocument('table_bookings', id);
    } catch (fsErr) {
      console.warn('Firestore booking delete sync warning:', fsErr.message);
    }

    res.json({ message: 'Table booking removed successfully.', id: Number(id) });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Failed to delete table booking.' });
  }
});

module.exports = router;
