import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X, ShoppingBag, CheckCircle2, XCircle, UtensilsCrossed, ShieldCheck, Sparkles } from 'lucide-react';

export default function FoodDetailModal({ food, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  if (!food) return null;

  const handleAdd = () => {
    addToCart(food, quantity);
    onClose();
  };

  const tagsList = (food.tags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-sm transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto">

          {/* Modal Header Image */}
          <div className="relative aspect-[16/9] w-full bg-slate-100">
            <img
              src={food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop'}
              alt={food.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 uppercase tracking-wider mb-2 inline-block">
                  {food.category_name || 'Specialty'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {food.name}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  ₹{food.price}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">

            {/* Status & Badges */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                {food.is_available ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>In Stock & Ready to Serve</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    <XCircle className="w-4 h-4" />
                    <span>Currently Unavailable</span>
                  </span>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {tagsList.map((tag, idx) => (
                  <span key={idx} className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Description
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                {food.description || 'Prepared with authentic spices and fresh ingredients.'}
              </p>
            </div>

            {/* Ingredients */}
            {food.ingredients && (
              <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10">
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Key Ingredients</span>
                </h4>
                <p className="text-slate-800 text-xs leading-relaxed font-medium">
                  {food.ingredients}
                </p>
              </div>
            )}

            {/* Dietary Info */}
            {food.dietary_info && (
              <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dietary & Nutritional Notes</span>
                </h4>
                <p className="text-slate-800 text-xs leading-relaxed font-medium">
                  {food.dietary_info}
                </p>
              </div>
            )}

            {/* Quantity and Add to Cart Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold text-slate-700">Quantity:</span>
                <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total</span>
                  <span className="text-xl font-black text-slate-900">
                    ₹{food.price * quantity}
                  </span>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!food.is_available}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all ${
                    food.is_available
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{food.is_available ? 'Add to Cart' : 'Unavailable'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
