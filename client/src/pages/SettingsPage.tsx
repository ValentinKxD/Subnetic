import { PageState } from '@/components/common/PageState';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { PaymentMethodsSection } from '@/components/settings/PaymentMethodsSection';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { RemindersSection } from '@/components/settings/RemindersSection';
import { TelegramSection } from '@/components/settings/TelegramSection';
import { PageHeader } from '@/components/ui';
import { useSettings } from '@/hooks/SettingsContext';
import { ui } from '@/lib/ui';

export function SettingsPage() {
  const { settings, loading, error, reload } = useSettings();

  return (
    <div className={ui.layout.stack}>
      <PageHeader title="Налаштування" subtitle="Профіль, сповіщення та відображення" />
      <PageState data={settings} loading={loading} error={error} onRetry={reload} loadingLabel="Завантаження налаштувань">
        {(s) => (
          <>
            <div className={ui.layout.grid2}>
              <div className={ui.layout.column}>
                <ProfileSection />
                <AppearanceSection settings={s} />
              </div>
              <div className={ui.layout.column}>
                <TelegramSection settings={s} />
                <RemindersSection settings={s} />
              </div>
            </div>
            <PaymentMethodsSection />
          </>
        )}
      </PageState>
    </div>
  );
}
