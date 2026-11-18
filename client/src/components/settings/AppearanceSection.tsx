import { getRates } from '@/api/endpoints';
import { Field, GlobeIcon, InfoIcon, Select } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useSaveState } from '@/hooks/useSaveState';
import { useSettings } from '@/hooks/SettingsContext';
import { currencyLabels, formatMoney } from '@/lib/format';
import type { Currency, Settings, Theme } from '@/lib/types';
import { ui } from '@/lib/ui';
import { SettingsSection } from './SettingsSection';

const CURRENCY_OPTIONS = (Object.keys(currencyLabels) as Currency[]).map((c) => ({ value: c, label: currencyLabels[c] }));
const THEME_OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Світла' },
  { value: 'dark', label: 'Темна' },
];

/** Валюта відображення і тема. Зберігається одразу; валюта перераховує суми на всіх сторінках. */
export function AppearanceSection({ settings }: { settings: Settings }) {
  const { update } = useSettings();
  const save = useSaveState();
  const rates = useAsync((signal) => getRates(signal), []);

  return (
    <SettingsSection icon={<GlobeIcon size={20} />} title="Вигляд" saveState={save.state}>
      <Field label="Валюта">
        {(c) => (
          <Select
            {...c}
            value={settings.currency}
            options={CURRENCY_OPTIONS}
            onValueChange={(v) => save.run(() => update({ currency: v as Currency }), 'Валюту змінено — суми перераховано')}
          />
        )}
      </Field>
      <Field label="Тема">
        {(c) => (
          <Select
            {...c}
            value={settings.theme}
            options={THEME_OPTIONS}
            onValueChange={(v) => save.run(() => update({ theme: v as Theme }))}
          />
        )}
      </Field>
      <p className={ui.list.cell}>
        <span className={ui.hint}>
          <InfoIcon />
        </span>
        <span className={ui.hint}>
          {rates.data
            ? `Фіксовані курси (заглушка): 1 $ = ${formatMoney(rates.data.rates.USD, 'UAH')}, 1 € = ${formatMoney(rates.data.rates.EUR, 'UAH')}. Ціни в інших валютах перераховуються автоматично.`
            : 'Ціни в інших валютах перераховуються автоматично за курсом.'}
        </span>
      </p>
    </SettingsSection>
  );
}
