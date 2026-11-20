import type { ReactNode } from 'react';
import { Card, ErrorState, Spinner } from '@/components/ui';
import { ui } from '@/lib/ui';

interface PageStateProps<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Підпис спінера для скрінрідера. */
  loadingLabel?: string;
  children: (data: T) => ReactNode;
}

/** Типові стани сторінки/блоку: завантаження → помилка (з «Спробувати знову») → дані */
export function PageState<T>({ data, loading, error, onRetry, loadingLabel = 'Завантаження', children }: PageStateProps<T>) {
  if (loading) {
    return (
      <Card className={ui.layout.loadingCard}>
        <Spinner size="lg" label={loadingLabel} />
      </Card>
    );
  }
  if (error && !data) {
    return (
      <Card variant="base">
        <ErrorState message={error} onRetry={onRetry} />
      </Card>
    );
  }
  if (!data) return null;
  return <div className={ui.layout.stack}>{children(data)}</div>;
}
