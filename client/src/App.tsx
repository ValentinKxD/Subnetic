import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { AuthLayout } from '@/components/AuthLayout';
import { AdminRoute, GuestRoute, ProtectedRoute } from '@/components/RouteGuards';
import { AuthProvider } from '@/hooks/AuthContext';
import { ThemeProvider } from '@/hooks/ThemeContext';
import { AdminCatalogPage } from '@/pages/admin/AdminCatalogPage';
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import { AdminSystemPage } from '@/pages/admin/AdminSystemPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SubscriptionsPage } from '@/pages/SubscriptionsPage';

const router = createBrowserRouter([
  {
    // Гостьові екрани: авторизованого користувача відправляє в застосунок.
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    // Відновлення пароля доступне незалежно від сесії.
    element: <AuthLayout />,
    children: [{ path: '/forgot-password', element: <ForgotPasswordPage /> }],
  },
  {
    // Захищена частина: без сесії — редирект на /login?next=…
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'subscriptions', element: <SubscriptionsPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'settings', element: <SettingsPage /> },
          {
            // Адмін-панель — звичайні сторінки в тому самому каркасі (хедер, тема, профіль).
            path: 'admin',
            element: <AdminRoute />,
            children: [
              { index: true, element: <AdminOverviewPage /> },
              { path: 'users', element: <AdminUsersPage /> },
              { path: 'catalog', element: <AdminCatalogPage /> },
              { path: 'system', element: <AdminSystemPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
