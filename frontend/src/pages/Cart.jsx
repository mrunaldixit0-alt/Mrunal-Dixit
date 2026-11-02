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
  Utensils,
  AlertCircle,
  ArrowRight,
  Lock,
  X,
  Printer,
  FileText
} from 'lucide-react';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal, showToast } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  React.useEffect(() => {
    if (user && isAuthenticated) {
      if (!customerName) setCustomerName(user.name || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
      if (!phone) setPhone(user.phone || '');
    }
  }, [user, isAuthenticated]);

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

    // MANDATORY CUSTOMER LOGIN CHECK
    // If user is not authenticated (or is a guest), block order placement and prompt login
    if (!isAuthenticated) {
      setShowAuthModal(true);
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
        items: cartItems.map(item => ({
          food_id: item.food.id,
          food_name: item.food.name,
          quantity: item.quantity,
          price: item.food.price
        }))
      };

      const res = await axios.post('/api/orders', orderPayload);
      const returnedOrder = res.data.order || {};
      if (!returnedOrder.items || returnedOrder.items.length === 0) {
        returnedOrder.items = orderPayload.items;
      }
      setPlacedOrder(returnedOrder);
      clearCart();
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      console.error('Order placement failed:', err);
      if (err.response?.status === 401) {
        setShowAuthModal(true);
      }
      showToast(err.response?.data?.error || 'Failed to place order. Please check your login status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (placedOrder) {
    const orderItems = placedOrder.items || [];
    const itemsSubtotal = orderItems.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0);
    const deliveryFee = placedOrder.total_amount > itemsSubtotal ? (placedOrder.total_amount - itemsSubtotal) : 0;

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-500/20 shadow-inner">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Order Confirmed!
        </h1>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Thank you <strong className="text-slate-900">{placedOrder.customer_name}</strong>! Your order <span className="font-mono font-bold text-amber-600">#{placedOrder.order_number}</span> has been received and sent to the kitchen.
        </p>

        {/* Customer Bill / Receipt Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-left max-w-xl mx-auto space-y-5">
          {/* Bill Header */}
          <div className="flex justify-between items-start pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-amber-500" />
                <span className="font-black text-slate-900 text-sm uppercase tracking-wider">Smart Dine Restaurant</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Official Customer Bill & Order Receipt</p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 font-bold text-xs border border-amber-500/20">
                ● {placedOrder.status || 'Pending'}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                {placedOrder.created_at ? new Date(placedOrder.created_at).toLocaleString() : new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Order Details Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Number</span>
              <span className="font-mono font-extrabold text-slate-900">#{placedOrder.order_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
              <span className="font-semibold text-slate-800">{placedOrder.payment_method || 'Cash on Delivery'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Name</span>
              <span className="font-semibold text-slate-800">{placedOrder.customer_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
              <span className="font-semibold text-slate-800">{placedOrder.phone}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Address</span>
              <span className="font-semibold text-slate-800">{placedOrder.delivery_address}</span>
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
                {orderItems.reduce((sum, it) => sum + (it.quantity || 1), 0)} items
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {orderItems.map((item, idx) => {
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

          {/* Pricing & Total Summary */}
          <div className="pt-3 border-t-2 border-dashed border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-800">₹{itemsSubtotal || placedOrder.total_amount}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-800">₹{deliveryFee}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-black text-slate-900 text-sm uppercase">Total Amount Paid</span>
              <span className="font-black text-xl text-amber-600">₹{placedOrder.total_amount}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center space-x-2"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Bill / Receipt</span>
          </button>
          <Link
            to="/orders"
            className="px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
          >
            Track Order Live Status
          </Link>
          <Link
            to="/menu"
            className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
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

            {!isAuthenticated && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Login required before checkout</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Please log in or register before placing your order. Your cart items will be saved.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:from-amber-400 hover:to-orange-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Processing Order...' : 'Confirm & Place Order'}</span>
            </button>
          </div>

        </div>

      </div>

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
                Login Required to Order
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed px-2">
                Please log in to your account before placing an order. Your cart items will be saved while you log in.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/login', {
                    state: {
                      from: '/cart',
                      message: 'Please sign in to complete your order. Your cart items have been saved.'
                    }
                  });
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Log In to Place Order</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/register', {
                    state: {
                      from: '/cart'
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
                Continue Browsing Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
