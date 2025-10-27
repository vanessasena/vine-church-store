import type { Metadata } from "next";
import "./globals.css";
import EnvironmentBanner from "./components/EnvironmentBanner";
import Header from "./components/Header";
import DynamicLayout from "./components/DynamicLayout";
import { BannerProvider } from "./contexts/BannerContext";
import { AuthProvider } from "./contexts/AuthContext";

export const metadata: Metadata = {
  title: "Vine Church Orders Management",
  description: "Orders management system for Vine Church",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <BannerProvider>
            <EnvironmentBanner />
            <Header />
            <DynamicLayout>
              {children}
            </DynamicLayout>
          </BannerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
