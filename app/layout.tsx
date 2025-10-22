import type { Metadata } from "next";
import "./globals.css";
import EnvironmentBanner from "./components/EnvironmentBanner";

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
        <EnvironmentBanner />
        {children}
      </body>
    </html>
  );
}
