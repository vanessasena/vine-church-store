'use client';

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePermission?: boolean;
}

export default function ProtectedRoute({
  children,
  requirePermission = true
}: ProtectedRouteProps) {
  const { user, loading, hasOrdersPermission, permissionLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || permissionLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push('/login');
      return;
    }

    // Redirect to no-permission page if orders_permission is required but not granted
    if (requirePermission && !hasOrdersPermission) {
      router.push('/no-permission');
      return;
    }
  }, [user, loading, permissionLoading, hasOrdersPermission, requirePermission, router]);

  if (loading || permissionLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center fixed-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (requirePermission && !hasOrdersPermission)) {
    return null;
  }

  return <>{children}</>;
}
