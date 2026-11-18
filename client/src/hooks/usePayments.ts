import { useCallback } from 'react';
import type { PaymentHistoryQuery, PaymentStatus } from '@shared/domain';
import * as api from '@/api/endpoints';
import { useAsync } from './useAsync';
import { useSettings } from './SettingsContext';

/** Платежі місяця для календаря (минулі + обчислені майбутні). */
export function useCalendar(month: string) {
  const { currency } = useSettings();
  return useAsync((signal) => api.getCalendar(month, signal), [month, currency]);
}

export interface PaymentHistoryFilters {
  q: string;
  status: PaymentStatus | '';
  from: string;
  to: string;
}

export const DEFAULT_HISTORY_FILTERS: PaymentHistoryFilters = { q: '', status: '', from: '', to: '' };

/** Історія здійснених платежів з фільтрами. */
export function usePaymentHistory(filters: PaymentHistoryFilters & { refreshKey?: number }) {
  const { currency } = useSettings();
  const query: PaymentHistoryQuery = {
    q: filters.q.trim() || undefined,
    status: filters.status || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };
  return useAsync(
    (signal) => api.getPaymentHistory(query, signal),
    [currency, query.q, query.status, query.from, query.to, filters.refreshKey],
  );
}

/** «Позначити оплаченим»: створює платіж і зсуває дату наступного списання. */
export function useMarkPaid(onDone: () => void) {
  return useCallback(
    async (subscriptionId: number) => {
      const res = await api.paySubscription(subscriptionId);
      onDone();
      return res;
    },
    [onDone],
  );
}
