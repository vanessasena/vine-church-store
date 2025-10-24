'use client';

import { useState, useEffect } from 'react';
import { Item, Order } from '@/lib/types';

interface CartItem extends Omit<Item, 'category'> {
  quantity: number;
  customPrice?: number;
  category?: string | Item['category']; // Allow both string and Category object, make optional
}

export default function OrdersPage() {
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, ordersRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/orders'),
      ]);

      const itemsData = await itemsRes.json();
      const ordersData = await ordersRes.json();

      setItems(itemsData);
      setOrders(ordersData);
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
            <img
              src="/vine-church-logo.svg"
              alt="Vine Church Logo"
              className="w-12 h-12"
            />
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
          <h2 className="text-2xl font-semibold mb-4">Order History</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No orders yet. Create your first order to get started!
            </p>
          ) : (
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
                    <button
                      onClick={() => togglePaymentStatus(order.id, order.is_paid)}
                      className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                        order.is_paid
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
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
      </div>
    </div>
  );
}
