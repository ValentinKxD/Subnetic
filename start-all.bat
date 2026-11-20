@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist node_modules (
  echo Встановлюю залежності...
  call npm install || (pause & exit /b 1)
)

rem Сервер і клієнт — у двох окремих вікнах.
start "Subnetic - server" cmd /c "%~dp0start-server.bat"
start "Subnetic - client (Vite)" cmd /c "%~dp0start-client.bat"

rem Даємо Vite кілька секунд піднятися й відкриваємо браузер.
timeout /t 4 /nobreak >nul
start "" http://localhost:5173
