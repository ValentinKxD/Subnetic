@echo off
chcp 65001 >nul
title Subnetic - Telegram bot
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python не знайдено. Встановіть Python 3.11+ з python.org і поставте галочку "Add to PATH".
  pause
  exit /b 1
)

if not exist venv\Scripts\python.exe (
  echo Створюю віртуальне середовище venv...
  python -m venv venv
  if errorlevel 1 goto :fail
)

echo Перевіряю залежності...
venv\Scripts\python -m pip install -q --disable-pip-version-check -r requirements.txt
if errorlevel 1 goto :fail

if not exist .env (
  copy /y .env.example .env >nul
  echo.
  echo Створено bot\.env. Впишіть у нього TELEGRAM_BOT_TOKEN від @BotFather, збережіть і запустіть цей файл знову.
  start "" notepad .env
  pause
  exit /b 1
)

if not exist ..\server\data\subnetic.db (
  echo.
  echo Базу даних не знайдено. Спершу в корені проєкту виконайте: npm run seed
  pause
  exit /b 1
)

echo Запускаю бота. Зупинка - Ctrl+C.
venv\Scripts\python main.py
pause
exit /b 0

:fail
echo.
echo Не вдалося підготувати середовище бота.
pause
exit /b 1
