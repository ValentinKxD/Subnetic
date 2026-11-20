#!/usr/bin/env bash
# Запуск Telegram-бота Subnetic (macOS / Linux): ./start-bot.sh
set -euo pipefail
cd "$(dirname "$0")"

PY=$(command -v python3 || command -v python || true)
if [ -z "$PY" ]; then
  echo "Python не знайдено. Встановіть Python 3.11+." >&2
  exit 1
fi

if [ ! -x venv/bin/python ]; then
  echo "Створюю віртуальне середовище venv..."
  "$PY" -m venv venv
fi

echo "Перевіряю залежності..."
venv/bin/python -m pip install -q --disable-pip-version-check -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Створено bot/.env. Впишіть у нього TELEGRAM_BOT_TOKEN від @BotFather і запустіть знову."
  exit 1
fi

if [ ! -f ../server/data/subnetic.db ]; then
  echo "Базу даних не знайдено. Спершу в корені проєкту виконайте: npm run seed"
  exit 1
fi

echo "Запускаю бота. Зупинка — Ctrl+C."
exec venv/bin/python main.py
