'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Package, CreditCard,
  FileText, Receipt, Zap, Settings, ChevronRight
} from 'lucide-react';

const navItems = [
  { label: 'Main', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Billing', items: [
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/products', label: 'Products & Pricing', icon: Package },
    { href: '/subscriptions', label: 'Subscriptions', icon: Zap },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/payments', label: 'Payments', icon: CreditCard },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/dashboard" className="sidebar-logo">
        <div className="sidebar-logo-icon">💳</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">BillingPro</span>
          <span className="sidebar-logo-tagline">Subscription Platform</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} className="nav-item-icon" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar">A</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">Admin User</div>
          <div className="sidebar-user-role">Super Admin</div>
        </div>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </div>
    </aside>
  );
}
