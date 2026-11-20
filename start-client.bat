@echo off
chcp 65001 >nul
title Subnetic - client (Vite)
cd /d "%~dp0"

if not exist node_modules (
  echo Встановлюю залежності...
  call npm install || (pause & exit /b 1)
)

echo Запускаю Vite на http://localhost:5173 ...
call npm run dev -w client
pause
