import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FoodCard from '../components/FoodCard';
import { useRestaurant } from '../context/RestaurantContext';
import {
  Search,
  Sparkles,
  Utensils,
  Flame,
  ShieldCheck,
  Award,
  ChevronRight,
  Clock,
  Heart,
  Bot,
  CalendarCheck,
  Calendar,
  Users
} from 'lucide-react';

export default function Home({ onViewFoodDetails }) {
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const { restaurantInfo } = useRestaurant();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catRes, foodRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/foods')
      ]);

      setCategories(catRes.data || []);
      setFoods(foodRes.data || []);
    } catch (err) {
      console.error('Failed to load home page data:', err);
      setError('Unable to reach the server. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const fastingFoods = foods.filter(
    f => (f.tags || '').toLowerCase().includes('fasting') ||
         (f.tags || '').toLowerCase().includes('upvas') ||
         f.category_slug === 'fasting-food' ||
         f.category_id === 2
  );
  const healthyFoods = foods.filter(
    f => (f.tags || '').toLowerCase().includes('healthy') ||
         (f.tags || '').toLowerCase().includes('diet') ||
         f.category_slug === 'healthy-food' ||
         f.category_id === 5
  );

  return (
    <div className="space-y-16 pb-16">

      {/* Hero Section */}
      <section className="relative min-h-[580px] bg-slate-950 text-white overflow-hidden flex items-center">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-30">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop"
            alt="Restaurant Atmosphere"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">

            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Smart Dine Dynamic Restaurant System</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Delicious Food, <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                Tailored To Your Needs.
              </span>
            </h1>

            {/* Description */}
            <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
              {restaurantInfo.description ||
                'Welcome to Smart Dine! Discover authentic dishes, Fasting / Upvas specials, Jain options, healthy diet bowls, and sweet desserts prepared fresh with premium ingredients.'}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-2 max-w-xl">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search dishes by name, ingredient, or tag (e.g. Sabudana, Paneer, Healthy)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 text-white border-2 border-slate-700/80 rounded-2xl pl-12 pr-32 py-4 text-sm focus:outline-none focus:border-amber-500 backdrop-blur-md shadow-2xl placeholder-slate-400"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-4" />
                <button
                  type="submit"
                  className="absolute right-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/book-table"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Book a Table</span>
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-2xl transition-all"
              >
                <span>Browse Full Menu</span>
              </Link>
            </div>

            {/* Dynamic Categories & Filters */}
            <div className="pt-2 space-y-2">
              <div className="flex flex-wrap gap-2 text-xs items-center">
                <span className="text-slate-400 font-semibold flex items-center mr-1">Categories:</span>
                <button
                  onClick={() => navigate('/menu')}
                  className="px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all font-bold shadow-sm"
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/menu?category=${cat.slug}`)}
                    className="px-3 py-1.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all font-semibold"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 text-xs items-center">
                <span className="text-slate-400 font-semibold flex items-center mr-1">Popular Diets:</span>
                <button onClick={() => navigate('/menu?tag=Fasting')} className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500 hover:text-slate-950 transition-all font-semibold">
                  🌸 Fasting / Upvas
                </button>
                <button onClick={() => navigate('/menu?tag=Jain')} className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500 hover:text-slate-950 transition-all font-semibold">
                  🌿 Jain Food
                </button>
                <button onClick={() => navigate('/menu?tag=Healthy')} className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 transition-all font-semibold">
                  🥗 Healthy & Diet
                </button>
                <button onClick={() => navigate('/menu?tag=Spicy')} className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-slate-950 transition-all font-semibold">
                  🌶️ Spicy
                </button>
                <button onClick={() => navigate('/menu?tag=Sweet')} className="px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500 hover:text-slate-950 transition-all font-semibold">
                  🍨 Sweet
                </button>
              </div>
            </div>

          </div>

          {/* Right Hero Card Feature */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5 backdrop-blur-xl">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Interactive Food Chatbot</h4>
                  <p className="text-xs text-slate-400">Ask requirements naturally!</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Customer Query:</span>
                  <span className="text-amber-400 font-mono">"I am fasting today"</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-200 border border-amber-500/20">
                  🤖 <strong>AI Assistant:</strong> {`"Suggesting ${
                    fastingFoods.length > 0
                      ? fastingFoods.slice(0, 3).map(f => f.name).join(', ')
                      : 'Sabudana Khichdi, Sabudana Vada, Rajgira Puri'
                  } from live menu database!"`}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Realtime DB Synced</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{restaurantInfo.opening_hours || 'Open Today'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Dynamic Categories
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Browse our complete culinary selection managed directly by restaurant admin.
            </p>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center space-x-1 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <span>View Full Menu</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
            <p className="text-rose-700 font-bold text-sm">{error}</p>
            <button
              onClick={fetchHomeData}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase transition-colors shadow-md"
            >
              Retry Loading Categories
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-slate-100 rounded-2xl p-8 text-center text-slate-500 text-sm">
            No categories available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Featured All Categories Card */}
            <Link
              to="/menu"
              className="group relative rounded-2xl overflow-hidden aspect-square border border-amber-400/40 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-end p-4 bg-gradient-to-tr from-slate-900 via-amber-950 to-orange-950"
            >
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Utensils className="w-4 h-4" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                  Full Menu
                </span>
                <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                  All Categories
                </h3>
                <p className="text-[10px] text-slate-300 line-clamp-1">
                  View all dishes
                </p>
              </div>
            </Link>

            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/menu?category=${cat.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-square border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-end p-4"
              >
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-slate-300 line-clamp-1">
                    {cat.description || 'Delicious culinary items'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Table Reservation & Dining Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80')` }}
          />
          <div className="relative z-10 p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <CalendarCheck className="w-4 h-4" />
                <span>Seamless Table Reservation</span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Book Your Table in Seconds
                </h2>
                <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed max-w-xl">
                  Planning a family dinner, business lunch, or casual get-together? Reserve a comfortable table ahead of time and bypass the waiting queue.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 font-bold text-sm">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">1 - 20+ Guests</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Couples, families & large parties</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 font-bold text-sm">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Zero Wait Time</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Instant booking confirmation</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Custom Requests</h4>
                  <p className="text-xs text-slate-400 mt-0.5">High chairs, dietary & seating</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/book-table"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  <CalendarCheck className="w-5 h-5" />
                  <span>Book a Table Now</span>
                </Link>
                <Link
                  to="/menu"
                  className="inline-flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-sm uppercase tracking-wider px-6 py-4 rounded-2xl transition-all"
                >
                  <span>Pre-select Food</span>
                </Link>
              </div>
            </div>

            {/* Visual Dining Image Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl group">
                <img
                  src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80"
                  alt="Restaurant Dining Experience"
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Accepting Reservations Today</span>
                    </span>
                    <span className="text-amber-400 font-bold">Smart Dine System</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upvas / Fasting Specials Showcase */}
      {fastingFoods.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-orange-900 via-amber-900 to-orange-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                  Upvas & Vrat Special
                </span>
                <span className="text-amber-200 text-xs font-medium">
                  Prepared with sendha namak & pure ghee
                </span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Fasting Delicacies
                </h2>
                <p className="text-slate-300 text-sm max-w-xl mt-1">
                  100% compliant fasting items retrieved dynamically from our kitchen database.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {fastingFoods.slice(0, 3).map((food) => (
                  <FoodCard key={food.id} food={food} onViewDetails={onViewFoodDetails} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Popular & Recommended Dishes Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Popular & Recommended Dishes
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Top customer favorites available right now in our restaurant.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-slate-200 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {foods.map((food) => (
              <FoodCard key={food.id} food={food} onViewDetails={onViewFoodDetails} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
