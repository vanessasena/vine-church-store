'use client';

import { useState, useEffect } from 'react';
import { Item, Order } from '@/lib/types';

interface CartItem extends Item {
  quantity: number;
}

export default function OrdersPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);

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

  const getTotalCost = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Please add items to the cart');
      return;
    }

    try {
      const orderData = {
        customer_name: customerName,
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
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
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, is_paid: !currentStatus }),
      });
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
    <div className="min-h-screen p-8 bg-gray-50">
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
                <h3 className="text-lg font-semibold mb-2">Available Items</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addToCart(item)}
                      className="p-3 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-500 transition-colors text-left"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.category}</div>
                      <div className="text-sm font-semibold text-green-600">${item.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
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
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center mb-2">
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-600 ml-2">${item.price.toFixed(2)}</span>
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
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
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
                    </div>
                  </div>

                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-1">Items:</h4>
                      <ul className="text-sm text-gray-700">
                        {order.order_items.map((orderItem) => (
                          <li key={orderItem.id}>
                            {orderItem.quantity}x {orderItem.item_name_at_time || 'Unknown Item'} -
                            ${(orderItem.price_at_time * orderItem.quantity).toFixed(2)}
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

        <div className="mt-6">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
