import { useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { ui } from '@/lib/ui';
import { cn } from '@/lib/cn';
import { EyeIcon, EyeOffIcon } from './icons';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value?: string;
  /** Підсвітити як помилкове (червона рамка + aria-invalid). */
  invalid?: boolean;
  /** Зручний колбек зі значенням замість події. */
  onValueChange?: (value: string) => void;
  /** Декоративна іконка зліва (напр., лупа в пошуку). */
  leadingIcon?: ReactNode;
}

/** Текстове поле. Для `type="password"` додає кнопку «показати/приховати». */
export function Input({
  invalid = false,
  type = 'text',
  onChange,
  onValueChange,
  leadingIcon,
  className,
  ...rest
}: InputProps) {
  const isPassword = type === 'password';
  const [visible, setVisible] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange?.(e);
    onValueChange?.(e.target.value);
  }

  return (
    <div className={ui.input.wrapper}>
      {leadingIcon && (
        <span className={ui.input.leadingIcon} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <input
        {...rest}
        type={isPassword && visible ? 'text' : type}
        onChange={handleChange}
        aria-invalid={invalid || undefined}
        className={cn(
          invalid ? ui.input.invalid : ui.input.base,
          isPassword && ui.input.withAction,
          leadingIcon !== undefined && ui.input.withLeading,
          className,
        )}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Приховати пароль' : 'Показати пароль'}
          aria-pressed={visible}
          className={ui.btn.inset}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
    </div>
  );
}
