import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export interface AsyncState<T> {
  data: T | null;
  /** Перше завантаження (даних ще немає). */
  loading: boolean;
  /** Повторне завантаження поверх наявних даних. */
  refreshing: boolean;
  error: string | null;
  reload: () => void;
}

/** Запит даних зі скасуванням застарілих запитів */
export function useAsync<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const ctrl = new AbortController();
    setPending(true);
    setError(null);
    fetcherRef
      .current(ctrl.signal)
      .then((d) => {
        if (!ctrl.signal.aborted) setData(d);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Не вдалося завантажити дані');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setPending(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading: pending && data === null, refreshing: pending && data !== null, error, reload };
}
