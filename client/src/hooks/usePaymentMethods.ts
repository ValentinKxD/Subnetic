import { useCallback } from 'react';
import type { PaymentMethodInput } from '@shared/domain';
import * as api from '@/api/endpoints';
import { useAsync } from './useAsync';

export function usePaymentMethods() {
  const state = useAsync((signal) => api.getPaymentMethods(signal), []);
  const { reload } = state;

  const add = useCallback(
    async (data: PaymentMethodInput) => {
      const m = await api.createPaymentMethod(data);
      reload();
      return m;
    },
    [reload],
  );

  const makeDefault = useCallback(
    async (id: number) => {
      await api.updatePaymentMethod(id, { is_default: true });
      reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (id: number) => {
      await api.deletePaymentMethod(id);
      reload();
    },
    [reload],
  );

  return { ...state, items: state.data?.items ?? [], add, makeDefault, remove };
}
