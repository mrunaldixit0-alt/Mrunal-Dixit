import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import FoodCard from '../components/FoodCard';
import {
  Search,
  Filter,
  Flame,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Utensils,
  Sparkles
} from 'lucide-react';

export default function Menu({ onViewFoodDetails }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || 'all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [maxPrice, setMaxPrice] = useState(500);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const searchVal = searchParams.get('search');
    const catVal = searchParams.get('category');
    const tagVal = searchParams.get('tag');

    if (searchVal !== null) setSearch(searchVal);
    if (catVal !== null) setSelectedCategory(catVal);
    if (tagVal !== null) setSelectedTag(tagVal);
  }, [searchParams]);

  useEffect(() => {
    fetchFoods();
  }, [search, selectedCategory, selectedTag, onlyAvailable, maxPrice]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchFoods = async () => {
    try {
      setLoading(true);
      let params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedTag !== 'all') params.tag = selectedTag;
      if (onlyAvailable) params.is_available = 1;
      if (maxPrice < 500) params.max_price = maxPrice;

      const res = await axios.get('/api/foods', { params });
      setFoods(res.data || []);
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedTag('all');
    setOnlyAvailable(false);
    setMaxPrice(500);
    setSearchParams({});
  };

  const availableTags = [
    { label: 'All Dishes', value: 'all' },
    { label: '🌸 Fasting / Upvas', value: 'Fasting' },
    { label: '🌿 Jain Food', value: 'Jain' },
    { label: '🥗 Healthy & Diet', value: 'Healthy' },
    { label: '🌶️ Spicy', value: 'Spicy' },
    { label: '🍨 Sweet / Dessert', value: 'Sweet' },
    { label: '🌱 Pure Veg', value: 'Veg' },
    { label: '💪 High Protein', value: 'High Protein' },
    { label: '👶 Kids Friendly', value: 'Kids Friendly' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Dynamic Restaurant Menu
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Realtime database synced menu items. Select tags, categories, or search by name.
          </p>
        </div>

        <button
          onClick={handleResetFilters}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors self-start md:self-auto"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Reset All Filters</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">

        {/* Top Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by food name, ingredients, or tags (e.g. Sabudana, Paneer, Soup)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
        </div>

        {/* Tag Filters Row */}
        <div>
          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
            Filter By Requirement Tag
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.value}
                onClick={() => setSelectedTag(tag.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedTag === tag.value
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div>
          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
            Categories
          </label>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price & Availability Controls */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-center">

          {/* Max Price Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Max Price:</span>
              <span className="text-amber-600 font-extrabold">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Availability Checkbox */}
          <div className="flex items-center space-x-3">
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-3 text-xs font-bold text-slate-800">
                Only Available In-Stock Items
              </span>
            </label>
          </div>

          {/* Results Summary */}
          <div className="text-right text-xs font-semibold text-slate-500">
            Found <strong className="text-slate-900 font-bold text-sm">{foods.length}</strong> matching food items
          </div>

        </div>

      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-80 bg-slate-200 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : foods.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center font-bold">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Food Items Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            No dishes match your selected filters. Try resetting your search or selecting a different requirement tag.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase transition-all shadow-md"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} onViewDetails={onViewFoodDetails} />
          ))}
        </div>
      )}

    </div>
  );
}
