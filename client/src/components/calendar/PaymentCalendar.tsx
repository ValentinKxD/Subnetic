import { createContext, useContext, useMemo } from 'react';
import { DayPicker, type DayButtonProps } from 'react-day-picker';
import { uk } from 'react-day-picker/locale';
import { addMonthsToMonth } from '@shared/dates';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui';
import { formatDayMonth, formatMonthYear } from '@/lib/format';
import type { CalendarItem } from '@/lib/types';
import { cn } from '@/lib/cn';
import { ui } from '@/lib/ui';

export interface PaymentCalendarProps {
  /** 'YYYY-MM' */
  month: string;
  onMonthChange: (month: string) => void;
  items: CalendarItem[];
  /** 'YYYY-MM-DD' */
  selected: string;
  onSelect: (date: string) => void;
}

/** Скільки платежів показувати в клітинці; решта — «+N». */
const MAX_CHIPS = 2;

function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

type ItemTone = 'Paid' | 'Overdue' | 'Trial' | 'Expected';

function tone(item: CalendarItem): ItemTone {
  if (item.kind === 'paid') return 'Paid';
  if (item.overdue) return 'Overdue';
  if (item.trial_end) return 'Trial';
  return 'Expected';
}

const chipClass: Record<ItemTone, string> = {
  Paid: ui.calendar.chipPaid,
  Overdue: ui.calendar.chipOverdue,
  Trial: ui.calendar.chipTrial,
  Expected: ui.calendar.chipExpected,
};

const dotClass: Record<ItemTone, string> = {
  Paid: ui.calendar.dotPaid,
  Overdue: ui.calendar.dotOverdue,
  Trial: ui.calendar.dotTrial,
  Expected: ui.calendar.dotExpected,
};

/** Платежі за датою — для клітинок календаря (через контекст, щоб DayButton був стабільним компонентом). */
const ItemsByDateContext = createContext<Map<string, CalendarItem[]>>(new Map());

function PaymentDayButton({ day, modifiers, className, ...buttonProps }: DayButtonProps) {
  const byDate = useContext(ItemsByDateContext);
  const items = modifiers.outside ? [] : (byDate.get(toISO(day.date)) ?? []);
  return (
    <button {...buttonProps} className={cn(ui.calendar.dayButton, className)}>
      <span className={modifiers.today ? ui.calendar.dayNumberToday : ui.calendar.dayNumber}>{day.date.getDate()}</span>
      {items.length > 0 && (
        <span className={ui.calendar.dots} aria-hidden="true">
          {items.map((i) => (
            <span key={i.key} className={dotClass[tone(i)]} />
          ))}
        </span>
      )}
      {items.length > 0 && (
        <span className={ui.calendar.chips} aria-hidden="true">
          {items.slice(0, MAX_CHIPS).map((i) => (
            <span key={i.key} className={chipClass[tone(i)]}>
              {i.service.name}
            </span>
          ))}
          {items.length > MAX_CHIPS && <span className={ui.calendar.more}>+{items.length - MAX_CHIPS}</span>}
        </span>
      )}
    </button>
  );
}

/** Календар платежів місяця на react-day-picker, стилізований токенами теми */
export function PaymentCalendar({ month, onMonthChange, items, selected, onSelect }: PaymentCalendarProps) {
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const i of items) map.set(i.date, [...(map.get(i.date) ?? []), i]);
    return map;
  }, [items]);

  const monthDate = fromISO(`${month}-01`);

  return (
    <div className={ui.layout.cardStack}>
      <div className={ui.calendar.header}>
        <div className={ui.calendar.nav}>
          <button
            type="button"
            className={ui.iconBtn.bordered}
            aria-label="Попередній місяць"
            onClick={() => onMonthChange(addMonthsToMonth(month, -1))}
          >
            <ChevronLeftIcon size={20} />
          </button>
          <h2 className={ui.calendar.title} aria-live="polite">
            {formatMonthYear(month)}
          </h2>
          <button
            type="button"
            className={ui.iconBtn.bordered}
            aria-label="Наступний місяць"
            onClick={() => onMonthChange(addMonthsToMonth(month, 1))}
          >
            <ChevronRightIcon size={20} />
          </button>
        </div>
        <ul className={ui.legend.list} aria-label="Легенда">
          <li className={ui.legend.item}>
            <span className={ui.legend.paid} aria-hidden="true" />
            Сплачено
          </li>
          <li className={ui.legend.item}>
            <span className={ui.legend.expected} aria-hidden="true" />
            Очікується
          </li>
          <li className={ui.legend.item}>
            <span className={ui.legend.trial} aria-hidden="true" />
            Кінець пробного
          </li>
        </ul>
      </div>

      <ItemsByDateContext.Provider value={byDate}>
        <DayPicker
          mode="single"
          required
          locale={uk}
          weekStartsOn={1}
          showOutsideDays
          hideNavigation
          month={monthDate}
          onMonthChange={(d) => onMonthChange(toISO(d).slice(0, 7))}
          selected={fromISO(selected)}
          onSelect={(d) => d && onSelect(toISO(d))}
          components={{ DayButton: PaymentDayButton }}
          labels={{
            labelDayButton: (date) => {
              const list = byDate.get(toISO(date)) ?? [];
              const base = formatDayMonth(toISO(date));
              if (list.length === 0) return base;
              const desc = list
                .map((i) => `${i.service.name} — ${i.kind === 'paid' ? 'сплачено' : i.overdue ? 'прострочено' : 'очікується'}`)
                .join(', ');
              return `${base}: ${desc}`;
            },
          }}
          classNames={{
            root: ui.calendar.root,
            months: ui.calendar.months,
            month: ui.calendar.month,
            month_caption: ui.srOnly,
            month_grid: ui.calendar.grid,
            weekday: ui.calendar.weekday,
            day: ui.calendar.day,
            selected: ui.calendar.selected,
            outside: ui.calendar.outside,
            today: ui.calendar.today,
          }}
        />
      </ItemsByDateContext.Provider>
    </div>
  );
}
