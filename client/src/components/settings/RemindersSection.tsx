import { settingsPatchSchema, type SettingsPatch } from '@shared/domain';
import { BellIcon, Field, Select, Switch } from '@/components/ui';
import { useSaveState } from '@/hooks/useSaveState';
import { useSettings } from '@/hooks/SettingsContext';
import type { Settings } from '@/lib/types';
import { ui } from '@/lib/ui';
import { SettingsSection } from './SettingsSection';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, '0')}:00` }));

const SWITCHES: Array<{ key: 'remind_7' | 'remind_3' | 'remind_1'; label: string }> = [
  { key: 'remind_7', label: 'За 7 днів до платежу' },
  { key: 'remind_3', label: 'За 3 дні до платежу' },
  { key: 'remind_1', label: 'За 1 день до платежу' },
];

/** Коли нагадувати про платежі. Кожна зміна валідується zod і зберігається одразу. */
export function RemindersSection({ settings }: { settings: Settings }) {
  const { update } = useSettings();
  const save = useSaveState();

  function apply(patch: SettingsPatch) {
    const parsed = settingsPatchSchema.safeParse(patch);
    if (!parsed.success) {
      void save.run(() => Promise.reject(new Error(parsed.error.issues[0]?.message ?? 'Некоректне значення')));
      return;
    }
    void save.run(() => update(parsed.data));
  }

  const anyOn = settings.remind_7 || settings.remind_3 || settings.remind_1;

  return (
    <SettingsSection
      icon={<BellIcon size={20} />}
      title="Нагадування"
      subtitle={settings.telegram.linked ? 'Надходитимуть у Telegram' : 'Прив’яжіть Telegram, щоб отримувати нагадування'}
      saveState={save.state}
    >
      <div className={ui.list.plain} role="group" aria-label="Коли нагадувати">
        {SWITCHES.map((s) => (
          <Switch key={s.key} label={s.label} checked={settings[s.key]} onCheckedChange={(v) => apply({ [s.key]: v })} />
        ))}
      </div>
      <Field label="Час надсилання" wrapperClassName={ui.filters.narrow} hint={anyOn ? undefined : 'Усі нагадування вимкнено'}>
        {(c) => (
          <Select
            {...c}
            value={String(settings.remind_hour)}
            options={HOUR_OPTIONS}
            onValueChange={(v) => apply({ remind_hour: Number(v) })}
          />
        )}
      </Field>
    </SettingsSection>
  );
}
