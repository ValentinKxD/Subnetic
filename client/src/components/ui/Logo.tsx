import { ui } from '@/lib/ui';
import { cn } from '@/lib/cn';

/** Знак «Орбіта»: планета з орбітою та супутником (колір — currentColor). */
export function OrbitMark({ className }: { className?: string }) {
  return (
    <span className={cn(ui.logo.mark, className)}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        <circle cx="17" cy="7.4" r="1.9" fill="currentColor" />
      </svg>
    </span>
  );
}

export interface LogoProps {
  /** Показувати назву поруч зі знаком. */
  withText?: boolean;
}

export function Logo({ withText = true }: LogoProps) {
  return (
    <span className={ui.logo.wrapper}>
      <OrbitMark />
      {withText && <span className={ui.logo.text}>Subnetic</span>}
    </span>
  );
}
