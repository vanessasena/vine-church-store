'use client';

import { useEffect, useState } from 'react';

export default function EnvironmentBanner() {
  const [environment, setEnvironment] = useState<string>('');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check environment from env variable first, then fallback to detection
    const envFromConfig = process.env.NEXT_PUBLIC_APP_ENV || process.env.VERCEL_ENV;
    const isDev = process.env.NODE_ENV === 'development';

    console.log('Detected environment from config:', envFromConfig);

    if (envFromConfig && envFromConfig !== 'production') {
      setEnvironment(envFromConfig);
    } else if (isDev) {
      setEnvironment('development');
    } else if (typeof window !== 'undefined') {
      // Auto-detect staging environment (only on client side)
      const hostname = window.location.hostname;
      const isStaging = hostname.includes('staging');

      if (isStaging) {
        setEnvironment('staging');
      }
    }
  }, []);

  if (!environment) return null;

  const getEnvironmentConfig = () => {
    switch (environment) {
      case 'development':
        return {
          text: '🚧 Development Environment',
          bgColor: 'bg-yellow-500',
          textColor: 'text-yellow-900',
          description: 'You are viewing the development version of this application'
        };
      case 'preview':
        return {
          text: '🔍 Preview Environment',
          bgColor: 'bg-blue-500',
          textColor: 'text-blue-900',
          description: 'You are viewing the preview version of this application'
        };
      case 'staging':
        return {
          text: '🔧 Staging Environment',
          bgColor: 'bg-orange-500',
          textColor: 'text-orange-900',
          description: 'You are viewing the staging branch - changes pending production release'
        };
      default:
        return null;
    }
  };

  const config = getEnvironmentConfig();
  if (!config) return null;

  if (isDismissed) return null;

  return (
    <div className={`${config.bgColor} ${config.textColor} px-4 py-2 text-center text-sm font-medium relative`}>
      <div className="flex items-center justify-center gap-2">
        <span>{config.text}</span>
        <span className="hidden sm:inline">- {config.description}</span>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:opacity-70 font-bold text-lg"
        title="Dismiss banner"
      >
        ×
      </button>
    </div>
  );
}