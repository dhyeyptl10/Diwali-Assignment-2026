import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export const metadata: Metadata = {
  title: "BillingPro — Subscription & Billing Management",
  description:
    "Centralized billing and subscription management platform. Manage customers, products, subscriptions, invoices, and payments in one place.",
  keywords: "billing, subscription, invoices, payments, SaaS, management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="main-wrapper">
            <TopBar />
            <main className="main-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
