import { useEffect, useState } from 'react';

/** Значення, що оновлюється через `delay` мс після останньої зміни (для пошуку під час набору). */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
