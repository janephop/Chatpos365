@echo off
echo ========================================
echo  LINE Webhook System - Servers Starter
echo ========================================
echo.
echo Opening 2 terminals:
echo   1. Backend Server (line-webhook)
echo   2. Frontend Server (Vite/React)
echo.
echo You need to run ngrok separately:
echo   ngrok http 3000
echo.
pause

start "Backend Server" cmd /k "cd line-webhook && npm start"
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Servers are starting...
echo.
echo Next steps:
echo 1. Run: ngrok http 3000
echo 2. Open: http://localhost:5173
echo 3. Configure LINE@ in Settings
echo.
pause

