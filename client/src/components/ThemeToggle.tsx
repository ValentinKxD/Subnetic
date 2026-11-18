import { MoonIcon, SunIcon } from '@/components/ui';
import { useTheme } from '@/hooks/ThemeContext';
import type { Theme } from '@/lib/types';
import { ui } from '@/lib/ui';

export interface ThemeToggleProps {
  /** Як застосувати тему. За замовчуванням — лише локально (екрани входу); у застосунку — ще й на сервер. */
  onChange?: (theme: Theme) => void;
}

export function ThemeToggle({ onChange }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const label = theme === 'dark' ? 'Перемкнути на світлу тему' : 'Перемкнути на темну тему';

  return (
    <button
      type="button"
      onClick={() => (onChange ?? setTheme)(next)}
      aria-label={label}
      title={label}
      className={ui.btn.icon}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
