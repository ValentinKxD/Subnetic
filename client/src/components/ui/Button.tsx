import type { ButtonHTMLAttributes } from 'react';
import { ui } from '@/lib/ui';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Показує спінер і блокує кнопку. */
  loading?: boolean;
  /** На всю ширину контейнера. */
  block?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  block = false,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(ui.btn[variant], block && ui.btn.block, className)}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
