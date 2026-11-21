<div align="center">

# Subnetic

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/vite-%23B73BFE.svg?style=for-the-badge&logo=vite&logoColor=FFD62E) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)  ![Zod](https://img.shields.io/badge/zod-%233068b7.svg?style=for-the-badge&logo=zod&logoColor=white)  ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)  ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) ![aiogram](https://img.shields.io/badge/aiogram-%232CA5E0.svg?style=for-the-badge&logo=telegram&logoColor=white) ![APScheduler](https://img.shields.io/badge/apscheduler-%234B8BBE.svg?style=for-the-badge&logo=python&logoColor=white)

</div>

## Про проєкт

Subnetic: вебзастосунок для обліку особистих підписок. Він показує, за що ви платите, коли наступне списання і скільки виходить на місяць, а також нагадує про платежі в Telegram.

| Частина | Технології | Призначення |
| --- | --- | --- |
| `client/` | React 19, TypeScript, Vite, Tailwind CSS | Вебінтерфейс, світла й темна теми |
| `server/` | Node.js, Express 5, better-sqlite3 | REST API, бізнес-логіка, курси НБУ |
| `bot/` | Python, aiogram 3, APScheduler | Telegram-бот: прив'язка акаунта й нагадування |

## Можливості

- **Автентифікація**: реєстрація та вхід за email або нікнеймом, JWT у httpOnly-куці, «Запам'ятати мене» на 30 днів, валідація спільними zod-схемами.
- **Дашборд**: кількість підписок, витрати за місяць і прогноз на рік, найближчий платіж, графік витрат за 12 місяців.
- **Підписки**: каталог із 25 сервісів і 53 тарифів (зокрема студентських), власні сервіси, пошук, фільтри, статуси, пауза й скасування.
- **Календар і платежі**: майбутні платежі обчислюються з дати й періоду, «Позначити оплаченим» зсуває дату тригером, історія з фільтрами.
- **Налаштування**: профіль, валюта (UAH / USD / EUR), тема, способи оплати, нагадування за 7 / 3 / 1 день.
- **Курси НБУ**: оновлюються при старті й щодня о 00:05, а якщо НБУ недоступний, використовується останній збережений курс.
- **Telegram-бот**: `/start <токен>` (прив'язка), `/account` (акаунт і підписки), `/help`; щогодинні нагадування без дублів.

## Структура

```
Subnetic/
├── client/     # React + Vite (сторінки, компоненти, хуки, API-клієнт, іконки сервісів)
├── server/     # Express API: db/ (schema.sql, seed.sql), src/ (routes, services, db, auth)
├── shared/     # Спільні zod-схеми, валюти й дати для клієнта і сервера
├── bot/        # Telegram-бот на Python (main, handlers, reminders, db)
├── docs/       # ER-діаграма
└── start-*.bat # Запуск на Windows
```

## Як запустити

Потрібні Node.js 22+ і npm. Python 3.11+ знадобиться лише для бота.

```bash
git clone https://github.com/ValentinKxD/Subnetic.git
cd Subnetic
npm install
npm run seed     # створює базу з каталогом
npm run dev      # сервер :3001, сайт http://localhost:5173
```

На Windows можна просто запустити `start-all.bat`.

Через Docker: `docker compose up -d --build`. Сайт і бот запускаються в контейнерах, сайт буде на http://localhost:3001.

**Telegram-бот (необов'язково):**

1. Створіть бота в [@BotFather](https://t.me/BotFather) і впишіть токен у `server/.env` і `bot/.env`.
2. Запустіть `bot/start-bot.bat`.
3. На сайті натисніть **Налаштування → Telegram → Привʼязати**.

## Налаштування

| Файл | Змінна | Опис |
| --- | --- | --- |
| `server/.env` | `JWT_SECRET` | Ключ підпису сесій |
| `server/.env` | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_NAME` | Токен та ім'я бота (без `@`) |
| `server/.env` | `PORT`, `SUBNETIC_DB` | Порт (`3001`) і шлях до бази |
| `bot/.env` | `TELEGRAM_BOT_TOKEN` | Той самий токен бота |
| `bot/.env` | `DB_PATH`, `TZ` | Шлях до бази й часовий пояс (`Europe/Kyiv`) |

Файли `.env` не потрапляють у git. Після змін у них перезапустіть сервер.

## База даних

SQLite-файл `server/data/subnetic.db` у режимі WAL. Сервер і бот працюють з ним спільно. Команда `npm run seed` перестворює базу і **видаляє всіх користувачів**.

[![ER-діаграма](docs/er-diagram.png)](docs/er-diagram.svg)

Таблиці: `users`, `user_settings`, `telegram_link_tokens`, `categories`, `services`, `plans`, `payment_methods`, `subscriptions`, `payments`, `reminders`, `exchange_rates`. Крім них, у базі є подання (`v_current_rates`, `v_subscription_monthly_cost` тощо) і тригери: зсув дати платежу після оплати, `cancelled_at` при скасуванні.

## npm-скрипти

| Команда | Що робить |
| --- | --- |
| `npm run dev` | Сервер і сайт у режимі розробки |
| `npm run seed` | Перестворити базу |
| `npm run build` | Зібрати проєкт |
| `npm run bot` | Запустити Telegram-бота |
