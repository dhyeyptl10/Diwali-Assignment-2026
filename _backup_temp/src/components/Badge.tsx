'use client';

interface BadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
}

const labels: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  past_due: 'Past Due',
  draft: 'Draft',
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  successful: 'Successful',
  failed: 'Failed',
  monthly: 'Monthly',
  yearly: 'Yearly',
  'one-time': 'One-time',
};

export default function Badge({ status, label, dot = false }: BadgeProps) {
  const className = `badge badge-${status.replace(/ /g, '_').toLowerCase()}`;
  const text = label ?? labels[status] ?? status;

  return (
    <span className={className}>
      {dot && <span className="badge-dot" />}
      {text}
    </span>
  );
}
