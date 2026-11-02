import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Utensils,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  UserCheck,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, continueAsGuest, resetPassword, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [promptMessage, setPromptMessage] = useState('');

  // Forgot / Reset Password State
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
    if (location.state?.successMessage) {
      setSuccessBanner(location.state.successMessage);
    }
    if (location.state?.message) {
      setPromptMessage(location.state.message);
    }
  }, [location]);

  // Handle Standard Customer Email & Password Login
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        const destination = location.state?.from || '/menu';
        navigate(destination);
      }
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  // Handle Password Reset Submission
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    setResetLoading(true);
    const res = await resetPassword(resetEmail.trim(), newPassword);
    setResetLoading(false);

    if (res.success) {
      setEmail(resetEmail.trim());
      setPassword(newPassword);
      setSuccessBanner('Password reset successfully! You can now sign in.');
      setIsResetMode(false);
      setResetEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setResetError(res.error || 'Failed to reset password. Please check your email.');
    }
  };

  // Handle Optional Guest Access (No account creation)
  const handleGuestAccess = async () => {
    setError('');
    const res = await continueAsGuest('Guest Diner');
    if (res.success) {
      navigate('/menu');
    } else {
      setError(res.error || 'Failed to enter guest session.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 font-black">
            <Utensils className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isResetMode ? 'Reset Password' : 'Customer Sign In'}
          </h1>
          <p className="text-slate-500 text-xs">
            {isResetMode
              ? 'Enter your registered email and choose a new password.'
              : 'Sign in with your email and password to place orders and manage reservations.'}
          </p>
        </div>

        {/* Prompt Banner (Redirected from Cart / Booking) */}
        {promptMessage && !successBanner && !error && !isResetMode && (
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200 flex items-start space-x-2.5 shadow-sm text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>{promptMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {successBanner && !isResetMode && (
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center border border-emerald-200 flex items-center justify-center space-x-2 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && !isResetMode && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Reset Mode Error */}
        {resetError && isResetMode && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{resetError}</span>
          </div>
        )}

        {/* -------------------- RESET PASSWORD FORM -------------------- */}
        {isResetMode ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Account Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                New Password (min 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex="-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{resetLoading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setResetError('');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </form>
        ) : (
          /* -------------------- STANDARD SIGN IN FORM -------------------- */
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email.trim());
                    setResetError('');
                    setIsResetMode(true);
                  }}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Signing In...' : 'Sign In as Customer'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>
        )}

        {/* Register Option */}
        <div className="text-center text-xs text-slate-500 pt-1">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            state={{ from: location.state?.from }}
            className="font-bold text-amber-600 hover:text-amber-700 hover:underline"
          >
            Register for Free
          </Link>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink mx-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Or Quick Options
          </span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        {/* Optional Guest Access */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
          <div className="flex items-center justify-center space-x-1.5 text-slate-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Just Want to Browse?</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Explore dishes, add food to your cart, and make table bookings without creating an account.
          </p>
          <button
            type="button"
            onClick={handleGuestAccess}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span>Continue as Guest Diner</span>
          </button>
        </div>

        {/* Staff Admin Portal Link */}
        <div className="text-center pt-2 border-t border-slate-100">
          <Link
            to="/admin/login"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Restaurant Staff? Access Admin Portal</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
