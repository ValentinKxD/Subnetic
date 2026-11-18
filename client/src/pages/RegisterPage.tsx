import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PASSWORD_MIN, registerSchema, type RegisterData } from '@shared/auth';
import { AuthCard } from '@/components/AuthLayout';
import { Alert, Button, Field } from '@/components/ui';
import { useAuth } from '@/hooks/AuthContext';
import { useZodForm } from '@/hooks/useZodForm';
import { ui } from '@/lib/ui';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const onValid = useCallback(
    async (data: RegisterData) => {
      await register(data);
      navigate('/', { replace: true });
    },
    [register, navigate],
  );

  const form = useZodForm(
    registerSchema,
    { nickname: '', email: '', phone: '', password: '', confirmPassword: '' },
    onValid,
  );

  return (
    <AuthCard
      title="Реєстрація"
      subtitle="Створіть акаунт за хвилину"
      footer={
        <>
          Вже є акаунт?{' '}
          <Link to="/login" className={ui.link.default}>
            Увійти
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit} className={ui.field.form}>
        {form.formError && <Alert variant="error">{form.formError}</Alert>}
        <Field
          label="Нікнейм"
          name="nickname"
          autoComplete="username"
          placeholder="Ваш нікнейм"
          hint="Без символу @"
          value={form.values.nickname}
          onValueChange={(v) => form.setField('nickname', v)}
          onBlur={() => form.blurField('nickname')}
          error={form.errorFor('nickname')}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={form.values.email}
          onValueChange={(v) => form.setField('email', v)}
          onBlur={() => form.blurField('email')}
          error={form.errorFor('email')}
        />
        <Field
          label="Номер телефону"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+380 …"
          hint="Необов’язково"
          value={form.values.phone ?? ''}
          onValueChange={(v) => form.setField('phone', v)}
          onBlur={() => form.blurField('phone')}
          error={form.errorFor('phone')}
        />
        <Field
          label="Пароль"
          name="password"
          type="password"
          autoComplete="new-password"
          hint={`Мінімум ${PASSWORD_MIN} символів`}
          value={form.values.password}
          onValueChange={(v) => form.setField('password', v)}
          onBlur={() => form.blurField('password')}
          error={form.errorFor('password')}
        />
        <Field
          label="Повторіть пароль"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.values.confirmPassword}
          onValueChange={(v) => form.setField('confirmPassword', v)}
          onBlur={() => form.blurField('confirmPassword')}
          error={form.errorFor('confirmPassword')}
        />
        <Button type="submit" loading={form.submitting} block>
          Створити акаунт
        </Button>
      </form>
    </AuthCard>
  );
}
