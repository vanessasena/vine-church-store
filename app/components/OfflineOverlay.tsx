'use client';

import { useEffect, useState } from 'react';

export default function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateConnectionStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    updateConnectionStatus();
    window.addEventListener('offline', updateConnectionStatus);
    window.addEventListener('online', updateConnectionStatus);

    return () => {
      window.removeEventListener('offline', updateConnectionStatus);
      window.removeEventListener('online', updateConnectionStatus);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/95 px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold text-white">You&apos;re offline</h1>
        <p className="mt-3 text-base text-gray-200">
          Internet connection was lost. Reconnect to continue using Vine Church Orders.
        </p>
      </div>
    </div>
  );
}
