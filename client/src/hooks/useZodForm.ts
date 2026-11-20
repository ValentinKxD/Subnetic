import { useCallback, useMemo, useState, type FormEvent } from 'react';
import type { z } from 'zod';
import { fieldErrors } from '@shared/auth';
import { ApiError } from '@/api/client';

/** Невеликий хук форм на zod */
export function useZodForm<S extends z.ZodTypeAny>(
  schema: S,
  initial: z.input<S>,
  onValid: (data: z.output<S>) => Promise<void>,
) {
  type Values = z.input<S>;
  type Key = keyof Values & string;

  const [values, setValues] = useState<Values>(initial);
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clientErrors = useMemo<Record<string, string>>(() => {
    const r = schema.safeParse(values);
    return r.success ? {} : fieldErrors(r.error);
  }, [schema, values]);

  const errorFor = useCallback(
    (key: Key): string | undefined => {
      const showClient = submitted || touched[key] === true;
      return (showClient ? clientErrors[key] : undefined) ?? serverErrors[key];
    },
    [clientErrors, serverErrors, submitted, touched],
  );

  const setField = useCallback(<K extends Key>(key: K, value: Values[K]) => {
    setValues((prev: Values) => ({ ...prev, [key]: value }) as Values);
    setServerErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFormError(null);
  }, []);

  const blurField = useCallback((key: Key) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitted(true);
      setFormError(null);

      const r = schema.safeParse(values);
      if (!r.success) {
        // Фокус на перше поле з помилкою — зручно для клавіатури й скрінрідерів.
        const first = Object.keys(fieldErrors(r.error))[0];
        if (first) e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        return;
      }

      setSubmitting(true);
      try {
        await onValid(r.data as z.output<S>);
      } catch (err) {
        if (err instanceof ApiError) {
          setServerErrors(err.fields);
          // Якщо сервер позначив конкретні поля — загальне повідомлення не дублюємо.
          setFormError(Object.keys(err.fields).length > 0 ? null : err.message);
        } else {
          setFormError('Щось пішло не так. Спробуйте ще раз.');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [onValid, schema, submitting, values],
  );

  return { values, setField, blurField, errorFor, formError, submitting, handleSubmit };
}
