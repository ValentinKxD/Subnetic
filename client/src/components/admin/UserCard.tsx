import { useState } from 'react';
import * as api from '@/api/endpoints';
import { Alert, Button, Card, ConfirmDialog, Field, Select } from '@/components/ui';
import { formatDate, initials } from '@/lib/format';
import type { AdminUser } from '@/lib/types';
import { ui } from '@/lib/ui';

type Pending = { kind: 'role'; role: AdminUser['role'] } | { kind: 'block' } | { kind: 'unlink' } | { kind: 'delete' } | null;

export interface UserCardProps {
  user: AdminUser;
  /** Це обліковий запис поточного адміністратора. */
  isSelf: boolean;
  onChanged: (user: AdminUser) => void;
  onDeleted: () => void;
}

const ROLE_OPTIONS = [
  { value: 'user', label: 'Користувач' },
  { value: 'admin', label: 'Адміністратор' },
];

/** Картка обраного користувача: дані без сум і паролів + дії адміністратора. */
export function UserCard({ user, isSelf, onChanged, onDeleted }: UserCardProps) {
  const [pending, setPending] = useState<Pending>(null);
  const blocked = user.blocked_at !== null;

  async function confirm() {
    if (!pending) return;
    if (pending.kind === 'delete') {
      await api.admin.deleteUser(user.id);
      onDeleted();
      return;
    }
    const updated =
      pending.kind === 'role'
        ? await api.admin.updateUser(user.id, { role: pending.role })
        : pending.kind === 'block'
          ? await api.admin.updateUser(user.id, { blocked: !blocked })
          : await api.admin.unlinkUserTelegram(user.id);
    onChanged(updated);
  }

  const dialog = (() => {
    switch (pending?.kind) {
      case 'role':
        return {
          title: pending.role === 'admin' ? 'Надати роль адміністратора?' : 'Зняти роль адміністратора?',
          text:
            pending.role === 'admin'
              ? `${user.nickname} отримає доступ до адмін-панелі: користувачі, каталог, курси.`
              : `${user.nickname} втратить доступ до адмін-панелі одразу, навіть у відкритій вкладці.`,
          label: pending.role === 'admin' ? 'Надати роль' : 'Зняти роль',
          tone: 'primary' as const,
        };
      case 'block':
        return blocked
          ? { title: 'Розблокувати користувача?', text: `${user.nickname} знову зможе увійти.`, label: 'Розблокувати', tone: 'primary' as const }
          : {
              title: 'Заблокувати користувача?',
              text: `${user.nickname} не зможе увійти, поточна сесія завершиться при наступному запиті, а бот перестане надсилати нагадування.`,
              label: 'Заблокувати',
              tone: 'danger' as const,
            };
      case 'unlink':
        return {
          title: 'Відв’язати Telegram?',
          text: `Бот перестане надсилати ${user.nickname} нагадування. Прив’язати знову можна в Налаштуваннях.`,
          label: 'Відв’язати',
          tone: 'danger' as const,
        };
      case 'delete':
        return {
          title: 'Видалити користувача?',
          text: `Обліковий запис ${user.nickname}, його підписки, платежі, власні сервіси й способи оплати буде видалено назавжди. Цю дію не можна скасувати.`,
          label: 'Видалити назавжди',
          tone: 'danger' as const,
        };
      default:
        return null;
    }
  })();

  return (
    <Card as="aside" aria-label="Картка користувача" className={ui.admin.aside}>
      <div className={ui.admin.asideHead}>
        <span className={ui.admin.avatarLg} aria-hidden="true">
          {initials(user.nickname)}
        </span>
        <div className={ui.list.main}>
          <span className={ui.list.title}>{user.nickname}</span>
          <span className={ui.list.meta}>{user.email}</span>
        </div>
      </div>

      <dl className={ui.admin.dl}>
        <div>
          <dt className={ui.admin.dt}>Реєстрація</dt>
          <dd className={ui.admin.dd}>{formatDate(user.created_at)}</dd>
        </div>
        <div>
          <dt className={ui.admin.dt}>Telegram</dt>
          <dd className={ui.admin.dd}>
            {user.telegram_linked ? (user.telegram_username ? `@${user.telegram_username}` : 'прив’язано') : '—'}
          </dd>
        </div>
        <div>
          <dt className={ui.admin.dt}>Підписок</dt>
          <dd className={ui.admin.dd}>
            {user.subscriptions} · {user.active_subscriptions} активних
          </dd>
        </div>
        <div>
          <dt className={ui.admin.dt}>Власних сервісів</dt>
          <dd className={ui.admin.dd}>{user.custom_services}</dd>
        </div>
      </dl>

      <p className={ui.admin.note}>Суми, способи оплати й пароль користувача адміністратору не показуються.</p>

      {isSelf && <Alert variant="info">Це ваш обліковий запис: роль, блокування й видалення змінює інший адміністратор.</Alert>}
      {blocked && <Alert variant="error">Заблоковано {formatDate(user.blocked_at)}</Alert>}

      <Field label="Роль" hint={isSelf ? 'Власну роль змінити не можна' : undefined}>
        {(control) => (
          <Select
            {...control}
            value={user.role}
            disabled={isSelf}
            options={ROLE_OPTIONS}
            onValueChange={(v) => setPending({ kind: 'role', role: v as AdminUser['role'] })}
          />
        )}
      </Field>

      <div className={ui.admin.actions}>
        <Button variant="secondary" disabled={!user.telegram_linked} onClick={() => setPending({ kind: 'unlink' })}>
          Відв’язати Telegram
        </Button>
        <Button variant="secondary" disabled={isSelf} onClick={() => setPending({ kind: 'block' })}>
          {blocked ? 'Розблокувати' : 'Заблокувати'}
        </Button>
      </div>
      <div className={ui.admin.dangerZone}>
        <button type="button" className={ui.btnInline.danger} disabled={isSelf} onClick={() => setPending({ kind: 'delete' })}>
          Видалити
        </button>
      </div>

      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        confirmLabel={dialog?.label}
        tone={dialog?.tone}
        onConfirm={confirm}
        onClose={() => setPending(null)}
      >
        <p>{dialog?.text}</p>
      </ConfirmDialog>
    </Card>
  );
}
