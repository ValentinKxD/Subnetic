import { EditIcon, Menu, MoreIcon, PauseIcon, PlayIcon, TrashIcon, XCircleIcon, type MenuItem } from '@/components/ui';
import type { Subscription, SubscriptionStatus } from '@/lib/types';

export interface SubscriptionActionHandlers {
  onEdit: (s: Subscription) => void;
  onStatus: (s: Subscription, status: SubscriptionStatus) => void;
  onDelete: (s: Subscription) => void;
}

/** Меню дій на рядку: редагування, зміна статусу (залежно від поточного), видалення. */
export function SubscriptionActions({ subscription: s, onEdit, onStatus, onDelete }: { subscription: Subscription } & SubscriptionActionHandlers) {
  const items: MenuItem[] = [{ label: 'Редагувати', icon: <EditIcon />, onSelect: () => onEdit(s) }];

  if (s.status === 'active' || s.status === 'trial') {
    items.push({ label: 'Призупинити', icon: <PauseIcon />, onSelect: () => onStatus(s, 'paused') });
    items.push({ label: 'Скасувати підписку', icon: <XCircleIcon />, onSelect: () => onStatus(s, 'cancelled') });
  } else if (s.status === 'paused') {
    items.push({ label: 'Відновити', icon: <PlayIcon />, onSelect: () => onStatus(s, 'active') });
    items.push({ label: 'Скасувати підписку', icon: <XCircleIcon />, onSelect: () => onStatus(s, 'cancelled') });
  } else {
    items.push({ label: 'Поновити підписку', icon: <PlayIcon />, onSelect: () => onStatus(s, 'active') });
  }

  items.push({ label: 'Видалити', icon: <TrashIcon />, tone: 'danger', onSelect: () => onDelete(s) });

  return <Menu label={`Дії: ${s.service.name}`} icon={<MoreIcon size={20} />} items={items} />;
}
