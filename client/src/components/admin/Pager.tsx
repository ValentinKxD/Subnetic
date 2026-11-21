import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui';
import { ui } from '@/lib/ui';

export interface PagerProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

/** Підвал таблиці: «Показано 1–20 з 128» і кнопки ‹ ›. */
export function Pager({ page, pageSize, total, onPage }: PagerProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const last = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className={ui.table.footer}>
      <span>
        Показано {from}–{to} з {total}
      </span>
      <div className={ui.admin.pager}>
        <button
          type="button"
          aria-label="Попередня сторінка"
          className={ui.iconBtn.bordered}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          aria-label="Наступна сторінка"
          className={ui.iconBtn.bordered}
          disabled={page >= last}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
