'use client';

import { useState, useEffect } from 'react';
import { Item } from '@/lib/types';
import CategoryAutocomplete from '@/app/components/CategoryAutocomplete';

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', category: '', categoryId: '', price: '', hasCustomPrice: false });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      alert('Please select a category');
      return;
    }

    const itemData = {
      name: formData.name,
      category_id: formData.categoryId,
      price: formData.hasCustomPrice ? null : parseFloat(formData.price),
      has_custom_price: formData.hasCustomPrice,
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

      setFormData({ name: '', category: '', categoryId: '', price: '', hasCustomPrice: false });
      fetchItems();
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
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await fetch(`/api/items?id=${id}`, {
        method: 'DELETE',
      });
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', category: '', categoryId: '', price: '', hasCustomPrice: false });
  };

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
            <img
              src="/vine-church-logo.svg"
              alt="Vine Church Logo"
              className="w-12 h-12"
            />
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
              <h2 className="text-2xl font-semibold mb-4">Items List</h2>
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No items yet. Add your first item to get started!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
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
