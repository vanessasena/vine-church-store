import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vine Church Cafeteria",
  description: "Cafeteria management system for Vine Church",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
