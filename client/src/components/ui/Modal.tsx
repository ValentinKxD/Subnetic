import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { ui } from '@/lib/ui';
import { CloseIcon } from './icons';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Кнопки дій унизу. */
  footer?: ReactNode;
  /** lg — для форм у дві колонки. */
  size?: 'md' | 'lg';
}

/**
 * Модальне вікно на нативному <dialog>: фокус-пастка, Esc і затемнення — з коробки.
 * Закривається кнопкою ×, клавішею Esc або кліком по фону.
 */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={size === 'lg' ? ui.modal.dialogLg : ui.modal.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
    >
      {open && (
        <>
          <div className={ui.modal.header}>
            <h2 id={titleId} className={ui.modal.title}>
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Закрити" className={ui.modal.close}>
              <CloseIcon />
            </button>
          </div>
          <div className={ui.modal.body}>{children}</div>
          {footer && <div className={ui.modal.footer}>{footer}</div>}
        </>
      )}
    </dialog>
  );
}
