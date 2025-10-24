'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBanner } from '../contexts/BannerContext';

export default function EnvironmentBanner() {
  const [environment, setEnvironment] = useState<string>('');
  const [isDismissed, setIsDismissed] = useState(false);
  const { setBannerVisible } = useBanner();

  const getEnvironmentConfig = useCallback(() => {
    switch (environment) {
      case 'development':
        return {
          text: '🚧 Development Environment',
          cssClass: 'env-banner-development',
          description: 'You are viewing the development version of this application'
        };
      case 'preview':
        return {
          text: '🔍 Preview Environment',
          cssClass: 'env-banner-preview',
          description: 'You are viewing the preview version of this application'
        };
      case 'staging':
        return {
          text: '🔧 Staging Environment',
          cssClass: 'env-banner-staging',
          description: 'You are viewing the staging branch - changes pending production release'
        };
      default:
        return null;
    }
  }, [environment]);

  useEffect(() => {
    // Check environment from env variable first, then fallback to detection
    const envFromConfig = process.env.NEXT_PUBLIC_APP_ENV;
    const isDev = process.env.NODE_ENV === 'development';

    if (envFromConfig && envFromConfig !== 'production') {
      setEnvironment(envFromConfig);
    } else if (isDev) {
      setEnvironment('development');
    }
  }, []);

  // Update banner visibility when environment or dismissed state changes
  useEffect(() => {
    const config = getEnvironmentConfig();
    const isVisible = !!(environment && config && !isDismissed);
    setBannerVisible(isVisible);
  }, [environment, isDismissed, setBannerVisible, getEnvironmentConfig]);

  if (!environment) return null;

  const config = getEnvironmentConfig();
  if (!config) return null;

  if (isDismissed) return null;

  return (
    <div className={`${config.cssClass} px-4 py-2 text-center text-sm font-medium fixed top-0 left-0 right-0 z-60`}>
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