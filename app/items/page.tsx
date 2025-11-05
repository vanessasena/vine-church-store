'use client';

import { useState, useEffect, useRef } from 'react';
import { Item } from '@/lib/types';
import CategoryAutocomplete from '@/app/components/CategoryAutocomplete';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', category: '', categoryId: '', price: '', hasCustomPrice: false, imageUrl: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  return (
    <ProtectedRoute>
      <ItemsPageContent
        items={items}
        setItems={setItems}
        loading={loading}
        setLoading={setLoading}
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
        setEditingId={setEditingId}
        categories={categories}
        setCategories={setCategories}
        selectedCategoryFilter={selectedCategoryFilter}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        imageFile={imageFile}
        setImageFile={setImageFile}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
      />
    </ProtectedRoute>
  );
}

function ItemsPageContent({
  items, setItems, loading, setLoading, formData, setFormData,
  editingId, setEditingId, categories, setCategories,
  selectedCategoryFilter, setSelectedCategoryFilter,
  imageFile, setImageFile, imagePreview, setImagePreview
}: {
  items: Item[];
  setItems: (items: Item[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  formData: any;
  setFormData: (formData: any) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  categories: { id: string; name: string }[];
  setCategories: (categories: { id: string; name: string }[]) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (filter: string) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreview: string;
  setImagePreview: (preview: string) => void;
}) {
  const refItemName = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      const data = await response.json();
      setItems(data);

      // Extract unique categories from items
      const uniqueCategories = data
        .filter((item: Item) => item.category) // Only include items with categories
        .map((item: Item) => item.category)
        .filter((category: any, index: number, array: any[]) =>
          // Remove duplicates by id
          array.findIndex(c => c.id === category.id) === index
        );

      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      alert('Please select a category');
      return;
    }

    let imageUrl = formData.imageUrl;

    // Upload new image if file is selected
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        alert('Failed to upload image. Please try again.');
        return;
      }
    }

    const itemData = {
      name: formData.name,
      category_id: formData.categoryId,
      price: formData.hasCustomPrice ? null : parseFloat(formData.price),
      has_custom_price: formData.hasCustomPrice,
      image_url: imageUrl,
    };

    try {
      if (editingId) {
        const response = await fetch('/api/items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...itemData, id: editingId }),
        });

        if (response.ok) {
          setEditingId(null);
        }
      } else {
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
      }

      setFormData({ name: '', category: '', categoryId: '', price: '', hasCustomPrice: false, imageUrl: '' });
      setImageFile(null);
      setImagePreview('');
      fetchItems(); // This will now also update the categories list
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleEdit = (item: Item) => {
    setFormData({
      name: item.name,
      category: item.category?.name || '',
      categoryId: item.category_id,
      price: item.price?.toString() || '',
      hasCustomPrice: item.has_custom_price || false,
      imageUrl: item.image_url || '',
    });
    setImagePreview(item.image_url || '');
    setImageFile(null);
    setEditingId(item.id);
    refItemName.current?.focus();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      console.log('Deleting item with id:', id);
      const response = await fetch(`/api/items?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) alert('Failed to delete item. Please try again.');
      fetchItems(); // This will now also update the categories list
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', category: '', categoryId: '', price: '', hasCustomPrice: false, imageUrl: '' });
    setImageFile(null);
    setImagePreview('');
  };

  // Filter items based on selected category
  const filteredItems = selectedCategoryFilter
    ? items.filter(item => item.category_id === selectedCategoryFilter)
    : items;

  // Reset category filter if selected category no longer exists
  useEffect(() => {
    if (selectedCategoryFilter && !categories.some(cat => cat.id === selectedCategoryFilter)) {
      setSelectedCategoryFilter('');
    }
  }, [categories, selectedCategoryFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 fixed-colors">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Items Management</h1>
              <p className="text-gray-600">Register and manage items</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">
                {editingId ? 'Edit Item' : 'Add New Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    ref={refItemName}
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Coffee"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <CategoryAutocomplete
                    value={formData.category}
                    onChange={(value, categoryId) => setFormData({
                      ...formData,
                      category: value,
                      categoryId: categoryId || ''
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Beverages"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasCustomPrice}
                      onChange={(e) => setFormData({ ...formData, hasCustomPrice: e.target.checked, price: e.target.checked ? '' : formData.price })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Has Custom Price (price set when ordering)
                    </span>
                  </label>
                </div>

                {!formData.hasCustomPrice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Image (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-md border border-gray-300"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingId ? 'Update Item' : 'Add Item'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Items List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Items List</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {filteredItems.length} of {items.length} items
                    {selectedCategoryFilter && (
                      <span className="ml-1">
                        in {categories.find(c => c.id === selectedCategoryFilter)?.name}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {filteredItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {selectedCategoryFilter
                    ? 'No items found in the selected category.'
                    : 'No items yet. Add your first item to get started!'
                  }
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Image</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-md border border-gray-300"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs">
                                No image
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">{item.name}</td>
                          <td className="py-3 px-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                              {item.category?.name || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {item.has_custom_price ? (
                              <span className="text-purple-600 font-medium">Custom</span>
                            ) : (
                              `$${item.price?.toFixed(2) || '0.00'}`
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
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
          </div>
        </div>
      </div>
    </div>
  );
}
