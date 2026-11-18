import { getDashboard } from '@/api/endpoints';
import { useAsync } from './useAsync';
import { useSettings } from './SettingsContext';

/** Дані дашборда; перезавантажуються при зміні валюти користувача. */
export function useDashboard() {
  const { currency } = useSettings();
  return useAsync((signal) => getDashboard(signal), [currency]);
}
