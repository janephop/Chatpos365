@echo off
chcp 65001 >nul
echo ========================================
echo  🚀 เริ่มต้น Backend และ Frontend
echo ========================================
echo.

echo 🔵 เริ่มต้น Backend Server (port 3000)...
start "Backend Server (3000)" cmd /k "cd line-webhook && npm start"

timeout /t 3 /nobreak >nul

echo.
echo 🔵 เริ่มต้น Frontend Server (port 8085)...
start "Frontend Server (8085)" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  ✅ เริ่มต้น Backend และ Frontend แล้ว!
echo ========================================
echo.
echo 💡 Tunnel ทำงานผ่าน Managed Service แล้ว
echo    ไม่ต้องรัน tunnel แบบ manual
echo.
echo 📝 ทดสอบ URLs:
echo   - Backend: https://line-chat-backend-12345.trycloudflare.com
echo   - Frontend: https://line-chat-frontend-12345.trycloudflare.com
echo.
pause

