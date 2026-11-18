import { Badge, type BadgeVariant } from '@/components/ui';
import { formatRelativeDays, paymentStatusLabels } from '@/lib/format';
import type { CalendarItem, PaymentStatus } from '@/lib/types';

const paidVariants: Record<PaymentStatus, BadgeVariant> = { paid: 'success', failed: 'danger', refunded: 'neutral' };

/** Статус платежу: сплачено/помилка/повернено або «через N днів» / «прострочено». */
export function PaymentStatusBadge({ item }: { item: Pick<CalendarItem, 'kind' | 'payment_status' | 'overdue' | 'trial_end' | 'date'> }) {
  if (item.kind === 'paid' && item.payment_status) {
    return (
      <Badge variant={paidVariants[item.payment_status]} dot>
        {paymentStatusLabels[item.payment_status]}
      </Badge>
    );
  }
  if (item.overdue) {
    return (
      <Badge variant="danger" dot>
        Прострочено
      </Badge>
    );
  }
  return (
    <Badge variant={item.trial_end ? 'info' : 'accent'} dot>
      {item.trial_end ? `Кінець пробного · ${formatRelativeDays(item.date).toLowerCase()}` : formatRelativeDays(item.date)}
    </Badge>
  );
}
