@echo off
title MulBros Dev Server
color 0A

:start
echo.
echo ============================================
echo   MULBROS MEDIA OS - Local Dev Server
echo ============================================
echo.
echo [MulBros] Clearing port 5173...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING" 2^>nul') do (
    echo [MulBros] Killing PID %%a on port 5173
    taskkill /f /pid %%a >nul 2>&1
)

echo [MulBros] Port cleared. Starting development server...
echo [MulBros] App will be available at: http://localhost:5173
echo [MulBros] Press Ctrl+C to stop.
echo.

cd /d "%~dp0"
npm run dev

echo.
echo [MulBros] Server stopped unexpectedly.
echo [MulBros] Restarting in 3 seconds... (Ctrl+C to quit)
echo.
timeout /t 3 /nobreak >nul
goto start
