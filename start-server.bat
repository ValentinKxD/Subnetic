@echo off
chcp 65001 >nul
title Subnetic - server
cd /d "%~dp0"

if not exist node_modules (
  echo Встановлюю залежності...
  call npm install || (pause & exit /b 1)
)

echo Запускаю сервер API на http://localhost:3001 ...
call npm run dev -w server
pause
