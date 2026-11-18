import { useCallback } from 'react';
import type {
  SubscriptionCreateInput,
  SubscriptionQuery,
  SubscriptionStatus,
  SubscriptionUpdateInput,
} from '@shared/domain';
import * as api from '@/api/endpoints';
import { useAsync } from './useAsync';
import { useSettings } from './SettingsContext';

export interface SubscriptionFiltersValue {
  q: string;
  status: SubscriptionStatus | '';
  category: string;
  sort: NonNullable<SubscriptionQuery['sort']>;
}

export const DEFAULT_SUBSCRIPTION_FILTERS: SubscriptionFiltersValue = {
  q: '',
  status: '',
  category: '',
  sort: 'next_payment',
};

/** Список підписок з фільтрами + мутації (після кожної — перезавантаження списку). */
export function useSubscriptions(filters: SubscriptionFiltersValue) {
  const { currency } = useSettings();
  const query: SubscriptionQuery = {
    q: filters.q.trim() || undefined,
    status: filters.status || undefined,
    category: filters.category ? Number(filters.category) : undefined,
    sort: filters.sort,
  };
  const state = useAsync(
    (signal) => api.getSubscriptions(query, signal),
    [currency, query.q, query.status, query.category, query.sort],
  );
  const { reload } = state;

  const create = useCallback(
    async (data: SubscriptionCreateInput) => {
      const s = await api.createSubscription(data);
      reload();
      return s;
    },
    [reload],
  );

  const update = useCallback(
    async (id: number, data: SubscriptionUpdateInput) => {
      const s = await api.updateSubscription(id, data);
      reload();
      return s;
    },
    [reload],
  );

  const setStatus = useCallback((id: number, status: SubscriptionStatus) => update(id, { status }), [update]);

  const remove = useCallback(
    async (id: number) => {
      await api.deleteSubscription(id);
      reload();
    },
    [reload],
  );

  return { ...state, create, update, setStatus, remove };
}
