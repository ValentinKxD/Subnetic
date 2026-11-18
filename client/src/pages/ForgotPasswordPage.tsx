import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '@shared/auth';
import { AuthCard } from '@/components/AuthLayout';
import { Alert, Button, Field } from '@/components/ui';
import { useZodForm } from '@/hooks/useZodForm';
import { ui } from '@/lib/ui';

/** Заглушка: лише валідує email і показує повідомлення, нічого не надсилає. */
export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onValid = useCallback(async (data: { email: string }) => {
    setSentTo(data.email);
  }, []);

  const form = useZodForm(forgotPasswordSchema, { email: '' }, onValid);

  return (
    <AuthCard
      title="Забули пароль?"
      subtitle="Вкажіть email, і ми надішлемо інструкції"
      footer={
        <Link to="/login" className={ui.link.default}>
          ← Повернутися до входу
        </Link>
      }
    >
      <form noValidate onSubmit={form.handleSubmit} className={ui.field.form}>
        {sentTo ? (
          <Alert variant="success">
            Запит для <strong className="font-semibold">{sentTo}</strong> прийнято. Це демо-версія: лист насправді
            не надсилається.
          </Alert>
        ) : (
          <Alert variant="info">Відновлення пароля поки недоступне — ця функція в розробці.</Alert>
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={form.values.email}
          onValueChange={(v) => {
            form.setField('email', v);
            setSentTo(null);
          }}
          onBlur={() => form.blurField('email')}
          error={form.errorFor('email')}
        />
        <Button type="submit" loading={form.submitting} block>
          Надіслати інструкції
        </Button>
      </form>
    </AuthCard>
  );
}
