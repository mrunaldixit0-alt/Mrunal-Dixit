import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  User,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  ShieldCheck,
  AlertCircle,
  CalendarCheck,
  RefreshCw,
  Eye,
  Ban,
  Search,
  X,
  XCircle,
  Check,
  Lock
} from 'lucide-react';

export default function BookTable() {
  const { user, isAuthenticated } = useAuth();
  const { restaurantInfo } = useRestaurant();
  const location = useLocation();
  const navigate = useNavigate();

  // Form State
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [guests, setGuests] = useState(2);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('07:30 PM');
  const [specialRequests, setSpecialRequests] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // My Bookings list (for authenticated customers)
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'my-bookings' | 'cancel'

  // Lookup / Cancel State
  const [lookupInput, setLookupInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupError, setLookupError] = useState('');
  const [lookupSearched, setLookupSearched] = useState(false);

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('Change of plans / Schedule conflict');
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Available Time Slots
  const timeSlots = [
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'
  ];

  // Set min date to today (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Default booking date to today
    setBookingDate(todayStr);

    // Restore any pending reservation inputs if customer was redirected to login
    try {
      const saved = sessionStorage.getItem('smartdine_pending_booking');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.customerEmail) setCustomerEmail(parsed.customerEmail);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.guests) setGuests(parsed.guests);
        if (parsed.bookingDate) setBookingDate(parsed.bookingDate);
        if (parsed.bookingTime) setBookingTime(parsed.bookingTime);
        if (parsed.specialRequests) setSpecialRequests(parsed.specialRequests);
        sessionStorage.removeItem('smartdine_pending_booking');
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (user && isAuthenticated) {
      if (!customerName) setCustomerName(user.name || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
      if (!phone) setPhone(user.phone || '');
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    fetchMyBookings();
  }, [isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'cancel' || tabParam === 'my-bookings' || tabParam === 'book') {
      setActiveTab(tabParam);
    }
    const refParam = params.get('ref');
    if (refParam) {
      setLookupInput(refParam);
      setActiveTab('cancel');
    }
  }, [location.search]);

  const fetchMyBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await axios.get('/api/bookings/my-bookings');
      setMyBookings(res.data || []);
    } catch (err) {
      console.error('Failed to fetch personal bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const openCancelModal = (booking) => {
    setBookingToCancel(booking);
    setCancellationReason('Change of plans / Schedule conflict');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      const res = await axios.post('/api/bookings/cancel', {
        id: bookingToCancel.id,
        booking_number: bookingToCancel.booking_number,
        reason: cancellationReason
      });

      // Update in myBookings list
      setMyBookings(prev =>
        prev.map(b => (b.id === bookingToCancel.id ? { ...b, status: 'Cancelled' } : b))
      );

      // Update confirmedBooking if matching
      if (confirmedBooking && confirmedBooking.id === bookingToCancel.id) {
        setConfirmedBooking(prev => ({ ...prev, status: 'Cancelled' }));
      }

      // Update lookupResults
      setLookupResults(prev =>
        prev.map(b => (b.id === bookingToCancel.id ? { ...b, status: 'Cancelled' } : b))
      );

      setActionFeedback({
        type: 'success',
        text: res.data.message || `Reservation #${bookingToCancel.booking_number} was successfully cancelled.`
      });

      setCancelModalOpen(false);
      setBookingToCancel(null);
    } catch (err) {
      console.error('Cancel booking error:', err);
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to cancel reservation. Please try again or contact the restaurant.'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!lookupInput.trim()) {
      setLookupError('Please enter a booking reference number (e.g. TB-123456) or phone number.');
      return;
    }

    setLookupLoading(true);
    setLookupError('');
    setLookupSearched(true);

    try {
      const isRef = lookupInput.trim().toUpperCase().startsWith('TB-') || (!/^\d{8,}$/.test(lookupInput.trim()) && lookupInput.trim().includes('-'));
      const queryParam = isRef
        ? `ref=${encodeURIComponent(lookupInput.trim().toUpperCase())}`
        : `phone=${encodeURIComponent(lookupInput.trim())}`;

      const res = await axios.get(`/api/bookings/lookup?${queryParam}`);
      setLookupResults(res.data.bookings || []);
    } catch (err) {
      console.error('Lookup error:', err);
      setLookupResults([]);
      setLookupError(err.response?.data?.error || 'No reservations found matching that reference or phone number.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !phone.trim() || !bookingDate || !bookingTime) {
      setErrorMsg('Please fill in your name, contact phone, date, and preferred time slot.');
      return;
    }

    // MANDATORY CUSTOMER LOGIN CHECK
    // If customer is not authenticated, block reservation and prompt login
    if (!isAuthenticated) {
      try {
        sessionStorage.setItem('smartdine_pending_booking', JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          phone: phone.trim(),
          guests,
          bookingDate,
          bookingTime,
          specialRequests: specialRequests.trim()
        }));
      } catch (e) {}

      setShowAuthModal(true);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        phone: phone.trim(),
        guests: parseInt(guests, 10) || 2,
        booking_date: bookingDate,
        booking_time: bookingTime,
        special_requests: specialRequests.trim()
      };

      const res = await axios.post('/api/bookings', payload);
      setConfirmedBooking(res.data.booking);

      if (isAuthenticated) {
        fetchMyBookings();
      }
    } catch (err) {
      console.error('Table booking error:', err);
      if (err.response?.status === 401) {
        setShowAuthModal(true);
      }
      setErrorMsg(err.response?.data?.error || 'Failed to complete table reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setConfirmedBooking(null);
    setSpecialRequests('');
    setGuests(2);
    setErrorMsg('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Completed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop"
            alt="Restaurant Dining"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/60" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider backdrop-blur-md">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Table Reservations</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Reserve Your <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              Fine Dining Table.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Experience memorable cuisine with zero wait times. Reserve your preferred seating for family dinners, gatherings, or romantic evenings at {restaurantInfo?.name || 'Smart Dine'}.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant Confirmation</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{restaurantInfo?.opening_hours || 'Mon - Sun: 08:00 AM - 11:00 PM'}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Groups from 1 to 20 Guests</span>
            </span>
          </div>
        </div>
      </div>

      {/* Toast Feedback Notification */}
      {actionFeedback && (
        <div className="fixed top-24 right-4 z-50 transition-all duration-300">
          <div
            className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-medium text-sm border ${
              actionFeedback.type === 'error'
                ? 'bg-rose-900/90 border-rose-700'
                : 'bg-emerald-900/90 border-emerald-700'
            }`}
          >
            {actionFeedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <span>{actionFeedback.text}</span>
            <button
              onClick={() => setActionFeedback(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-4 sm:space-x-8 text-sm font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('book')}
          className={`pb-3.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
            activeTab === 'book'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Book a Table</span>
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`pb-3.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
            activeTab === 'my-bookings'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>My Reservations {myBookings.length > 0 && `(${myBookings.length})`}</span>
        </button>
        <button
          onClick={() => setActiveTab('cancel')}
          className={`pb-3.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
            activeTab === 'cancel'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-rose-500/80 hover:text-rose-600'
          }`}
        >
          <Ban className="w-4 h-4 text-rose-500" />
          <span>Cancel / Find Reservation</span>
        </button>
      </div>

      {/* Tab: Book Table Form */}
      {activeTab === 'book' && (
        <div>
          {confirmedBooking ? (
            /* Confirmation Card */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl max-w-2xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Reservation Confirmed
                </span>
                <h2 className="text-3xl font-black text-slate-900">
                  Your Table is Reserved!
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                  Thank you, <strong>{confirmedBooking.customer_name}</strong>! Your table reservation details have been stored and confirmed in our system.
                </p>
              </div>

              {/* Booking Details Card */}
              <div className="bg-slate-50 rounded-2xl p-6 text-left border border-slate-200 space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Booking Reference:</span>
                  <span className="font-mono font-bold text-amber-600 text-base">
                    #{confirmedBooking.booking_number}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Party Size:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.guests} Guests</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Reservation Date:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(confirmedBooking.booking_date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Time Slot:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.booking_time}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Contact Phone:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.phone}</span>
                </div>
                {confirmedBooking.special_requests && (
                  <div className="pt-1">
                    <span className="text-slate-500 block mb-1">Special Requests:</span>
                    <span className="font-medium text-slate-800 italic bg-amber-50 p-2 rounded-lg block border border-amber-200">
                      "{confirmedBooking.special_requests}"
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Reservation Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-xs uppercase bg-amber-500/20 text-amber-700">
                    {confirmedBooking.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  Book Another Table
                </button>
                <Link
                  to="/menu"
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-md"
                >
                  Explore Food Menu
                </Link>
              </div>

              {/* Cancel Reservation Option */}
              <div className="pt-4 border-t border-slate-200 text-center">
                {confirmedBooking.status !== 'Cancelled' ? (
                  <button
                    type="button"
                    onClick={() => openCancelModal(confirmedBooking)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-500" />
                    <span>Cancel This Reservation</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200">
                    <Ban className="w-3.5 h-3.5" />
                    <span>This reservation has been cancelled.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Booking Form */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

              {/* Left Form */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Enter Reservation Details
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">
                    Please provide your name, party size, and schedule to guarantee your table.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Name and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Customer Full Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Contact Phone Number *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Email & Guests */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="e.g. rahul@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Number of Guests *
                      </label>
                      <div className="flex items-center space-x-2">
                        {[2, 4, 6, 8].map(num => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setGuests(num)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                              guests === num
                                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {num} Guests
                          </button>
                        ))}
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={guests}
                          onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          title="Custom Guest Count"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Booking Date *
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          min={todayStr}
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Preferred Time Slot *
                      </label>
                      <div className="relative">
                        <select
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        >
                          <optgroup label="Lunch Hours">
                            {timeSlots.slice(0, 6).map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Dinner Hours">
                            {timeSlots.slice(6).map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </optgroup>
                        </select>
                        <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      rows="3"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="e.g. Window-side table, anniversary celebration setup, baby high chair, birthday greeting..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  {/* Login Required Notice for Unauthenticated Guests */}
                  {!isAuthenticated && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-start space-x-2.5">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Login required to confirm reservation</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          Please log in to your account before confirming your table booking. Your reservation details will be saved.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{loading ? 'Submitting Reservation...' : 'Confirm Table Booking'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      Already have a table reserved?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('cancel')}
                        className="text-amber-600 hover:text-amber-700 font-bold hover:underline inline-flex items-center space-x-1"
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-500 ml-1" />
                        <span>Cancel or Manage Reservation</span>
                      </button>
                    </p>
                  </div>
                </form>
              </div>

              {/* Right Summary Info Box */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
                  <h3 className="font-extrabold text-lg tracking-tight">
                    Dining Benefits
                  </h3>
                  <ul className="space-y-4 text-xs text-slate-300">
                    <li className="flex items-start space-x-3">
                      <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-white block font-bold">Zero Waiting Guarantee</strong>
                        <span>Your designated table is prepared and held 15 minutes ahead of schedule.</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-white block font-bold">Requirement-Tailored Menu</strong>
                        <span>Inform us in advance about Fasting, Jain, or Diet preferences.</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-white block font-bold">Need Help or Large Groups?</strong>
                        <span>Call us directly at {restaurantInfo?.phone || '+91 98765 12345'} for corporate parties.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2 text-xs text-slate-600">
                  <div className="font-bold text-slate-900">Restaurant Location:</div>
                  <p>{restaurantInfo?.address || '104 Gourmet Boulevard, Foodie Street, Midtown City'}</p>
                  <p className="text-amber-700 font-semibold pt-1">
                    Opening Hours: {restaurantInfo?.opening_hours || 'Mon - Sun: 08:00 AM - 11:00 PM'}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Tab: My Reservations */}
      {activeTab === 'my-bookings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                My Table Reservations
              </h2>
              <p className="text-slate-500 text-xs">
                Review, manage, or cancel your past and upcoming table reservations.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('cancel')}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel By Reference #</span>
              </button>
              <button
                onClick={fetchMyBookings}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loadingBookings ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-2" />
              Loading your reservations...
            </div>
          ) : myBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-3">
              <Calendar className="w-10 h-10 mx-auto text-slate-300" />
              <p>No table reservations found for this session.</p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('book')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase"
                >
                  Book Your Table Now
                </button>
                <button
                  onClick={() => setActiveTab('cancel')}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase"
                >
                  Find Existing Booking by Phone
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Booking #</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Time</th>
                    <th className="p-3.5">Guests</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Special Requests</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-amber-600">{b.booking_number}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{b.booking_date}</td>
                      <td className="p-3.5 font-bold text-slate-800">{b.booking_time}</td>
                      <td className="p-3.5">{b.guests} Guests</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase ${getStatusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-[200px] truncate">
                        {b.special_requests || 'None'}
                      </td>
                      <td className="p-3.5 text-right">
                        {b.status !== 'Cancelled' && b.status !== 'Completed' ? (
                          <button
                            onClick={() => openCancelModal(b)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                            title="Cancel this table reservation"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-500" />
                            <span>Cancel Table</span>
                          </button>
                        ) : b.status === 'Cancelled' ? (
                          <span className="text-slate-400 font-semibold italic text-xs">Cancelled</span>
                        ) : (
                          <span className="text-slate-400 font-semibold italic text-xs">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Cancel / Find Reservation */}
      {activeTab === 'cancel' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Table Reservation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Manage & Cancel Your Reservation
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Enter your booking reference code (e.g. <strong>TB-894120</strong>) or the contact phone number used during reservation to locate your booking and cancel it immediately.
            </p>
          </div>

          {/* Search Input Box */}
          <form onSubmit={handleLookup} className="max-w-2xl bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Booking Reference # or Contact Phone Number
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    placeholder="e.g. TB-894120 or 9876543210"
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {lookupLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Find Reservation</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {lookupError && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}
          </form>

          {/* Search Results */}
          {lookupSearched && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Search Results ({lookupResults.length})
              </h3>

              {lookupResults.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700">No Reservations Found</p>
                  <p>Please double check your booking reference code or phone number.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lookupResults.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-sm font-black text-amber-600">
                            #{item.booking_number}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-0.5">
                            {item.customer_name}
                          </h4>
                          <p className="text-xs text-slate-500">{item.phone}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Time</span>
                          <span className="font-bold text-slate-800">{item.booking_date} at {item.booking_time}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Party Size</span>
                          <span className="font-bold text-slate-800">{item.guests} Guests</span>
                        </div>
                      </div>

                      {item.special_requests && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{item.special_requests}"
                        </p>
                      )}

                      {/* Cancel Action */}
                      <div className="pt-2 flex items-center justify-between">
                        {item.status !== 'Cancelled' && item.status !== 'Completed' ? (
                          <button
                            type="button"
                            onClick={() => openCancelModal(item)}
                            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Cancel This Table Reservation</span>
                          </button>
                        ) : item.status === 'Cancelled' ? (
                          <div className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 text-center text-xs font-bold border border-rose-200 flex items-center justify-center space-x-1.5">
                            <Ban className="w-4 h-4" />
                            <span>This Reservation Is Cancelled</span>
                          </div>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 text-center text-xs font-bold">
                            Completed Dining Reservation
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && bookingToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
                <Ban className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Cancel Table Reservation?
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Are you sure you want to cancel reservation{' '}
                  <strong className="text-amber-600 font-mono">#{bookingToCancel.booking_number}</strong>?
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-slate-800">{bookingToCancel.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="font-bold text-slate-800">{bookingToCancel.booking_date} at {bookingToCancel.booking_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Party Size:</span>
                  <span className="font-bold text-slate-800">{bookingToCancel.guests} Guests</span>
                </div>
              </div>

              {/* Cancellation Reason */}
              <div className="text-left space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Reason for Cancellation (Optional)
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Change of plans / Schedule conflict">Change of plans / Schedule conflict</option>
                  <option value="Booked wrong date or time slot">Booked wrong date or time slot</option>
                  <option value="Unable to attend">Unable to attend</option>
                  <option value="Found another venue">Found another venue</option>
                  <option value="Emergency or unforeseen reason">Emergency or unforeseen reason</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => {
                    setCancelModalOpen(false);
                    setBookingToCancel(null);
                  }}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 flex items-center justify-center space-x-1 disabled:opacity-50"
                >
                  {isCancelling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Yes, Cancel Table</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Customer Login Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20 shadow-inner">
                <Lock className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Login Required to Reserve Table
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed px-2">
                Please log in to your account before confirming your table booking. Your reservation details will be saved while you log in.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/login', {
                    state: {
                      from: '/book-table',
                      message: 'Please sign in to confirm your table reservation. Your booking details have been saved.'
                    }
                  });
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Log In to Confirm Booking</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/register', {
                    state: {
                      from: '/book-table'
                    }
                  });
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Create New Account
              </button>

              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
              >
                Return to Reservation Form
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
