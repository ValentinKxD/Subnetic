import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';

export interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}

export function StatCard({ icon, label, value, hint }: StatCardProps) {
  return (
    <div className={ui.statCard.card}>
      <span className={ui.statCard.icon}>{icon}</span>
      <div className={ui.statCard.body}>
        <span className={ui.statCard.label}>{label}</span>
        <span className={ui.statCard.value}>{value}</span>
        {hint && <span className={ui.statCard.hint}>{hint}</span>}
      </div>
    </div>
  );
}
