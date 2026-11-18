import type { HTMLAttributes } from 'react';
import { ui } from '@/lib/ui';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** base — без відступів, padded — з p-6, auth — центрована картка екранів входу. */
  variant?: keyof typeof ui.card;
  as?: 'div' | 'section' | 'article' | 'aside';
}

export function Card({ variant = 'padded', as: Tag = 'div', className, ...rest }: CardProps) {
  return <Tag {...rest} className={cn(ui.card[variant], className)} />;
}
