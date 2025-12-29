@echo off
chcp 65001 >nul
echo ========================================
echo  🚀 เริ่มต้นเซิร์ฟเวอร์ทั้งหมด
echo ========================================
echo.
echo 📋 จะรัน:
echo   1. Frontend (Vite) - พอร์ต 8085
echo   2. Backend (LINE Webhook) - พอร์ต 3000
echo   3. ngrok - เปิดพอร์ต 8085
echo.
pause

echo.
echo 🔵 เริ่มต้น Frontend Server (พอร์ต 8085)...
start "Frontend Server (8085)" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo 🔵 เริ่มต้น Backend Server (พอร์ต 3000)...
start "Backend Server (3000)" cmd /k "cd line-webhook && npm start"

timeout /t 3 /nobreak >nul

echo.
echo 🔵 เริ่มต้น ngrok (เปิดพอร์ต 8085)...
start "ngrok (8085)" cmd /k "ngrok.exe http 8085"

echo.
echo ✅ เริ่มต้นเซิร์ฟเวอร์ทั้งหมดแล้ว!
echo.
echo 📝 ขั้นตอนต่อไป:
echo   1. รอให้ ngrok แสดง URL (เช่น https://xxxx.ngrok.io)
echo   2. เปิดเว็บ: http://localhost:8085
echo   3. ไปที่ Settings → LINE Official Account
echo   4. วาง ngrok URL + /webhook/line ใน LINE Developers Console
echo.
echo 💡 หมายเหตุ: ngrok URL จะเปลี่ยนทุกครั้งที่รันใหม่
echo.
pause

