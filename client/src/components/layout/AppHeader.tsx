import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo, LogoutIcon, Spinner } from '@/components/ui';
import { useAuth } from '@/hooks/AuthContext';
import { useSettings } from '@/hooks/SettingsContext';
import { ui } from '@/lib/ui';
import { MainNav } from './MainNav';
import { ProfileChip } from './ProfileChip';

/** Хедер застосунку: логотип, навігація-«пілюля», тема, профіль, вихід. */
export function AppHeader() {
  const { user, logout } = useAuth();
  const { setTheme } = useSettings();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    setLeaving(true);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className={ui.appHeader.bar}>
      <div className={ui.appHeader.inner}>
        <div className={ui.appHeader.brand}>
          <Link to="/" aria-label="Subnetic — на дашборд" className={ui.logo.link}>
            <Logo />
          </Link>
        </div>
        <MainNav />
        <div className={ui.appHeader.actions}>
          <ThemeToggle onChange={setTheme} />
          {user && <ProfileChip nickname={user.nickname} />}
          <button
            type="button"
            onClick={handleLogout}
            disabled={leaving}
            aria-label="Вийти"
            title="Вийти"
            className={ui.btn.icon}
          >
            {leaving ? <Spinner size="sm" /> : <LogoutIcon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
