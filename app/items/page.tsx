'use client';

import { useState, useEffect, useRef } from 'react';
import { Item } from '@/lib/types';
import CategoryAutocomplete from '@/app/components/CategoryAutocomplete';
import SubcategoryAutocomplete from '@/app/components/SubcategoryAutocomplete';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', category: '', categoryId: '', subcategory: '', price: '', hasCustomPrice: false, imageUrl: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
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
        editingItem={editingItem}
        setEditingItem={setEditingItem}
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
  editingId, setEditingId, editingItem, setEditingItem, categories, setCategories,
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
  editingItem: Item | null;
  setEditingItem: (item: Item | null) => void;
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
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (formOpen && editingId) refItemName.current?.focus();
  }, [formOpen, editingId]);

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
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(fileName, file, {
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
        .getPublicUrl(fileName);

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
      subcategory: formData.subcategory.trim() || null,
      price: formData.hasCustomPrice ? null : parseFloat(formData.price),
      has_custom_price: formData.hasCustomPrice,
      image_url: imageUrl,
      // Preserve is_active status when editing, default to true for new items
      is_active: editingItem?.is_active ?? true,
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
          setEditingItem(null);
        }
      } else {
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
      }

      setFormData({ name: '', category: '', categoryId: '', subcategory: '', price: '', hasCustomPrice: false, imageUrl: '' });
      setImageFile(null);
      setImagePreview('');
      setFormOpen(false);
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
      subcategory: item.subcategory || '',
      price: item.price?.toString() || '',
      hasCustomPrice: item.has_custom_price || false,
      imageUrl: item.image_url || '',
    });
    setImagePreview(item.image_url || '');
    setImageFile(null);
    setEditingId(item.id);
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this item? It will be hidden from item lists, but order history will be preserved.')) return;

    try {
      console.log('Archiving item with id:', id);
      const response = await fetch(`/api/items?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        alert('Failed to archive item. Please try again.');
        return;
      }
      if (editingId === id) cancelEdit();
      fetchItems(); // This will now also update the categories list
    } catch (error) {
      console.error('Error archiving item:', error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });
      if (!response.ok) alert('Failed to update item status. Please try again.');
      fetchItems();
    } catch (error) {
      console.error('Error toggling item status:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingItem(null);
    setFormData({ name: '', category: '', categoryId: '', subcategory: '', price: '', hasCustomPrice: false, imageUrl: '' });
    setImageFile(null);
    setImagePreview('');
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = !selectedCategoryFilter || item.category_id === selectedCategoryFilter;
    const query = searchQuery.trim().toLocaleLowerCase();
    const matchesSearch = !query || [item.name, item.subcategory, item.category?.name]
      .some(value => value?.toLocaleLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });
  const activeItemsCount = filteredItems.filter(item => item.is_active).length;
  const inactiveItemsCount = filteredItems.length - activeItemsCount;
  const visibleItems = filteredItems.filter(item => Boolean(item.is_active) === (selectedStatus === 'active'));
  const groupedItems = visibleItems.reduce((groups, item) => {
    const subcategory = item.subcategory?.trim() || null;
    groups.set(subcategory, [...(groups.get(subcategory) || []), item]);
    return groups;
  }, new Map<string | null, Item[]>());
  const itemGroups = Array.from(groupedItems.entries()).sort(([a], [b]) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a.localeCompare(b);
  });

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
    <div className="min-h-screen p-4 bg-gray-50 fixed-colors sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-4xl">Items Management</h1>
              <p className="mt-1 text-sm text-gray-600 sm:text-base">Register and manage items</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
          {/* Form Section */}
          <div className="order-1 lg:col-span-1">
            <div className="rounded-lg bg-white shadow-md">
              <div className="flex items-center justify-between p-4 sm:p-6 lg:pb-0">
                <h2 className="text-xl font-semibold sm:text-2xl">
                  {editingId ? 'Edit Item' : 'Add New Item'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    if (editingId) cancelEdit();
                    setFormOpen(!formOpen);
                  }}
                  className="min-h-11 rounded-md bg-blue-600 px-4 font-medium text-white hover:bg-blue-700 lg:hidden"
                >
                  {formOpen ? 'Close' : 'Add item'}
                </button>
              </div>
              <div className={`${formOpen ? 'block' : 'hidden'} p-4 pt-0 sm:p-6 sm:pt-0 lg:block`}>
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
                      categoryId: categoryId || '',
                      subcategory: categoryId === formData.categoryId ? formData.subcategory : ''
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Beverages"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="item-subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory (optional)
                  </label>
                  <SubcategoryAutocomplete
                    categoryId={formData.categoryId}
                    items={items}
                    value={formData.subcategory}
                    onChange={value => setFormData({ ...formData, subcategory: value })}
                    className="w-full min-h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Snack, Beverage, Lunch"
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
          </div>

          {/* Items List Section */}
          <div className="order-2 lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="mb-5">
                <h2 className="text-xl font-semibold sm:text-2xl">Items List</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Showing {visibleItems.length} of {filteredItems.length} {selectedStatus} items
                  {selectedCategoryFilter && (
                    <span> in {categories.find(c => c.id === selectedCategoryFilter)?.name}</span>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="sr-only" htmlFor="item-search">Search items</label>
                <input
                  id="item-search"
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="sr-only" htmlFor="item-category-filter">Filter by category</label>
                <select
                  id="item-category-filter"
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                  className="min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Filter by item status">
                <button
                  type="button"
                  aria-pressed={selectedStatus === 'active'}
                  onClick={() => setSelectedStatus('active')}
                  className={`min-h-11 rounded-md px-3 font-medium ${
                    selectedStatus === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active ({activeItemsCount})
                </button>
                <button
                  type="button"
                  aria-pressed={selectedStatus === 'inactive'}
                  onClick={() => setSelectedStatus('inactive')}
                  className={`min-h-11 rounded-md px-3 font-medium ${
                    selectedStatus === 'inactive'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Inactive ({inactiveItemsCount})
                </button>
              </div>
              {visibleItems.length === 0 ? (
                <p className="py-10 text-center text-gray-500">
                  {filteredItems.length === 0
                    ? 'No items match your search and filters.'
                    : `No ${selectedStatus} items found.`}
                </p>
              ) : (
                <div className="mt-5 space-y-6">
                  {itemGroups.map(([subcategory, subcategoryItems], index) => (
                    <section key={subcategory ?? 'uncategorized'} aria-labelledby={`subcategory-heading-${index}`}>
                      <h3
                        id={`subcategory-heading-${index}`}
                        className="mb-3 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800"
                      >
                        {subcategory || 'Other items'}
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {subcategoryItems.map(item => (
                          <article key={item.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
                            <div className="flex items-start gap-3">
                              {item.image_url ? (
                                <img src={item.image_url} alt="" className="h-14 w-14 shrink-0 rounded-md border border-gray-200 object-cover" />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-500">
                                  No image
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h4 className="break-words font-semibold text-gray-900">{item.name}</h4>
                                <p className="mt-1 text-sm text-gray-600">{item.category?.name || 'Unknown'}</p>
                                <p className="mt-2 font-medium text-gray-900">
                                  {item.has_custom_price ? 'Custom price' : `$${item.price?.toFixed(2) || '0.00'}`}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => toggleActive(item.id, item.is_active)}
                                className={`min-h-11 rounded-md px-2 text-sm font-medium ${
                                  item.is_active
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {item.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                className="min-h-11 rounded-md bg-blue-50 px-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleArchive(item.id)}
                                className="min-h-11 rounded-md bg-red-50 px-2 text-sm font-medium text-red-700 hover:bg-red-100"
                              >
                                Archive
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
