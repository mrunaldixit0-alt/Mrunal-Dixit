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
  UtensilsCrossed,
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react';

export default function FoodManager() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Main Add/Edit Dish Modal State
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
  const [formImageFile, setFormImageFile] = useState(null);
  const [uploadingFormImage, setUploadingFormImage] = useState(false);

  // Dedicated Change Image Modal State
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedFoodForImage, setSelectedFoodForImage] = useState(null);
  const [imageSourceMode, setImageSourceMode] = useState('upload'); // 'upload' | 'url'
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');
  const [savingImage, setSavingImage] = useState(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState(null);

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

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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
    setFormImageFile(null);
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
    setFormImageFile(null);
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
        showNotification('Food item deleted successfully.');
      } catch (err) {
        console.error('Failed to delete food:', err);
      }
    }
  };

  // Dedicated Change Image Modal Handlers
  const handleOpenChangeImageModal = (food) => {
    setSelectedFoodForImage(food);
    setImageSourceMode('upload');
    setSelectedImageFile(null);
    setImagePreviewUrl(food.image_url || '');
    setCustomImageUrlInput(food.image_url || '');
    setImageModalOpen(true);
  };

  const handleImageFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Invalid file format. Please select a JPG, JPEG, or PNG image.');
      return;
    }

    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveChangedImage = async (e) => {
    e.preventDefault();
    if (!selectedFoodForImage) return;

    try {
      setSavingImage(true);
      let newUrl = imagePreviewUrl;

      // 1. If file uploaded, send to backend upload endpoint first
      if (imageSourceMode === 'upload' && selectedImageFile) {
        const formData = new FormData();
        formData.append('image', selectedImageFile);
        const uploadRes = await axios.post('/api/foods/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newUrl = uploadRes.data.imageUrl;
      } else if (imageSourceMode === 'url') {
        if (!customImageUrlInput.trim()) {
          alert('Please enter a valid Image URL.');
          setSavingImage(false);
          return;
        }
        newUrl = customImageUrlInput.trim();
      }

      // 2. Update food item record in backend database
      await axios.put(`/api/foods/${selectedFoodForImage.id}`, {
        image_url: newUrl
      });

      setImageModalOpen(false);
      fetchData();
      showNotification('Dish image updated successfully.');
    } catch (err) {
      console.error('Image update failed:', err);
      alert(err.response?.data?.error || 'Failed to update dish image.');
    } finally {
      setSavingImage(false);
    }
  };

  // Form Image upload handler inside main Add/Edit Modal
  const handleFormImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Invalid file format. Please select a JPG, JPEG, or PNG image.');
      return;
    }

    try {
      setUploadingFormImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await axios.post('/api/foods/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(uploadRes.data.imageUrl);
      showNotification('Image uploaded successfully for form preview.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload image file.');
    } finally {
      setUploadingFormImage(false);
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
        showNotification('Dish details updated successfully.');
      } else {
        await axios.post('/api/foods', payload);
        showNotification('New dish created successfully.');
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
    <div className="space-y-8 relative">

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-slate-950 px-6 py-3.5 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Menu & Tag Admin</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Admin Panel: Upload dish images, edit prices, update tags, and toggle availability.
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
          placeholder="Filter foods by name or tag (e.g. Sabudana, Gulab Jamun)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-amber-500 font-medium"
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
                  <th className="p-4">Dish</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Tags</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredFoods.map((food) => (
                  <tr key={food.id} className="hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div
                          onClick={() => handleOpenChangeImageModal(food)}
                          className="relative group cursor-pointer shrink-0"
                          title="Click to Upload / Change Image"
                        >
                          <img
                            src={food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                            alt={food.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-700 group-hover:opacity-80 transition-opacity"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';
                            }}
                          />
                          <div className="absolute inset-0 rounded-2xl bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="w-4 h-4 text-amber-400" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center space-x-2">
                            <span>{food.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">{food.description}</div>
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

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Explicit Change Image Button */}
                        <button
                          onClick={() => handleOpenChangeImageModal(food)}
                          className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center space-x-1.5 text-[11px] font-bold transition-all shadow-sm active:scale-95"
                          title="Upload or replace image for this dish"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Change Image</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(food)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Food Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(food.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Delete Food Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DEDICATED ADMIN IMAGE CHANGE / UPLOAD MODAL */}
      {imageModalOpen && selectedFoodForImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-lg border border-slate-800 shadow-2xl space-y-6 my-8">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Change Dish Image</h3>
                  <p className="text-xs text-amber-400 font-bold">{selectedFoodForImage.name}</p>
                </div>
              </div>
              <button
                onClick={() => setImageModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChangedImage} className="space-y-5">

              {/* Mode Selector Tabs */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setImageSourceMode('upload')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    imageSourceMode === 'upload'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Local File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageSourceMode('url')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    imageSourceMode === 'url'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image Web URL</span>
                </button>
              </div>

              {/* Upload File Input */}
              {imageSourceMode === 'upload' ? (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase block">
                    Select New Image File (JPG, JPEG, PNG)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl cursor-pointer bg-slate-950 hover:bg-slate-850 transition-all p-4">
                    <Upload className="w-8 h-8 text-amber-400 mb-2" />
                    <span className="text-xs font-bold text-slate-300">
                      {selectedImageFile ? selectedImageFile.name : 'Click to choose image file from computer'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Supports JPG, JPEG, PNG up to 10MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase block">
                    Direct Image URL
                  </label>
                  <input
                    type="url"
                    value={customImageUrlInput}
                    onChange={(e) => {
                      setCustomImageUrlInput(e.target.value);
                      setImagePreviewUrl(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Current & New Image Preview Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-400 uppercase block">
                  Image Live Preview
                </label>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setImagePreviewUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop');
                      }}
                    />
                  ) : (
                    <div className="text-slate-500 text-xs flex flex-col items-center">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span>No image preview available</span>
                    </div>
                  )}
                  <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-slate-900/80 text-amber-400 text-[10px] font-bold backdrop-blur-sm border border-slate-700">
                    Live Preview
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setImageModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingImage}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {savingImage ? 'Saving Image...' : 'Save Updated Image'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Main Add / Edit Food Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-2xl border border-slate-800 shadow-2xl space-y-6 my-8">

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-black text-white flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-400" />
                <span>{editingFood ? 'Edit Food Item Details' : 'Add New Food Item'}</span>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Dish Image URL or File Upload</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <label className="px-3 py-2.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-950 rounded-xl cursor-pointer text-xs font-bold flex items-center space-x-1 shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingFormImage ? 'Uploading...' : 'Browse'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFormImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Image Preview */}
              {imageUrl && (
                <div className="flex items-center space-x-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <img src={imageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                  <span className="text-[11px] text-slate-400 truncate flex-1">{imageUrl}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short appetizing description..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Dietary Notes</label>
                  <input
                    type="text"
                    value={dietaryInfo}
                    onChange={(e) => setDietaryInfo(e.target.value)}
                    placeholder="Gluten-Free, Upvas Compliant..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
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
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
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
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
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
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-lg active:scale-95"
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
