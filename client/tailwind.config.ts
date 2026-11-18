import type { Config } from 'tailwindcss';

// Кольори беруться з CSS-змінних (src/index.css), тому перемикання
// світлої/темної теми — це лише клас `dark` на <html>.
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        header: token('header'),
        card: token('card'),
        border: token('border'),
        text: token('text'),
        muted: token('muted'),
        accent: token('accent'),
        'accent-soft': token('accent-soft'),
        'accent-text': token('accent-text'),
        // Елементи форм і стани (з макету)
        'input-bg': token('input-bg'),
        'input-border': token('input-border'),
        'control-border': token('control-border'),
        link: token('link'),
        focus: token('focus'),
        hover: token('hover'),
        danger: token('danger'),
        'danger-bg': token('danger-bg'),
        'info-bg': token('info-bg'),
        'info-text': token('info-text'),
        'success-bg': token('success-bg'),
        'success-text': token('success-text'),
        'warning-bg': token('warning-bg'),
        'warning-text': token('warning-text'),
        'danger-solid': token('danger-solid'),
        // Заливка акцентних кнопок (у темній темі темніша за accent, щоб білий текст проходив AA).
        primary: { DEFAULT: token('primary'), hover: token('primary-hover') },
        'on-primary': token('on-primary'),
        ink: token('ink'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
