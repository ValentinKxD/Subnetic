import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginData } from '@shared/auth';
import { AuthCard } from '@/components/AuthLayout';
import { useNextPath } from '@/components/RouteGuards';
import { Alert, Button, Checkbox, Field } from '@/components/ui';
import { useAuth } from '@/hooks/AuthContext';
import { useZodForm } from '@/hooks/useZodForm';
import { ui } from '@/lib/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const next = useNextPath();

  const onValid = useCallback(
    async (data: LoginData) => {
      await login(data);
      navigate(next, { replace: true });
    },
    [login, navigate, next],
  );

  const form = useZodForm(loginSchema, { identifier: '', password: '', remember: false }, onValid);

  return (
    <AuthCard
      title="Вхід"
      subtitle="Увійдіть, щоб керувати підписками"
      footer={
        <>
          Немає акаунта?{' '}
          <Link to="/register" className={ui.link.default}>
            Зареєструватися
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit} className={ui.field.form}>
        {form.formError && <Alert variant="error">{form.formError}</Alert>}
        <Field
          label="Email або нікнейм"
          name="identifier"
          autoComplete="username"
          placeholder="name@example.com"
          value={form.values.identifier}
          onValueChange={(v) => form.setField('identifier', v)}
          onBlur={() => form.blurField('identifier')}
          error={form.errorFor('identifier')}
        />
        <Field
          label="Пароль"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.values.password}
          onValueChange={(v) => form.setField('password', v)}
          onBlur={() => form.blurField('password')}
          error={form.errorFor('password')}
        />
        <div className={ui.page.inlineRow}>
          <Checkbox
            name="remember"
            label="Запам’ятати мене"
            checked={form.values.remember ?? false}
            onCheckedChange={(v) => form.setField('remember', v)}
          />
          <Link to="/forgot-password" className={ui.link.small}>
            Забули пароль?
          </Link>
        </div>
        <Button type="submit" loading={form.submitting} block>
          Увійти
        </Button>
      </form>
    </AuthCard>
  );
}
