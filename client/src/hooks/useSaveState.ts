import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; message: string } | { kind: 'error'; message: string };

/**
 * Стан «миттєвого збереження» (перемикачі, select-и в налаштуваннях):
 * saving → saved (зникає за 2.5 с) або error з повідомленням.
 */
export function useSaveState() {
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const run = useCallback(async (fn: () => Promise<unknown>, savedMessage = 'Збережено') => {
    if (timer.current) clearTimeout(timer.current);
    setState({ kind: 'saving' });
    try {
      await fn();
      setState({ kind: 'saved', message: savedMessage });
      timer.current = setTimeout(() => setState({ kind: 'idle' }), 2500);
      return true;
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Не вдалося зберегти' });
      return false;
    }
  }, []);

  return { state, run };
}
