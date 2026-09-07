import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Utensils, CheckCircle } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  // Ensure fields are completely empty on component mount
  useEffect(() => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setError('');
    setSuccessMsg('');
    setFieldErrors({});
  }, []);

  const validateForm = () => {
    const errors = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      errors.name = 'Full name is required.';
    }

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (!cleanPhone) {
      errors.phone = 'Phone number is required.';
    } else if (cleanPhone.replace(/\D/g, '').length < 8) {
      errors.phone = 'Please enter a valid phone number (at least 8 digits).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validateForm()) {
      return;
    }

    const res = await register(name.trim(), email.trim(), password, phone.trim());
    if (res.success) {
      setSuccessMsg(res.message || 'Account created successfully!');
      setTimeout(() => {
        navigate('/login', {
          state: {
            successMessage: 'Account created successfully! Please log in with your credentials.',
            registeredEmail: email.trim()
          }
        });
      }, 1200);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6">

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 font-black">
            <Utensils className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Customer Account
          </h1>
          <p className="text-slate-500 text-xs">
            Sign up to place orders, save addresses, and track meals live.
          </p>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center border border-emerald-200 flex items-center justify-center space-x-2 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold text-center border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                name="customer_full_name"
                autoComplete="off"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="Enter your full name"
                className={`w-full bg-slate-50 border ${fieldErrors.name ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-amber-500'} rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 font-medium`}
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            {fieldErrors.name && (
              <p className="text-[11px] font-semibold text-rose-500 mt-1 pl-1">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="customer_new_email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="Enter your email address"
                className={`w-full bg-slate-50 border ${fieldErrors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-amber-500'} rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 font-medium`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] font-semibold text-rose-500 mt-1 pl-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                name="customer_phone_num"
                autoComplete="off"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                }}
                placeholder="Enter your phone number"
                className={`w-full bg-slate-50 border ${fieldErrors.phone ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-amber-500'} rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 font-medium`}
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            {fieldErrors.phone && (
              <p className="text-[11px] font-semibold text-rose-500 mt-1 pl-1">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="customer_new_password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder="Create a password"
                className={`w-full bg-slate-50 border ${fieldErrors.password ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-amber-500'} rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 font-medium`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex="-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] font-semibold text-rose-500 mt-1 pl-1">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !!successMsg}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm uppercase tracking-wider hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-amber-600 hover:text-amber-700">
            Log In Here
          </Link>
        </div>

      </div>
    </div>
  );
}
