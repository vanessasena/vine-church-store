'use client';

import { useBanner } from '../contexts/BannerContext';

interface DynamicLayoutProps {
  children: React.ReactNode;
}

export default function DynamicLayout({ children }: DynamicLayoutProps) {
  const { isBannerVisible } = useBanner();

  return (
    <div className={isBannerVisible ? 'pt-24' : 'pt-16'}>
      {children}
    </div>
  );
}