@echo off
chcp 65001 >nul
echo ========================================
echo  🌐 เริ่มต้นระบบสำหรับใช้งานจากภายนอก
echo ========================================
echo.

echo 📋 จะรัน:
echo   1. Backend Server (port 3000)
echo   2. Frontend Server (port 8085)
echo   3. ngrok สำหรับ Backend (port 3000)
echo   4. ngrok สำหรับ Frontend (port 8085)
echo.
echo ⚠️  หมายเหตุ: ngrok free plan อาจรันได้แค่ 1 tunnel
echo    ถ้าต้องการ 2 tunnels ต้องใช้ ngrok paid plan หรือรันแยก terminal
echo.
pause

echo.
echo 🔵 เริ่มต้น Backend Server...
start "Backend Server (3000)" cmd /k "cd line-webhook && npm start"

timeout /t 3 /nobreak >nul

echo.
echo 🔵 เริ่มต้น Frontend Server...
start "Frontend Server (8085)" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo 🔵 เริ่มต้น ngrok สำหรับ Backend (port 3000)...
start "ngrok Backend (3000)" cmd /k "ngrok.exe http 3000"

timeout /t 3 /nobreak >nul

echo.
echo 🔵 เริ่มต้น ngrok สำหรับ Frontend (port 8085)...
echo ⚠️  ถ้า ngrok free plan อาจต้องรันแยก terminal
start "ngrok Frontend (8085)" cmd /k "ngrok.exe http 8085"

echo.
echo ✅ เริ่มต้นระบบแล้ว!
echo.
echo 📝 ขั้นตอนต่อไป:
echo   1. รอให้ ngrok แสดง URL
echo   2. คัดลอก Backend ngrok URL (เช่น https://xxxx.ngrok.io)
echo   3. สร้างไฟล์ .env ในโฟลเดอร์ root:
echo      VITE_API_URL=https://xxxx.ngrok.io
echo   4. Restart Frontend (กด Ctrl+C แล้วรัน npm run dev อีกครั้ง)
echo   5. คัดลอก Frontend ngrok URL และแชร์ให้คนอื่น
echo.
echo 💡 ดู ngrok URL ได้ที่: http://localhost:4040
echo.
pause

