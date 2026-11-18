import { useCallback } from 'react';
import type { CustomPlanInput, CustomServiceInput } from '@shared/domain';
import * as api from '@/api/endpoints';
import { useAsync } from './useAsync';

/** Каталог сервісів і тарифів (глобальні + власні) і створення власних. */
export function useCatalog() {
  const state = useAsync((signal) => api.getCatalog(signal), []);
  const { reload } = state;

  const addService = useCallback(async (data: CustomServiceInput) => {
    const s = await api.createCustomService(data);
    return s;
  }, []);

  const addPlan = useCallback(async (data: CustomPlanInput) => {
    const p = await api.createCustomPlan(data);
    return p;
  }, []);

  return { ...state, addService, addPlan, reload };
}
