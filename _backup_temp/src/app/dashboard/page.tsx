'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, seedIfEmpty } from '@/lib/store';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import Badge from '@/components/Badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
  TrendingUp, Users, Zap, FileText, AlertTriangle,
  Clock, ArrowUpRight, DollarSign, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import type { DashboardStats } from '@/lib/types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '10px 14px',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || 'var(--accent-light)', fontWeight: 600, fontSize: 14 }}>
          {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    seedIfEmpty();
    setStats(getDashboardStats() as DashboardStats);
  }, []);

  if (!stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Monthly Recurring Revenue',
      value: formatCurrency(stats.mrr),
      icon: TrendingUp,
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.12)',
      change: '+12.4%',
      changeDir: 'up',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      change: '+8.1%',
      changeDir: 'up',
    },
    {
      label: 'Active Subscriptions',
      value: stats.activeSubscriptions.toString(),
      icon: Zap,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
      change: '+3 this month',
      changeDir: 'up',
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.12)',
      change: 'All time',
      changeDir: 'neutral',
    },
    {
      label: 'Pending Invoices',
      value: stats.pendingInvoices.toString(),
      icon: FileText,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      change: 'Awaiting payment',
      changeDir: 'neutral',
    },
    {
      label: 'Overdue Invoices',
      value: stats.overdueInvoices.toString(),
      icon: AlertTriangle,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      change: 'Requires action',
      changeDir: stats.overdueInvoices > 0 ? 'down' : 'neutral',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="page-subtitle">Your billing overview at a glance</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { seedIfEmpty(); setStats(getDashboardStats() as DashboardStats); }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <Link href="/invoices" className="btn btn-primary btn-sm">
            <FileText size={14} />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">{card.label}</span>
                <div className="stat-card-icon" style={{ background: card.bg }}>
                  <Icon size={18} style={{ color: card.color }} />
                </div>
              </div>
              <div className="stat-card-value">{card.value}</div>
              <div className={`stat-card-change ${card.changeDir}`}>
                {card.changeDir === 'up' && <ArrowUpRight size={12} />}
                {card.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Revenue Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <div>
              <div className="chart-title">Monthly Revenue</div>
              <div className="chart-subtitle">Revenue collected over last 6 months</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.monthlyRevenueTrend}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subscriptions Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <div>
              <div className="chart-title">New Subscriptions</div>
              <div className="chart-subtitle">Subscriptions added each month</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthlyRevenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="subscriptions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Upcoming Renewals */}
        <div className="table-wrapper">
          <div className="table-header-row">
            <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: 'var(--warning)' }} />
              Upcoming Renewals
            </div>
            <Link href="/subscriptions" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {stats.upcomingRenewals.length === 0 ? (
            <div className="table-empty">
              <div className="table-empty-text">No upcoming renewals in 30 days</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Renews In</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.upcomingRenewals.map(({ subscription, customer, plan }) => (
                  <tr key={subscription.id}>
                    <td>
                      <Link href={`/customers/${customer.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {customer.name}
                      </Link>
                    </td>
                    <td>{plan.name}</td>
                    <td>
                      <span style={{ color: daysUntil(subscription.currentPeriodEnd) <= 3 ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>
                        {daysUntil(subscription.currentPeriodEnd)}d
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-accent)', fontWeight: 600 }}>
                      {formatCurrency(plan.price * subscription.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Payments */}
        <div className="table-wrapper">
          <div className="table-header-row">
            <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={16} style={{ color: 'var(--success)' }} />
              Recent Payments
            </div>
            <Link href="/payments" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {stats.recentPayments.length === 0 ? (
            <div className="table-empty">
              <div className="table-empty-text">No payments recorded yet</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.customerName}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{payment.invoiceNumber}</td>
                    <td style={{ color: payment.status === 'successful' ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 600 }}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td><Badge status={payment.status} dot /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
