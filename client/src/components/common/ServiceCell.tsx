import { ServiceIcon } from '@/components/ui';
import { ui } from '@/lib/ui';

export interface ServiceCellProps {
  name: string;
  icon: string;
  brandColor: string;
  /** Другий рядок: категорія, тариф тощо. */
  meta?: string;
  size?: 'sm' | 'md' | 'lg';
}

/** Іконка сервісу + назва + підпис. Використовується в таблицях і списках. */
export function ServiceCell({ name, icon, brandColor, meta, size = 'md' }: ServiceCellProps) {
  return (
    <div className={ui.list.cell}>
      <ServiceIcon name={name} icon={icon} brandColor={brandColor} size={size} />
      <div className={ui.list.main}>
        <span className={ui.list.title}>{name}</span>
        {meta && <span className={ui.list.meta}>{meta}</span>}
      </div>
    </div>
  );
}
