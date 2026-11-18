import { useId } from 'react';
import { ui } from '@/lib/ui';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  name?: string;
  disabled?: boolean;
}

export function Checkbox({ label, checked, onCheckedChange, name, disabled }: CheckboxProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={ui.checkbox.label}>
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className={ui.checkbox.input}
      />
      {label}
    </label>
  );
}
