import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  variant?: BadgeVariant;
  /** Крапка-маркер перед текстом (статуси). */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', dot = false, children, className }: BadgeProps) {
  return (
    <span className={cn(ui.badge[variant], className)}>
      {dot && <span className={ui.badgeDot} aria-hidden="true" />}
      {children}
    </span>
  );
}
