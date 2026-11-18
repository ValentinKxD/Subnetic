import { useId } from 'react';
import { ui } from '@/lib/ui';

export interface SwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Додатковий опис під підписом (для скрінрідера — через aria-describedby). */
  description?: string;
}

/** Перемикач-тумблер (role="switch"), зона натиску ≥ 44px по висоті. */
export function Switch({ label, checked, onCheckedChange, disabled, description }: SwitchProps) {
  const id = useId();
  return (
    <div className={ui.switch.row}>
      <label htmlFor={id} className="flex flex-col">
        <span>{label}</span>
        {description && (
          <span id={`${id}-desc`} className={ui.hint}>
            {description}
          </span>
        )}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={checked ? ui.switch.trackOn : ui.switch.trackOff}
      >
        <span className={checked ? ui.switch.thumbOn : ui.switch.thumbOff} aria-hidden="true" />
      </button>
    </div>
  );
}
