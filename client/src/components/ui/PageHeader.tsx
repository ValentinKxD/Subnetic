import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Кнопки праворуч (напр. «Додати підписку»). */
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className={ui.layout.pageHeader}>
      <div className={ui.page.heading}>
        <h1 className={ui.layout.pageTitle}>{title}</h1>
        {subtitle && <p className={ui.layout.pageSubtitle}>{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}
