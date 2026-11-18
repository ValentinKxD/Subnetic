import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';
import { InboxIcon } from './icons';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Кнопка дії, наприклад «Додати підписку». */
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className={ui.state.wrapper}>
      <span className={ui.state.iconNeutral}>{icon ?? <InboxIcon />}</span>
      <h3 className={ui.state.title}>{title}</h3>
      {description && <p className={ui.state.text}>{description}</p>}
      {action}
    </div>
  );
}
