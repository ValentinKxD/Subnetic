import { ui } from '@/lib/ui';
import { cn } from '@/lib/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Текст для скрінрідерів; без нього спінер декоративний. */
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  if (!label) return <span className={cn(ui.spinner[size], className)} aria-hidden="true" />;
  return (
    <span role="status" aria-live="polite" className="inline-flex">
      <span className={cn(ui.spinner[size], className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
