import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/AuthContext';
import { LOGIN_PATH } from '@/api/client';
import { Spinner } from '@/components/ui';
import { ui } from '@/lib/ui';

function FullScreenLoader() {
  return (
    <div className={ui.page.loader}>
      <Spinner size="lg" label="Завантаження" />
    </div>
  );
}

/** Лише для авторизованих: інакше — на /login з поверненням назад після входу. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'guest') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${LOGIN_PATH}?next=${next}`} replace />;
  }
  return <Outlet />;
}

/** Адмін-панель: лише role === 'admin', решту — на головну. Ставиться всередині ProtectedRoute. */
export function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Повертає безпечний внутрішній шлях з ?next= (захист від open redirect). */
export function useNextPath(): string {
  const [params] = useSearchParams();
  const next = params.get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

/** Лише для гостей (вхід, реєстрація): авторизованих відправляємо в застосунок. */
export function GuestRoute() {
  const { status } = useAuth();
  const next = useNextPath();

  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'authenticated') return <Navigate to={next} replace />;
  return <Outlet />;
}
