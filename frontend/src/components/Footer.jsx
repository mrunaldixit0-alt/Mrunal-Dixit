import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, MapPin, Phone, Mail, Clock, Heart, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                <Utensils className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                SMART DINE
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience dynamic fine dining with our intelligent requirement-based food recommendation system. Pure ingredients, authentic taste, and instant ordering.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-amber-400 text-xs font-semibold">
              <Shield className="w-4 h-4" />
              <span>100% Dynamic Admin & Customer Portal</span>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Opening Hours
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center space-x-3 text-slate-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="font-medium text-white">Monday - Sunday</p>
                  <p className="text-xs text-slate-400">08:00 AM - 11:00 PM</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                ⭐ Kitchen is open for fast delivery & dine-in all day!
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Contact & Location
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>104 Gourmet Boulevard, Foodie Street, Midtown City</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91 98765 12345</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>contact@smartdine.com</span>
              </li>
            </ul>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Quick Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-amber-400 transition-colors">
                  Home Page
                </Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-amber-400 transition-colors">
                  Dynamic Food Menu
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-amber-400 transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-amber-400 transition-colors">
                  Order Status Tracking
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  to="/admin"
                  className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-500/20"
                >
                  <span>Admin Login & Panel</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SMART DINE RESTAURANT SYSTEM. All Rights Reserved.</p>
          <p className="flex items-center space-x-1 mt-2 md:mt-0">
            <span>Designed & Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Modern Restaurant Management</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
