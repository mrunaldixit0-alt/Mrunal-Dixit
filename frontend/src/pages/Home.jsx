import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FoodCard from '../components/FoodCard';
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
  Bot
} from 'lucide-react';

export default function Home({ onViewFoodDetails }) {
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [catRes, foodRes, infoRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/foods?limit=12'),
        axios.get('/api/restaurant')
      ]);

      setCategories(catRes.data || []);
      setFoods(foodRes.data || []);
      setRestaurantInfo(infoRes.data || {});
    } catch (err) {
      console.error('Failed to load home page data:', err);
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

  const fastingFoods = foods.filter(f => (f.tags || '').toLowerCase().includes('fasting') || (f.tags || '').toLowerCase().includes('upvas'));
  const healthyFoods = foods.filter(f => (f.tags || '').toLowerCase().includes('healthy') || (f.tags || '').toLowerCase().includes('diet'));

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

            {/* Quick Requirement Prompt Badges */}
            <div className="pt-4 flex flex-wrap gap-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center mr-1">Popular Filters:</span>
              <button onClick={() => navigate('/menu?tag=Fasting')} className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500 hover:text-slate-950 transition-all font-semibold">
                🌸 Fasting / Upvas
              </button>
              <button onClick={() => navigate('/menu?tag=Jain')} className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500 hover:text-slate-950 transition-all font-semibold">
                🌿 Jain Food
              </button>
              <button onClick={() => navigate('/menu?tag=Healthy')} className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 transition-all font-semibold">
                🥗 Healthy & Diet
              </button>
              <button onClick={() => navigate('/menu?tag=Spicy')} className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-slate-950 transition-all font-semibold">
                🌶️ Spicy Dishes
              </button>
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
                  🤖 <strong>AI Assistant:</strong> "Suggesting Sabudana Khichdi, Sabudana Vada, & Rajgira Puri from available database items!"
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-slate-300 line-clamp-1">
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
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
