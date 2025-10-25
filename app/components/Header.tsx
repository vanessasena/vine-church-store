'use client';

import { usePathname } from 'next/navigation';
import { useBanner } from '../contexts/BannerContext';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const { isBannerVisible } = useBanner();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Don't show header on login and request-access pages
  if (pathname === '/login' || pathname === '/request-access') {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header className={`bg-white shadow-md fixed-colors fixed left-0 right-0 z-50 ${isBannerVisible ? 'top-10' : 'top-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img
                src="/vine-church-logo.svg"
                alt="Vine Church Logo"
                className="w-10 h-10"
              />
              <span className="text-xl font-bold text-gray-900">Vine Church Orders</span>
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            <a
              href="/"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Home
            </a>
            <a
              href="/items"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/items')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Items
            </a>
            <a
              href="/orders"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/orders')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Orders
            </a>
            <a
              href="/reports"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/reports')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Reports
            </a>
            <a
              href="/admin"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Admin
            </a>
            
            {user && (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
