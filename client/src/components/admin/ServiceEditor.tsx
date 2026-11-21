import { useState } from 'react';
import { adminServiceSchema } from '@shared/admin';
import { fieldErrors } from '@shared/auth';
import { ApiError } from '@/api/client';
import * as api from '@/api/endpoints';
import { Alert, Badge, Button, Card, ConfirmDialog, EditIcon, Field, PlusIcon, Select, ServiceIcon, TrashIcon } from '@/components/ui';
import { billingPeriodLabels, formatMoney } from '@/lib/format';
import type { AdminCategory, AdminPlan, AdminService } from '@/lib/types';
import { ui } from '@/lib/ui';
import { PlanDialog } from './PlanDialog';

export interface ServiceEditorProps {
  /** null — новий сервіс. */
  service: AdminService | null;
  categories: AdminCategory[];
  onSaved: (service: AdminService) => void;
  onDeleted: () => void;
  onClose: () => void;
}

interface Values {
  name: string;
  category_id: string;
  brand_color: string;
  website: string;
  icon: string;
}

function toValues(s: AdminService | null, categories: AdminCategory[]): Values {
  return {
    name: s?.name ?? '',
    category_id: String(s?.category_id ?? categories[0]?.id ?? ''),
    brand_color: s?.brand_color ?? '#64748B',
    website: s?.website ?? '',
    icon: s?.icon ?? '',
  };
}

/** Бічна картка: поля сервісу, його тарифи, видалення. */
export function ServiceEditor({ service, categories, onSaved, onDeleted, onClose }: ServiceEditorProps) {
  const [values, setValues] = useState<Values>(() => toValues(service, categories));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [planDialog, setPlanDialog] = useState<{ plan: AdminPlan | null } | null>(null);
  const [planToDelete, setPlanToDelete] = useState<AdminPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const set = <K extends keyof Values>(k: K, v: Values[K]) => setValues((s) => ({ ...s, [k]: v }));
  const validColor = /^#[0-9A-Fa-f]{6}$/.test(values.brand_color) ? values.brand_color : '#64748B';

  async function save() {
    const parsed = adminServiceSchema.safeParse({ ...values, category_id: Number(values.category_id) });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setBusy(true);
    setErrors({});
    setMessage(null);
    try {
      const saved = service ? await api.admin.updateService(service.id, parsed.data) : await api.admin.createService(parsed.data);
      onSaved(saved);
      setMessage({ ok: true, text: service ? 'Зміни збережено' : 'Сервіс додано — тепер додайте тарифи' });
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Не вдалося зберегти сервіс' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card as="aside" aria-label={service ? 'Редагування сервісу' : 'Новий сервіс'} className={ui.admin.aside}>
      <div className={ui.admin.asideTitle}>
        <h2 className={ui.layout.cardTitle}>{service ? 'Редагування сервісу' : 'Новий сервіс'}</h2>
        {service && <Badge variant="accent">{service.subscriptions} підписок</Badge>}
      </div>

      {message && <Alert variant={message.ok ? 'success' : 'error'}>{message.text}</Alert>}

      <div className={ui.admin.nameRow}>
        <ServiceIcon name={values.name || '?'} icon={values.icon} brandColor={validColor} size="md" />
        <Field label="Назва" value={values.name} onValueChange={(v) => set('name', v)} error={errors.name} />
      </div>
      <div className={ui.admin.formGrid}>
        <Field label="Категорія" error={errors.category_id}>
          {(control) => (
            <Select
              {...control}
              value={values.category_id}
              onValueChange={(v) => set('category_id', v)}
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            />
          )}
        </Field>
        <Field
          label="Колір бренду"
          value={values.brand_color}
          onValueChange={(v) => set('brand_color', v)}
          error={errors.brand_color}
          placeholder="#1DB954"
        />
      </div>
      <Field
        label="Сайт"
        type="url"
        value={values.website}
        onValueChange={(v) => set('website', v)}
        error={errors.website}
        placeholder="https://www.spotify.com"
      />
      <Field
        label="Іконка"
        value={values.icon}
        onValueChange={(v) => set('icon', v)}
        error={errors.icon}
        hint="Файл із client/public/icons, напр. /icons/spotify.svg. Порожньо — літера на кольорі бренду."
      />

      {service && (
        <div className={ui.admin.plans}>
          <div className={ui.admin.plansHead}>
            <h3 className={ui.admin.plansTitle}>Тарифи</h3>
            <button type="button" className={ui.btnInline.accent} onClick={() => setPlanDialog({ plan: null })}>
              <PlusIcon />
              Тариф
            </button>
          </div>
          {service.plans.length === 0 ? (
            <p className={ui.hint}>Тарифів ще немає — без них сервіс не можна обрати в підписці.</p>
          ) : (
            service.plans.map((p) => (
              <div key={p.id} className={ui.admin.planRow}>
                <span className={ui.admin.planName}>
                  {p.name} <span className={ui.admin.planPeriod}>· {billingPeriodLabels[p.billing_period]}</span>
                </span>
                <span className={ui.admin.planPrice}>{formatMoney(p.price, p.currency)}</span>
                <span className={ui.admin.planSubs}>{p.subscriptions} підп.</span>
                <button
                  type="button"
                  aria-label={`Редагувати тариф ${p.name}`}
                  className={ui.iconBtn.neutral}
                  onClick={() => setPlanDialog({ plan: p })}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  aria-label={`Видалити тариф ${p.name}`}
                  title={p.subscriptions > 0 ? 'Спершу перенесіть підписки на інший тариф' : 'Видалити тариф'}
                  className={ui.iconBtn.danger}
                  onClick={() => setPlanToDelete(p)}
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <p className={ui.admin.note}>Тариф або сервіс, на які є підписки, видалити не можна — спершу перенесіть підписки.</p>

      <div className={ui.admin.footer}>
        {service && (
          <button type="button" className={ui.btnInline.danger} onClick={() => setDeleting(true)}>
            Видалити
          </button>
        )}
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          {service ? 'Закрити' : 'Скасувати'}
        </Button>
        <Button onClick={save} loading={busy}>
          Зберегти
        </Button>
      </div>

      {service && (
        <>
          <PlanDialog
            open={planDialog !== null}
            service={service}
            plan={planDialog?.plan ?? null}
            onClose={() => setPlanDialog(null)}
            onSaved={onSaved}
          />
          <ConfirmDialog
            open={planToDelete !== null}
            title="Видалити тариф?"
            confirmLabel="Видалити"
            onConfirm={async () => {
              if (planToDelete) onSaved(await api.admin.deletePlan(planToDelete.id));
            }}
            onClose={() => setPlanToDelete(null)}
          >
            <p>
              Тариф «{planToDelete?.name}» сервісу {service.name} буде видалено з каталогу.
            </p>
          </ConfirmDialog>
          <ConfirmDialog
            open={deleting}
            title="Видалити сервіс?"
            confirmLabel="Видалити"
            onConfirm={async () => {
              await api.admin.deleteService(service.id);
              onDeleted();
            }}
            onClose={() => setDeleting(false)}
          >
            <p>
              Сервіс {service.name} і всі його тарифи ({service.plans.length}) буде видалено з каталогу. Цю дію не можна скасувати.
            </p>
          </ConfirmDialog>
        </>
      )}
    </Card>
  );
}
