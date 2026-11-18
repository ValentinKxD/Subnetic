import { Badge, type BadgeVariant } from '@/components/ui';
import { statusLabels } from '@/lib/format';
import type { SubscriptionStatus } from '@/lib/types';

/** Колір + текст: статус розрізняється не лише кольором. */
const variants: Record<SubscriptionStatus, BadgeVariant> = {
  active: 'success',
  trial: 'info',
  paused: 'warning',
  cancelled: 'neutral',
  expired: 'danger',
};

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <Badge variant={variants[status]} dot>
      {statusLabels[status]}
    </Badge>
  );
}
