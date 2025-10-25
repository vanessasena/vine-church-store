'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { AccessRequest } from '@/lib/types';

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminPageContent />
    </ProtectedRoute>
  );
}

function AdminPageContent() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/access-requests');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching access requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this access request? This will create a new user account.')) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await fetch('/api/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'approve',
          adminNotes: adminNotes[requestId] || '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Access request approved! User account has been created and email sent.');
        fetchRequests();
      } else {
        alert(`Failed to approve request: ${data.error}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('An error occurred while approving the request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this access request?')) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await fetch('/api/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'reject',
          adminNotes: adminNotes[requestId] || '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Access request rejected. Email notification has been sent.');
        fetchRequests();
      } else {
        alert(`Failed to reject request: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('An error occurred while rejecting the request.');
    } finally {
      setProcessingId(null);
    }
  };

  const updateNotes = (requestId: string, notes: string) => {
    setAdminNotes({ ...adminNotes, [requestId]: notes });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const reviewedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center fixed-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading access requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 p-8 fixed-colors">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Panel</h1>
          <p className="text-slate-600">Review and approve access requests</p>
        </div>

        {/* Pending Requests */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Pending Requests ({pendingRequests.length})
          </h2>
          
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-slate-600">
              No pending access requests
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="font-semibold text-slate-900">{request.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-semibold text-slate-900">{request.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Requested Date</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>
                  
                  {request.reason && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600">Reason for Access</p>
                      <p className="text-slate-900 mt-1">{request.reason}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm text-slate-600 mb-1">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={adminNotes[request.id] || ''}
                      onChange={(e) => updateNotes(request.id, e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Add any notes about this approval/rejection..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingId === request.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingId === request.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviewed Requests */}
        {reviewedRequests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Reviewed Requests ({reviewedRequests.length})
            </h2>
            
            <div className="space-y-4">
              {reviewedRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-md p-6 opacity-75">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="font-semibold text-slate-900">{request.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-semibold text-slate-900">{request.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Reviewed Date</p>
                      <p className="font-semibold text-slate-900">
                        {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {request.admin_notes && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-600">Admin Notes</p>
                      <p className="text-slate-900 mt-1">{request.admin_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
