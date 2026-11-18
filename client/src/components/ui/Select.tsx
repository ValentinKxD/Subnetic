import type { ChangeEvent, SelectHTMLAttributes } from 'react';
import { ui } from '@/lib/ui';
import { cn } from '@/lib/cn';
import { ChevronDownIcon } from './icons';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value'> {
  value?: string;
  options: SelectOption[];
  /** Порожній варіант-підказка на початку списку. */
  placeholder?: string;
  invalid?: boolean;
  onValueChange?: (value: string) => void;
}

/** Нативний select у стилі полів вводу. */
export function Select({
  options,
  placeholder,
  invalid = false,
  onChange,
  onValueChange,
  className,
  ...rest
}: SelectProps) {
  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    onChange?.(e);
    onValueChange?.(e.target.value);
  }

  return (
    <div className={ui.input.wrapper}>
      <select
        {...rest}
        onChange={handleChange}
        aria-invalid={invalid || undefined}
        className={cn(invalid ? ui.input.invalid : ui.input.base, ui.input.withAction, 'appearance-none', className)}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <span className={ui.input.selectArrow}>
        <ChevronDownIcon />
      </span>
    </div>
  );
}
