import { ui } from '@/lib/ui';
import { Button } from './Button';
import { AlertTriangleIcon } from './icons';

export interface ErrorStateProps {
  title?: string;
  message: string;
  /** Якщо передано — показує кнопку «Спробувати знову». */
  onRetry?: () => void;
  retrying?: boolean;
}

export function ErrorState({ title = 'Не вдалося завантажити дані', message, onRetry, retrying }: ErrorStateProps) {
  return (
    <div role="alert" className={ui.state.wrapper}>
      <span className={ui.state.iconDanger}>
        <AlertTriangleIcon />
      </span>
      <h3 className={ui.state.title}>{title}</h3>
      <p className={ui.state.text}>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} loading={retrying}>
          Спробувати знову
        </Button>
      )}
    </div>
  );
}
