'use client';

import { usePathname } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';

const labels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/products': 'Products & Pricing',
  '/subscriptions': 'Subscriptions',
  '/invoices': 'Invoices',
  '/payments': 'Payments',
};

export default function TopBar() {
  const pathname = usePathname();
  const base = '/' + (pathname.split('/')[1] || '');
  const label = labels[base] || 'BillingPro';

  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        <span>BillingPro</span>
        <ChevronRight size={14} />
        <span className="topbar-breadcrumb-current">{label}</span>
      </div>

      <div className="topbar-actions">
        <div className="topbar-badge">
          <span className="topbar-dot" />
          Live
        </div>
        <button className="btn btn-secondary btn-sm btn-icon" title="Notifications">
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
