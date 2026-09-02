import React from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Eye, Flame, CheckCircle2, XCircle, Sparkles, Leaf } from 'lucide-react';

export default function FoodCard({ food, onViewDetails }) {
  const { addToCart } = useCart();

  const tagsList = (food.tags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const renderTagBadge = (tag, idx) => {
    const lower = tag.toLowerCase();
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

    if (lower.includes('fasting') || lower.includes('upvas')) {
      colorClass = 'bg-orange-500/10 text-orange-600 border-orange-500/30';
    } else if (lower.includes('jain')) {
      colorClass = 'bg-purple-500/10 text-purple-600 border-purple-500/30';
    } else if (lower.includes('healthy') || lower.includes('diet') || lower.includes('low calorie') || lower.includes('high protein')) {
      colorClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    } else if (lower.includes('spicy')) {
      colorClass = 'bg-rose-500/10 text-rose-600 border-rose-500/30';
    } else if (lower.includes('sweet') || lower.includes('dessert')) {
      colorClass = 'bg-pink-500/10 text-pink-600 border-pink-500/30';
    } else if (lower.includes('veg')) {
      colorClass = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
    }

    return (
      <span
        key={idx}
        className={`inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${colorClass}`}
      >
        {lower.includes('spicy') && <Flame className="w-3 h-3 text-rose-500" />}
        {lower.includes('veg') && <Leaf className="w-3 h-3 text-emerald-600" />}
        <span>{tag}</span>
      </span>
    );
  };

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">

      {/* Card Header & Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop'}
          alt={food.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Availability Badge */}
        <div className="absolute top-3 left-3">
          {food.is_available ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/90 backdrop-blur-md text-white shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Available</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600/90 backdrop-blur-md text-white shadow-md">
              <XCircle className="w-3.5 h-3.5" />
              <span>Unavailable</span>
            </span>
          )}
        </div>

        {/* Category Pill */}
        {food.category_name && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-slate-200 shadow-sm border border-slate-700/50">
              {food.category_name}
            </span>
          </div>
        )}

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 right-3">
          <span className="px-3.5 py-1.5 rounded-xl font-extrabold text-lg bg-amber-500 text-slate-950 shadow-lg">
            ₹{food.price}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
              {food.name}
            </h3>
          </div>

          <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed mb-3">
            {food.description}
          </p>

          {/* Tags list */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tagsList.map((tag, idx) => renderTagBadge(tag, idx))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewDetails(food)}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Details</span>
          </button>

          <button
            onClick={() => addToCart(food, 1)}
            disabled={!food.is_available}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              food.is_available
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{food.is_available ? 'Add to Cart' : 'Sold Out'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
