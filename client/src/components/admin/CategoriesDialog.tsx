import { useEffect, useState } from 'react';
import { adminCategorySchema } from '@shared/admin';
import { fieldErrors } from '@shared/auth';
import { ApiError } from '@/api/client';
import * as api from '@/api/endpoints';
import { Alert, Button, ConfirmDialog, EditIcon, Field, Modal, TrashIcon } from '@/components/ui';
import type { AdminCategory } from '@/lib/types';
import { ui } from '@/lib/ui';

export interface CategoriesDialogProps {
  open: boolean;
  categories: AdminCategory[];
  onClose: () => void;
  /** Список змінився — перезавантажити категорії й сервіси. */
  onChanged: () => void;
}

const EMPTY = { name: '', slug: '' };

/** Категорії каталогу: список, додавання, перейменування, видалення порожніх. */
export function CategoriesDialog({ open, categories, onClose, onChanged }: CategoriesDialogProps) {
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);

  useEffect(() => {
    if (!open) return;
    setEditing(null);
    setValues(EMPTY);
    setErrors({});
    setMessage(null);
  }, [open]);

  function startEdit(c: AdminCategory) {
    setEditing(c);
    setValues({ name: c.name, slug: c.slug });
    setErrors({});
    setMessage(null);
  }

  async function save() {
    const parsed = adminCategorySchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setBusy(true);
    setErrors({});
    setMessage(null);
    try {
      if (editing) await api.admin.updateCategory(editing.id, parsed.data);
      else await api.admin.createCategory(parsed.data);
      setMessage({ ok: true, text: editing ? 'Категорію змінено' : 'Категорію додано' });
      setEditing(null);
      setValues(EMPTY);
      onChanged();
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Не вдалося зберегти категорію' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Категорії каталогу" size="lg">
      <div className={ui.layout.cardStack}>
        {message && <Alert variant={message.ok ? 'success' : 'error'}>{message.text}</Alert>}
        <ul className={ui.list.plain}>
          {categories.map((c) => (
            <li key={c.id} className={ui.admin.categoryRow}>
              <div className={ui.list.main}>
                <span className={ui.list.title}>{c.name}</span>
                <span className={ui.list.meta}>
                  {c.slug} · сервісів у каталозі {c.services}
                  {c.all_services > c.services && ` · власних ${c.all_services - c.services}`}
                </span>
              </div>
              <button type="button" aria-label={`Змінити категорію ${c.name}`} className={ui.iconBtn.neutral} onClick={() => startEdit(c)}>
                <EditIcon />
              </button>
              <button
                type="button"
                aria-label={`Видалити категорію ${c.name}`}
                title={c.all_services > 0 ? 'У категорії є сервіси' : 'Видалити'}
                className={ui.iconBtn.danger}
                onClick={() => setToDelete(c)}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>

        <div className={ui.section.divider}>
          <h3 className={ui.section.subheading}>{editing ? `Змінити «${editing.name}»` : 'Нова категорія'}</h3>
          <div className={ui.admin.formGrid}>
            <Field label="Назва" value={values.name} onValueChange={(v) => setValues((s) => ({ ...s, name: v }))} error={errors.name} placeholder="Подкасти" />
            <Field
              label="Slug"
              value={values.slug}
              onValueChange={(v) => setValues((s) => ({ ...s, slug: v }))}
              error={errors.slug}
              hint="Латиницею, напр. podcasts"
            />
          </div>
        </div>
        <div className={ui.admin.footer}>
          {editing && (
            <Button variant="secondary" onClick={() => { setEditing(null); setValues(EMPTY); setErrors({}); }}>
              Скасувати зміну
            </Button>
          )}
          <Button onClick={save} loading={busy}>
            {editing ? 'Зберегти' : 'Додати категорію'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Видалити категорію?"
        confirmLabel="Видалити"
        onConfirm={async () => {
          if (!toDelete) return;
          await api.admin.deleteCategory(toDelete.id);
          onChanged();
        }}
        onClose={() => setToDelete(null)}
      >
        <p>Категорію «{toDelete?.name}» буде видалено. Видалити можна лише категорію без сервісів.</p>
      </ConfirmDialog>
    </Modal>
  );
}
