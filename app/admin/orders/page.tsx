'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import ProtectedRoute from '../../components/ProtectedRoute';

// Convert a stored created_at ISO string (EST wall-clock time) into a
// YYYY-MM-DD value suitable for a native date input.
const toDateInputValue = (isoString?: string) => {
  if (!isoString) return '';
  const match = isoString.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
};

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute>
      <AdminOrdersPageContent />
    </ProtectedRoute>
  );
}

function AdminOrdersPageContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Debounce customer name filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setCustomerNameFilter(customerNameInput);
      setCurrentPage(1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [customerNameInput]);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, customerNameFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortOrder: 'desc',
      });
      if (customerNameFilter) {
        params.append('customerName', customerNameFilter);
      }

      const res = await fetch(`/api/admin-orders?${params.toString()}`);
      const data = await res.json();

      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (order: Order) => {
    setEditingOrder(order);
    setEditCustomerName(order.customer_name);
    setEditPurchaseDate(toDateInputValue(order.created_at));
  };

  const cancelEdit = () => {
    setEditingOrder(null);
    setEditCustomerName('');
    setEditPurchaseDate('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    if (!editCustomerName.trim()) {
      alert('Please enter a customer name');
      return;
    }
    if (!editPurchaseDate) {
      alert('Please select a date of purchase');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOrder.id,
          customer_name: editCustomerName.trim(),
          created_at: editPurchaseDate,
        }),
      });

      if (response.ok) {
        cancelEdit();
        fetchOrders();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <a href="/admin" className="text-sm text-blue-600 hover:underline">&larr; Back to Admin</a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 mt-2">Edit Order Details</h1>
          <p className="text-gray-600">
            Admin-only: update the customer name and date of purchase of any order, including paid orders.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Customer Name Filter */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Filter by customer name:</label>
              <input
                type="text"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                placeholder="Search customer name..."
                className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoComplete="off"
              />
              {customerNameInput && (
                <button
                  onClick={() => {
                    setCustomerNameInput('');
                    setCustomerNameFilter('');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders found.</p>
          ) : (
            <>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{order.customer_name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
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
                    <div className="mt-3">
                      <button
                        onClick={() => startEdit(order)}
                        className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} ({totalCount} orders)
                  </div>
                  <div className="flex gap-2">
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
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Modal */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 my-8">
              <h2 className="text-2xl font-semibold mb-4">Edit Order Details</h2>
              <form onSubmit={handleSave}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Purchase
                  </label>
                  <input
                    type="date"
                    required
                    value={editPurchaseDate}
                    onChange={(e) => setEditPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
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
