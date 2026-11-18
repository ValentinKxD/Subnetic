import { Outlet } from 'react-router-dom';
import { SettingsProvider } from '@/hooks/SettingsContext';
import { ui } from '@/lib/ui';
import { AppHeader } from './layout/AppHeader';

/** Каркас захищеної частини: налаштування користувача + хедер + сторінка. */
export function AppLayout() {
  return (
    <SettingsProvider>
      <div className={ui.page.shell}>
        <AppHeader />
        <main className={ui.page.container}>
          <Outlet />
        </main>
      </div>
    </SettingsProvider>
  );
}
