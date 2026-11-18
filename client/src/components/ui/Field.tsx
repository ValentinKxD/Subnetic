import { useId, type ReactNode } from 'react';
import { ui } from '@/lib/ui';
import { cn } from '@/lib/cn';
import { Input, type InputProps } from './Input';
import { InfoIcon } from './icons';

/** Пропси, які Field передає своєму контролу для зв'язку з підписом і помилкою. */
export interface FieldControlProps {
  id: string;
  invalid: boolean;
  'aria-describedby'?: string;
}

export interface FieldProps extends Omit<InputProps, 'id' | 'invalid' | 'children'> {
  label: string;
  hint?: string;
  error?: string;
  /** Клас обгортки (ширина в рядку фільтрів тощо). */
  wrapperClassName?: string;
  /** Інший контрол замість Input (наприклад, Select): отримує id, invalid, aria-describedby. */
  children?: (control: FieldControlProps) => ReactNode;
}

/** Підпис + контрол + підказка/помилка під полем. */
export function Field({ label, hint, error, wrapperClassName, children, ...inputProps }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control: FieldControlProps = { id, invalid: Boolean(error), 'aria-describedby': describedBy };

  return (
    <div className={cn(ui.field.wrapper, wrapperClassName)}>
      <label htmlFor={id} className={ui.label}>
        {label}
      </label>
      {children ? children(control) : <Input {...inputProps} {...control} />}
      {error ? (
        <p id={errorId} className={ui.error}>
          <InfoIcon />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className={ui.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
