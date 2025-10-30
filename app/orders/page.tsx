'use client';

import { useState, useEffect } from 'react';
import { Item, Order } from '@/lib/types';
import ProtectedRoute from '@/app/components/ProtectedRoute';

interface CartItem extends Omit<Item, 'category'> {
  quantity: number;
  customPrice?: number;
  category?: string | Item['category']; // Allow both string and Category object, make optional
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}

function OrdersPageContent() {
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showPaymentTypeModal, setShowPaymentTypeModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<string | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('');
  const [showUnpaidConfirmation, setShowUnpaidConfirmation] = useState(false);
  const [orderToMarkUnpaid, setOrderToMarkUnpaid] = useState<string | null>(null);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCart, setEditCart] = useState<CartItem[]>([]);
  const [orderFilter, setOrderFilter] = useState<'all' | 'unpaid'>('unpaid');

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'customer_name' | 'date'>('customer_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, startDate, endDate, orderFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Build query params for orders
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (orderFilter === 'unpaid') {
        params.append('filter', 'unpaid');
      }

      const [itemsRes, ordersRes] = await Promise.all([
        fetch('/api/items'),
        fetch(`/api/orders?${params.toString()}`),
      ]);

      const itemsData = await itemsRes.json();
      const ordersData = await ordersRes.json();

      setItems(itemsData);

      // Handle new API response format
      if (ordersData.orders) {
        setOrders(ordersData.orders);
        setTotalPages(ordersData.totalPages || 1);
        setTotalCount(ordersData.totalCount || 0);
      } else {
        // Fallback for old format
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: Item) => {
    const existingItem = cart.find(i => i.id === item.id);

    if (existingItem) {
      setCart(cart.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(i => i.id !== itemId));
    } else {
      setCart(cart.map(i =>
        i.id === itemId ? { ...i, quantity } : i
      ));
    }
  };

  const updateCustomPrice = (itemId: string, price: number) => {
    setCart(cart.map(i =>
      i.id === itemId ? { ...i, customPrice: price } : i
    ));
  };

  const getTotalCost = () => {
    return cart.reduce((sum, item) => {
      const price = item.has_custom_price ? (item.customPrice || 0) : (item.price || 0);
      return sum + (price * item.quantity);
    }, 0);
  };

  const getUniqueCategories = () => {
    const categories = items.map(item => item.category?.name || 'Unknown');
    return Array.from(new Set(categories)).sort();
  };

  const getFilteredItems = () => {
    if (!selectedCategory) {
      return items;
    }
    return items.filter(item => item.category?.name === selectedCategory);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Please add items to the cart');
      return;
    }

    // Validate that all custom price items have prices set
    const missingPrices = cart.filter(item => item.has_custom_price && !item.customPrice);
    if (missingPrices.length > 0) {
      alert('Please set prices for all custom price items');
      return;
    }

    try {
      const orderData = {
        customer_name: customerName,
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          name: item.name,
          category: typeof item.category === 'string' ? item.category : item.category?.name || 'Unknown',
          category_id: typeof item.category === 'string' ? null : item.category?.id,
          price: item.has_custom_price ? item.customPrice! : item.price!,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        setCart([]);
        setCustomerName('');
        setShowNewOrder(false);
        // Sort by date descending to show new order at top
        setSortBy('date');
        setSortOrder('desc');
        setCurrentPage(1);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const togglePaymentStatus = async (orderId: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Marking as unpaid - show confirmation dialog
      setOrderToMarkUnpaid(orderId);
      setShowUnpaidConfirmation(true);
    } else {
      // Marking as paid - show payment type modal
      setSelectedOrderForPayment(orderId);
      setShowPaymentTypeModal(true);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPaymentType) {
      alert('Please select a payment type');
      return;
    }

    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrderForPayment,
          is_paid: true,
          payment_type: selectedPaymentType
        }),
      });
      setShowPaymentTypeModal(false);
      setSelectedOrderForPayment(null);
      setSelectedPaymentType('');
      fetchData();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handleMarkAsUnpaid = async () => {
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderToMarkUnpaid,
          is_paid: false
        }),
      });
      setShowUnpaidConfirmation(false);
      setOrderToMarkUnpaid(null);
      fetchData();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const startEditOrder = (order: Order) => {
    setEditingOrder(order);
    // Convert order items to cart format
    const cartItems: CartItem[] = (order.order_items || []).map(orderItem => {
      const currentItem = orderItem.item;
      const isCurrentlyCustomPrice = currentItem?.has_custom_price || false;

      return {
        id: orderItem.item_id,
        name: orderItem.item_name_at_time,
        category_id: currentItem?.category_id || '',
        price: isCurrentlyCustomPrice ? orderItem.price_at_time : (currentItem?.price ?? null),
        has_custom_price: isCurrentlyCustomPrice,
        quantity: orderItem.quantity,
        // If item is currently custom-price, preserve the historical price from order
        customPrice: isCurrentlyCustomPrice ? orderItem.price_at_time : undefined,
        category: currentItem?.category,
      };
    });
    setEditCart(cartItems);
    setShowEditOrder(true);
  };

  const addToEditCart = (item: Item) => {
    const existingItem = editCart.find(i => i.id === item.id);

    if (existingItem) {
      setEditCart(editCart.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setEditCart([...editCart, { ...item, quantity: 1 }]);
    }
  };

  const updateEditQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setEditCart(editCart.filter(i => i.id !== itemId));
    } else {
      setEditCart(editCart.map(i =>
        i.id === itemId ? { ...i, quantity } : i
      ));
    }
  };

  const updateEditCustomPrice = (itemId: string, price: number) => {
    setEditCart(editCart.map(i =>
      i.id === itemId ? { ...i, customPrice: price } : i
    ));
  };

  const getEditTotalCost = () => {
    return editCart.reduce((sum, item) => {
      const price = item.has_custom_price ? (item.customPrice || 0) : (item.price || 0);
      return sum + (price * item.quantity);
    }, 0);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingOrder) return;

    if (editCart.length === 0) {
      alert('Please add items to the order');
      return;
    }

    // Validate that all custom price items have prices set
    const missingPrices = editCart.filter(item => item.has_custom_price && !item.customPrice);
    if (missingPrices.length > 0) {
      alert('Please set prices for all custom price items');
      return;
    }

    try {
      const orderData = {
        id: editingOrder.id,
        items: editCart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          name: item.name,
          category: typeof item.category === 'string' ? item.category : item.category?.name || 'Unknown',
          category_id: typeof item.category === 'string' ? null : item.category?.id,
          price: item.has_custom_price ? item.customPrice! : item.price!,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        setEditCart([]);
        setEditingOrder(null);
        setShowEditOrder(false);
        // Sort by date descending to show updated order at top
        setSortBy('date');
        setSortOrder('desc');
        setCurrentPage(1);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'unpaid') => {
    setOrderFilter(newFilter);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handleSortChange = (newSortBy: 'customer_name' | 'date', newSortOrder?: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    if (newSortOrder) {
      setSortOrder(newSortOrder);
    }
    setCurrentPage(1); // Reset to first page when changing sort
  };

  const getDisplayedOrdersTotal = () => {
    return orders.reduce((sum, order) => sum + order.total_cost, 0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDateFilterApply = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    fetchData();
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Orders Management</h1>
              <p className="text-gray-600">Create and track customer orders</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowNewOrder(!showNewOrder)}
            className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors"
          >
            {showNewOrder ? 'Hide New Order Form' : '+ New Order'}
          </button>
        </div>

        {showNewOrder && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Create New Order</h2>
            <form onSubmit={handleSubmitOrder}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter customer name"
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Available Items</h3>
                </div>

                {items.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-700">Filter by category:</span>
                      {getUniqueCategories().map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            selectedCategory === category
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                      {selectedCategory && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('')}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {getFilteredItems().map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addToCart(item)}
                      className="p-3 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-500 transition-colors text-left"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.category?.name || 'Unknown'}</div>
                      <div className="text-sm font-semibold text-green-600">
                        {item.has_custom_price ? (
                          <span className="text-purple-600">Custom Price</span>
                        ) : (
                          `$${item.price?.toFixed(2) || '0.00'}`
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {getFilteredItems().length === 0 && items.length > 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No items found in this category.
                  </p>
                )}
                {items.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No items available. Please add items first.
                  </p>
                )}
              </div>

              {cart.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Cart</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    {cart.map((item) => {
                      const displayPrice = item.has_custom_price ? (item.customPrice || 0) : (item.price || 0);
                      return (
                        <div key={item.id} className="mb-3 pb-3 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.name}</span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                  {typeof item.category === 'string' ? item.category : item.category?.name || 'Unknown'}
                                </span>
                              </div>
                              {item.has_custom_price && (
                                <div className="mt-2">
                                  <label className="block text-xs font-medium text-purple-700 mb-1">
                                    Set Price ($) *
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.customPrice || ''}
                                    onChange={(e) => updateCustomPrice(item.id, parseFloat(e.target.value) || 0)}
                                    className="w-32 px-2 py-1 border border-purple-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    placeholder="0.00"
                                  />
                                </div>
                              )}
                              {!item.has_custom_price && (
                                <span className="text-sm text-gray-600">${displayPrice.toFixed(2)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 bg-gray-300 rounded-md hover:bg-gray-400"
                              >
                                -
                              </button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 bg-gray-300 rounded-md hover:bg-gray-400"
                              >
                                +
                              </button>
                              <span className="ml-2 font-semibold w-20 text-right">
                                ${(displayPrice * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between items-center">
                      <span className="font-bold text-lg">Total:</span>
                      <span className="font-bold text-lg text-green-600">
                        ${getTotalCost().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Create Order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setCustomerName('');
                    setShowNewOrder(false);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Order History</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    orderFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Orders
                </button>
                <button
                  onClick={() => handleFilterChange('unpaid')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    orderFilter === 'unpaid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Unpaid Only
                </button>
              </div>
            </div>

            {/* Sorting Controls */}
            <div className="flex flex-wrap gap-3 items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as 'customer_name' | 'date')}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="customer_name">Customer Name</option>
                  <option value="date">Date Created</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => handleSortChange(sortBy, e.target.value as 'asc' | 'desc')}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="asc">
                    {sortBy === 'customer_name' ? 'A to Z' : 'Oldest First'}
                  </option>
                  <option value="desc">
                    {sortBy === 'customer_name' ? 'Z to A' : 'Newest First'}
                  </option>
                </select>
              </div>

              <div className="text-sm text-gray-600">
                Showing {orders.length} of {totalCount} orders
              </div>
            </div>
          </div>

          {/* Date Filter Section */}
          {/* <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Filter by Date</h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDateFilterApply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
                {(startDate || endDate) && (
                  <button
                    onClick={handleClearDateFilter}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div> */}

          {/* Totals Display */}
          {/* <div className="mb-4 p-4 bg-green-50 rounded-md border border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">
                  {orderFilter === 'unpaid' ? 'Unpaid Orders Total' : 'Displayed Orders Total'}
                </h3>
                <p className="text-xs text-gray-600">
                  Showing {orders.length} of {totalCount} total orders
                </p>
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${getDisplayedOrdersTotal().toFixed(2)}
              </div>
            </div>
          </div> */}

          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {orderFilter === 'unpaid' ? 'No unpaid orders found.' : 'No orders yet. Create your first order to get started!'}
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{order.customer_name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          ${order.total_cost.toFixed(2)}
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            order.is_paid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                        {order.is_paid && order.payment_type && (
                          <div className="text-xs text-gray-600 mt-1">
                            via {order.payment_type}
                          </div>
                        )}
                      </div>
                    </div>

                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold mb-1">Items:</h4>
                        <ul className="text-sm text-gray-700">
                          {order.order_items.map((orderItem) => (
                            <li key={orderItem.id} className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2">
                                <span>
                                  {orderItem.quantity}x {orderItem.item_name_at_time || 'Unknown Item'}
                                </span>
                                {orderItem.item?.category?.name && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                    {orderItem.item.category.name}
                                  </span>
                                )}
                              </div>
                              <span className="font-medium">
                                ${(orderItem.price_at_time * orderItem.quantity).toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!order.is_paid && (
                        <button
                          onClick={() => startEditOrder(order)}
                          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => togglePaymentStatus(order.id, order.is_paid)}
                        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                          order.is_paid
                            ? 'bg-gray-500 text-white hover:bg-gray-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        Mark as {order.is_paid ? 'Unpaid' : 'Paid'}
                      </button>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 0 && (
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Per page:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value, 10));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Payment Type Modal */}
        {showPaymentTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Select Payment Type</h3>
              <p className="text-gray-600 mb-4">Please select how the customer paid for this order:</p>

              <div className="space-y-3 mb-6">
                {['Cash', 'E-transfer', 'Credit Card'].map((type) => (
                  <label
                    key={type}
                    className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-blue-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value={type}
                      checked={selectedPaymentType === type}
                      onChange={(e) => setSelectedPaymentType(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-900 font-medium">{type}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleMarkAsPaid}
                  disabled={!selectedPaymentType}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Confirm Payment
                </button>
                <button
                  onClick={() => {
                    setShowPaymentTypeModal(false);
                    setSelectedOrderForPayment(null);
                    setSelectedPaymentType('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unpaid Confirmation Modal */}
        {showUnpaidConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4 text-yellow-600">Confirm Unpaid Status</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to mark this order as unpaid? This will remove the payment type information.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleMarkAsUnpaid}
                  className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors"
                >
                  Yes, Mark as Unpaid
                </button>
                <button
                  onClick={() => {
                    setShowUnpaidConfirmation(false);
                    setOrderToMarkUnpaid(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Order Modal */}
        {showEditOrder && editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 my-8">
              <h2 className="text-2xl font-semibold mb-4">Edit Order - {editingOrder.customer_name}</h2>
              <form onSubmit={handleUpdateOrder}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Available Items</h3>
                  </div>

                  {items.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">Filter by category:</span>
                        {getUniqueCategories().map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              selectedCategory === category
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                        {selectedCategory && (
                          <button
                            type="button"
                            onClick={() => setSelectedCategory('')}
                            className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            Clear Filter
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                    {getFilteredItems().map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addToEditCart(item)}
                        className="p-3 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-500 transition-colors text-left"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">{item.category?.name || 'Unknown'}</div>
                        <div className="text-sm font-semibold text-green-600">
                          {item.has_custom_price ? (
                            <span className="text-purple-600">Custom Price</span>
                          ) : (
                            `$${item.price?.toFixed(2) || '0.00'}`
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {getFilteredItems().length === 0 && items.length > 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No items found in this category.
                    </p>
                  )}
                </div>

                {editCart.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                    <div className="bg-gray-50 rounded-md p-4 max-h-80 overflow-y-auto">
                      {editCart.map((item) => {
                        const displayPrice = item.has_custom_price ? (item.customPrice || 0) : (item.price || 0);
                        return (
                          <div key={item.id} className="mb-3 pb-3 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                    {typeof item.category === 'string' ? item.category : item.category?.name || 'Unknown'}
                                  </span>
                                </div>
                                {item.has_custom_price && (
                                  <div className="mt-2">
                                    <label className="block text-xs font-medium text-purple-700 mb-1">
                                      Set Price ($) *
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.customPrice || ''}
                                      onChange={(e) => updateEditCustomPrice(item.id, parseFloat(e.target.value) || 0)}
                                      className="w-32 px-2 py-1 border border-purple-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      placeholder="0.00"
                                    />
                                  </div>
                                )}
                                {!item.has_custom_price && (
                                  <span className="text-sm text-gray-600">${displayPrice.toFixed(2)}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateEditQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 bg-gray-300 rounded-md hover:bg-gray-400"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateEditQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 bg-gray-300 rounded-md hover:bg-gray-400"
                                >
                                  +
                                </button>
                                <span className="ml-2 font-semibold w-20 text-right">
                                  ${(displayPrice * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between items-center">
                        <span className="font-bold text-lg">Total:</span>
                        <span className="font-bold text-lg text-green-600">
                          ${getEditTotalCost().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={editCart.length === 0}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Update Order
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditCart([]);
                      setEditingOrder(null);
                      setShowEditOrder(false);
                      setSelectedCategory('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
