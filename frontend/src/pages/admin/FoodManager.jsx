import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  X,
  Sparkles,
  Flame,
  UtensilsCrossed
} from 'lucide-react';

export default function FoodManager() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [dietaryInfo, setDietaryInfo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);

  const tagOptions = [
    'Veg',
    'Jain',
    'Fasting / Upvas',
    'Healthy',
    'Low Calorie',
    'High Protein',
    'Spicy',
    'Sweet',
    'Kids Friendly'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [foodRes, catRes] = await Promise.all([
        axios.get('/api/foods'),
        axios.get('/api/categories')
      ]);
      setFoods(foodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to fetch food manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFood(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setPrice('');
    setDescription('');
    setIngredients('');
    setDietaryInfo('');
    setImageUrl('');
    setIsAvailable(1);
    setSelectedTags(['Veg']);
    setModalOpen(true);
  };

  const handleOpenEdit = (food) => {
    setEditingFood(food);
    setName(food.name);
    setCategoryId(food.category_id || categories[0]?.id || '');
    setPrice(food.price);
    setDescription(food.description || '');
    setIngredients(food.ingredients || '');
    setDietaryInfo(food.dietary_info || '');
    setImageUrl(food.image_url || '');
    setIsAvailable(food.is_available);

    const existingTags = (food.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    setSelectedTags(existingTags);
    setModalOpen(true);
  };

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleToggleAvailability = async (foodId) => {
    try {
      await axios.patch(`/api/foods/${foodId}/toggle-availability`);
      fetchData();
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleDelete = async (foodId) => {
    if (window.confirm('Are you sure you want to delete this food item?')) {
      try {
        await axios.delete(`/api/foods/${foodId}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete food:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      category_id: categoryId,
      price: Number(price),
      description,
      ingredients,
      dietary_info: dietaryInfo,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
      is_available: isAvailable ? 1 : 0,
      tags: selectedTags.join(',')
    };

    try {
      if (editingFood) {
        await axios.put(`/api/foods/${editingFood.id}`, payload);
      } else {
        await axios.post('/api/foods', payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Save food failed:', err);
      alert(err.response?.data?.error || 'Failed to save food item.');
    }
  };

  const filteredFoods = foods.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.tags || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Food Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Add, edit, toggle availability, prices, and tags for restaurant dishes.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Food Item</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Filter foods by name or tag (e.g. Sabudana, Spicy)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-amber-500"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
      </div>

      {/* Foods Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading food items...</div>
        ) : filteredFoods.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No food items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Tags</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredFoods.map((food) => (
                  <tr key={food.id} className="hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                          alt={food.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{food.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{food.description}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-slate-300">
                      {food.category_name || 'General'}
                    </td>

                    <td className="p-4 font-extrabold text-amber-400 text-sm">
                      ₹{food.price}
                    </td>

                    <td className="p-4 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {(food.tags || '').split(',').map((tag, idx) => (
                          <span key={idx} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleAvailability(food.id)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                          food.is_available
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {food.is_available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{food.is_available ? 'Available' : 'Unavailable'}</span>
                      </button>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(food)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Food"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(food.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Delete Food"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Food Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-2xl border border-slate-800 shadow-2xl space-y-6 my-8">

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-black text-white flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-400" />
                <span>{editingFood ? 'Edit Food Item' : 'Add New Food Item'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Food Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sabudana Khichdi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="180"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Image Web URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short appetizing description..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Ingredients List</label>
                  <input
                    type="text"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="Sabudana, Peanuts, Ghee..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Dietary Notes</label>
                  <input
                    type="text"
                    value={dietaryInfo}
                    onChange={(e) => setDietaryInfo(e.target.value)}
                    placeholder="Gluten-Free, Upvas Compliant..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Tag Checkboxes */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
                  Select Food Tags (Used by Chatbot & Filters)
                </label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedTags.includes(tag)
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability Switch */}
              <div className="pt-2 flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="availToggle"
                  checked={isAvailable === 1}
                  onChange={(e) => setIsAvailable(e.target.checked ? 1 : 0)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <label htmlFor="availToggle" className="text-xs font-bold text-white cursor-pointer">
                  Mark as Available for Customer Ordering
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400"
                >
                  {editingFood ? 'Save Changes' : 'Create Food Item'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
