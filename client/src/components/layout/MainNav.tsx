import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarIcon, DashboardIcon, RepeatIcon, SlidersIcon } from '@/components/ui';
import { ui } from '@/lib/ui';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Дашборд', icon: DashboardIcon },
  { to: '/subscriptions', label: 'Підписки', icon: RepeatIcon },
  { to: '/calendar', label: 'Календар і платежі', icon: CalendarIcon },
  { to: '/settings', label: 'Налаштування', icon: SlidersIcon },
];

/** Навігація-«пілюля». На вузьких екранах — лише іконки (підпис лишається для скрінрідера). */
export function MainNav() {
  return (
    <nav aria-label="Головне меню" className={ui.appHeader.navWrap}>
      <div className={ui.nav.pill}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) => (isActive ? ui.nav.linkActive : ui.nav.link)}
          >
            <Icon />
            <span className={ui.nav.label}>{label}</span>
            <span className={ui.nav.labelSr}>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
