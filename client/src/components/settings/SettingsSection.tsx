import { useId, type ReactNode } from 'react';
import { Card, Spinner } from '@/components/ui';
import type { SaveState } from '@/hooks/useSaveState';
import { ui } from '@/lib/ui';

export interface SettingsSectionProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /** Кнопки праворуч від заголовка. */
  actions?: ReactNode;
  /** Стан миттєвого збереження — показується під заголовком. */
  saveState?: SaveState;
  children: ReactNode;
}

/** Секція-картка налаштувань: іконка, заголовок, вміст. */
export function SettingsSection({ icon, title, subtitle, actions, saveState, children }: SettingsSectionProps) {
  const titleId = useId();
  return (
    <Card as="section" aria-labelledby={titleId} className={ui.layout.cardStack}>
      <div className={ui.layout.cardHeader}>
        <div className={ui.section.header}>
          <span className={ui.section.icon}>{icon}</span>
          <div className={ui.section.titles}>
            <h2 id={titleId} className={ui.section.title}>
              {title}
            </h2>
            {subtitle && <span className={ui.section.subtitle}>{subtitle}</span>}
          </div>
        </div>
        {actions}
      </div>
      {children}
      <SaveStatus state={saveState} />
    </Card>
  );
}

function SaveStatus({ state }: { state?: SaveState }) {
  // Регіон завжди в DOM, щоб скрінрідер оголошував зміни.
  return (
    <p role="status" aria-live="polite" className={state?.kind === 'error' ? ui.error : ui.hint}>
      {state?.kind === 'saving' && (
        <span className={ui.list.cell}>
          <Spinner size="sm" /> Збереження…
        </span>
      )}
      {state?.kind === 'saved' && state.message}
      {state?.kind === 'error' && state.message}
    </p>
  );
}
