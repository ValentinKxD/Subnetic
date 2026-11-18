import type { ReactNode } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Card, Logo } from '@/components/ui';
import { ui } from '@/lib/ui';
import { ThemeToggle } from './ThemeToggle';

/** Обгортка екранів автентифікації: хедер, центрована картка, футер. */
export function AuthLayout() {
  return (
    <div className={ui.page.shell}>
      <header className={ui.page.header}>
        <div className={ui.page.headerInner}>
          <Link to="/" aria-label="Subnetic — на головну" className={ui.logo.link}>
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className={ui.page.centered}>
        <Outlet />
      </main>
      <footer className={ui.page.footer}>Курсовий проєкт · Subnetic — сервіс управління підписками</footer>
    </div>
  );
}

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <Card as="section" variant="auth" aria-labelledby="auth-title">
      <div className={ui.page.heading}>
        <h1 id="auth-title" className={ui.page.title}>
          {title}
        </h1>
        <p className={ui.page.subtitle}>{subtitle}</p>
      </div>
      {children}
      {footer && <div className={ui.page.authFooter}>{footer}</div>}
    </Card>
  );
}
