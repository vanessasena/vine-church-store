'use client';

import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white shadow-md fixed-colors">
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
          <nav className="flex gap-1">
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
          </nav>
        </div>
      </div>
    </header>
  );
}
