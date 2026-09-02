import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle,
  Truck,
  CreditCard,
  Building,
  Sparkles,
  Phone,
  User,
  MapPin
} from 'lucide-react';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal, showToast } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Green Park Apartments, Foodie Street');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 30;
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      showToast('Your cart is empty!', 'error');
      return;
    }

    if (!customerName || !deliveryAddress || !phone) {
      showToast('Please fill in name, address, and phone number.', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        customer_name: customerName,
        customer_email: customerEmail,
        phone,
        delivery_address: deliveryAddress,
        payment_method: paymentMethod,
        notes,
        user_id: user?.id || null,
        items: cartItems.map(item => ({
          food_id: item.food.id,
          food_name: item.food.name,
          quantity: item.quantity,
          price: item.food.price
        }))
      };

      const res = await axios.post('/api/orders', orderPayload);
      setPlacedOrder(res.data.order);
      clearCart();
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      console.error('Order placement failed:', err);
      showToast(err.response?.data?.error || 'Failed to place order.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          Order Confirmed!
        </h1>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Thank you <strong className="text-slate-900">{placedOrder.customer_name}</strong>! Your order <span className="font-mono font-bold text-amber-600">#{placedOrder.order_number}</span> has been received and sent to the kitchen.
        </p>

        {/* Receipt Box */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-left max-w-lg mx-auto space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-xs">
            <span className="text-slate-500">Order Number</span>
            <span className="font-mono font-bold text-slate-900">{placedOrder.order_number}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-xs">
            <span className="text-slate-500">Total Amount Paid</span>
            <span className="font-extrabold text-amber-600 text-base">₹{placedOrder.total_amount}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-xs">
            <span className="text-slate-500">Status</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-bold text-[11px]">
              {placedOrder.status}
            </span>
          </div>
          <div className="text-xs text-slate-600">
            <strong>Delivery Address:</strong> {placedOrder.delivery_address}
          </div>
        </div>

        <div className="flex justify-center space-x-4 pt-4">
          <Link
            to="/orders"
            className="px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all shadow-lg"
          >
            Track Order Live Status
          </Link>
          <Link
            to="/menu"
            className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all"
          >
            Continue Ordering
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Explore our dynamic restaurant menu and add delicious food to your cart!
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm shadow-lg hover:bg-amber-400 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Dynamic Menu</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-black text-slate-900">Your Shopping Cart</h1>
        <Link to="/menu" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Cart Items List */}
        <div className="lg:col-span-7 space-y-4">
          {cartItems.map(({ food, quantity }) => (
            <div
              key={food.id}
              className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4"
            >
              <img
                src={food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                alt={food.name}
                className="w-20 h-20 rounded-2xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-base truncate">{food.name}</h3>
                <p className="text-slate-500 text-xs line-clamp-1">{food.description}</p>
                <p className="text-amber-600 font-extrabold text-sm mt-1">₹{food.price}</p>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-2 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => updateQuantity(food.id, -1)}
                  className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold text-xs">{quantity}</span>
                <button
                  onClick={() => updateQuantity(food.id, 1)}
                  className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item Subtotal & Delete */}
              <div className="text-right shrink-0">
                <p className="font-black text-slate-900 text-base">₹{food.price * quantity}</p>
                <button
                  onClick={() => removeFromCart(food.id)}
                  className="text-rose-500 hover:text-rose-700 p-1 text-xs font-semibold mt-1 inline-flex items-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout & Delivery Details Form */}
        <div className="lg:col-span-5 space-y-6">

          {/* Delivery Details Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-amber-500" />
              <span>Delivery Details</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Rahul Sharma"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="customer@gmail.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Delivery Address</label>
                <textarea
                  rows="2"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Complete Address, House No, Landmark"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                  <option value="UPI / Online">UPI Payment (GPay / PhonePe / Paytm)</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Chef Notes / Special Requests</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. Please bring extra chutney / Make it less spicy"
                />
              </div>
            </div>
          </div>

          {/* Price Summary Card */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-white">Order Summary</h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <strong className="text-emerald-400">FREE</strong> : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Restaurant Charges (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between text-base font-extrabold text-white">
                <span>Grand Total</span>
                <span className="text-amber-400 text-xl">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:from-amber-400 hover:to-orange-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing Order...' : 'Confirm & Place Order'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
