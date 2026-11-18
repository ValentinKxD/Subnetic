import { useCallback, useMemo, useState } from 'react';
import { profileSchema, type ProfileData } from '@shared/auth';
import { patchProfile } from '@/api/endpoints';
import { Alert, Button, Field, UserIcon } from '@/components/ui';
import { useAuth } from '@/hooks/AuthContext';
import { useZodForm } from '@/hooks/useZodForm';
import type { PublicUser } from '@shared/auth';
import { ui } from '@/lib/ui';
import { SettingsSection } from './SettingsSection';

function ProfileForm({ user }: { user: PublicUser }) {
  const { updateUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const initial = useMemo(() => ({ nickname: user.nickname, email: user.email, phone: user.phone ?? '' }), [user]);

  const onValid = useCallback(
    async (data: ProfileData) => {
      setSaved(false);
      const updated = await patchProfile(data);
      updateUser(updated);
      setSaved(true);
    },
    [updateUser],
  );

  const form = useZodForm(profileSchema, initial, onValid);

  return (
    <form noValidate onSubmit={form.handleSubmit} className={ui.field.form}>
      {form.formError && <Alert variant="error">{form.formError}</Alert>}
      {saved && <Alert variant="success">Профіль збережено</Alert>}
      <Field
        label="Нікнейм"
        name="nickname"
        autoComplete="username"
        hint="Без символу @"
        value={form.values.nickname}
        onValueChange={(v) => {
          setSaved(false);
          form.setField('nickname', v);
        }}
        onBlur={() => form.blurField('nickname')}
        error={form.errorFor('nickname')}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={form.values.email}
        onValueChange={(v) => {
          setSaved(false);
          form.setField('email', v);
        }}
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
        onValueChange={(v) => {
          setSaved(false);
          form.setField('phone', v);
        }}
        onBlur={() => form.blurField('phone')}
        error={form.errorFor('phone')}
      />
      <div>
        <Button type="submit" loading={form.submitting}>
          Зберегти зміни
        </Button>
      </div>
    </form>
  );
}

export function ProfileSection() {
  const { user } = useAuth();
  return (
    <SettingsSection icon={<UserIcon size={20} />} title="Профіль">
      {user && <ProfileForm user={user} />}
    </SettingsSection>
  );
}
