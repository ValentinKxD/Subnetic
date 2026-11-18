import { Button, Card, Field, SearchIcon, Select } from '@/components/ui';
import { DEFAULT_SUBSCRIPTION_FILTERS, type SubscriptionFiltersValue } from '@/hooks/useSubscriptions';
import type { Category, StatusCounts, SubscriptionSort, SubscriptionStatus } from '@/lib/types';
import { ui } from '@/lib/ui';

export interface SubscriptionFiltersProps {
  value: SubscriptionFiltersValue;
  onChange: (value: SubscriptionFiltersValue) => void;
  categories: Category[];
  counts: StatusCounts | null;
}

const STATUS_CHIPS: Array<{ value: SubscriptionStatus | ''; label: string; countKey: keyof StatusCounts }> = [
  { value: '', label: 'Усі', countKey: 'all' },
  { value: 'active', label: 'Активні', countKey: 'active' },
  { value: 'trial', label: 'Пробні', countKey: 'trial' },
  { value: 'paused', label: 'Пауза', countKey: 'paused' },
  { value: 'cancelled', label: 'Скасовані', countKey: 'cancelled' },
  { value: 'expired', label: 'Завершені', countKey: 'expired' },
];

const SORT_OPTIONS: Array<{ value: SubscriptionSort; label: string }> = [
  { value: 'next_payment', label: 'За датою платежу' },
  { value: 'name', label: 'За назвою' },
  { value: 'price_desc', label: 'Спершу дорожчі' },
  { value: 'price_asc', label: 'Спершу дешевші' },
];

/** Пошук, категорія, сортування і чипи статусів. */
export function SubscriptionFilters({ value, onChange, categories, counts }: SubscriptionFiltersProps) {
  const set = <K extends keyof SubscriptionFiltersValue>(key: K, v: SubscriptionFiltersValue[K]) =>
    onChange({ ...value, [key]: v });
  const isDefault = JSON.stringify(value) === JSON.stringify(DEFAULT_SUBSCRIPTION_FILTERS);

  return (
    <Card as="section" aria-label="Фільтри" className={ui.layout.cardStack}>
      <div className={ui.layout.toolbar}>
        <Field
          label="Пошук"
          type="search"
          placeholder="Назва сервісу або тарифу"
          leadingIcon={<SearchIcon size={20} />}
          value={value.q}
          onValueChange={(v) => set('q', v)}
          wrapperClassName={ui.filters.search}
        />
        <Field label="Категорія" wrapperClassName={ui.filters.select}>
          {(control) => (
            <Select
              {...control}
              value={value.category}
              onValueChange={(v) => set('category', v)}
              options={[{ value: '', label: 'Усі категорії' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
            />
          )}
        </Field>
        <Field label="Сортування" wrapperClassName={ui.filters.select}>
          {(control) => (
            <Select
              {...control}
              value={value.sort}
              onValueChange={(v) => set('sort', v as SubscriptionSort)}
              options={SORT_OPTIONS}
            />
          )}
        </Field>
        <Button variant="secondary" onClick={() => onChange(DEFAULT_SUBSCRIPTION_FILTERS)} disabled={isDefault}>
          Скинути
        </Button>
      </div>
      <div className={ui.chip.group} role="group" aria-label="Статус">
        {STATUS_CHIPS.map((chip) => {
          const active = value.status === chip.value;
          return (
            <button
              key={chip.label}
              type="button"
              aria-pressed={active}
              onClick={() => set('status', chip.value)}
              className={active ? ui.chip.on : ui.chip.off}
            >
              {chip.label}
              {counts && <span className={ui.chip.count}>{counts[chip.countKey]}</span>}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
