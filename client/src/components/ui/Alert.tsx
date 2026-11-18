import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';
import { InfoIcon } from './icons';

export interface AlertProps {
  variant: 'info' | 'success' | 'error';
  children: ReactNode;
}

/** Повідомлення в межах форми/сторінки. error оголошується скрінрідером одразу. */
export function Alert({ variant, children }: AlertProps) {
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={ui.alert[variant]}>
      <span className={ui.alert.icon}>
        <InfoIcon size={18} />
      </span>
      <span>{children}</span>
    </div>
  );
}
