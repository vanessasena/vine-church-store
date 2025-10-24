'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BannerContextType {
  isBannerVisible: boolean;
  setBannerVisible: (visible: boolean) => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const setBannerVisible = (visible: boolean) => {
    setIsBannerVisible(visible);
  };

  return (
    <BannerContext.Provider value={{ isBannerVisible, setBannerVisible }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
}