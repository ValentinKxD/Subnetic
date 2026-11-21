import { NavLink } from 'react-router-dom';
import { ui } from '@/lib/ui';

const SECTIONS = [
  { to: '/admin', label: 'Огляд', end: true },
  { to: '/admin/users', label: 'Користувачі', end: false },
  { to: '/admin/catalog', label: 'Каталог', end: false },
  { to: '/admin/system', label: 'Курси і нагадування', end: false },
];

/** Перемикач розділів адмін-панелі під заголовком сторінки. */
export function AdminSections() {
  return (
    <nav aria-label="Розділи адмін-панелі" className={ui.admin.sections}>
      {SECTIONS.map((s) => (
        <NavLink key={s.to} to={s.to} end={s.end} className={({ isActive }) => (isActive ? ui.chip.on : ui.chip.off)}>
          {s.label}
        </NavLink>
      ))}
    </nav>
  );
}
