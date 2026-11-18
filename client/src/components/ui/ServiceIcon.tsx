import { useEffect, useRef, useState } from 'react';
import { ui } from '@/lib/ui';
import { cn } from '@/lib/cn';

export interface ServiceIconProps {
  name: string;
  /** Шлях з API (`/icons/netflix.svg`) або лише ім'я файлу (`netflix.svg`). */
  icon: string;
  /** Колір бренду з даних сервісу — фон плитки, коли файлу іконки немає. */
  brandColor: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const letterClass = { sm: ui.serviceIcon.letterSm, md: ui.serviceIcon.letterMd, lg: ui.serviceIcon.letterLg };

function iconSrc(icon: string): string {
  return icon.startsWith('/') ? icon : `/icons/${icon}`;
}

/** Відносна яскравість кольору (WCAG) для #RGB / #RRGGBB; null — якщо не розпізнано. */
function luminance(hex: string): number | null {
  const m = hex.trim().replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Білий текст, якщо контраст з фоном ≥ 3:1 (жирна велика літера), інакше темний. */
function useLightText(brandColor: string): boolean {
  const l = luminance(brandColor);
  return l === null ? true : 1.05 / (l + 0.05) >= 3;
}

/** Іконка сервісу: файл із /icons, а якщо його немає — плитка з першою літерою на кольорі бренду. */
export function ServiceIcon({ name, icon, brandColor, size = 'md', className }: ServiceIconProps) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const lightText = useLightText(brandColor);

  // Якщо картинка вже «зламалася» до підписки на onError (кеш браузера) — одразу показуємо плитку.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [icon]);

  return (
    <span className={cn(ui.serviceIcon[size], className)}>
      {!failed && icon ? (
        <img
          ref={imgRef}
          src={iconSrc(icon)}
          alt={name}
          className={ui.serviceIcon.img}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          role="img"
          aria-label={name}
          className={cn(ui.serviceIcon.tile, letterClass[size], lightText ? 'text-on-primary' : 'text-black/80')}
          // Колір бренду — дані сервісу, а не стиль теми, тому inline.
          style={{ backgroundColor: brandColor }}
        >
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
