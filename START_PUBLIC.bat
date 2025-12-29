@echo off
chcp 65001 >nul
echo ========================================
echo  🌐 เริ่มต้นระบบให้คนอื่นใช้งานได้
echo  (Public Access - Cloudflare Tunnel)
echo ========================================
echo.

REM ตรวจสอบว่ามี cloudflared.exe หรือไม่
if not exist "cloudflared.exe" (
    echo ❌ ไม่พบ cloudflared.exe
    echo.
    echo 📥 กรุณาดาวน์โหลดจาก:
    echo    https://github.com/cloudflare/cloudflared/releases
    echo.
    echo 💡 ขั้นตอน:
    echo   1. ดาวน์โหลด cloudflared-windows-amd64.exe
    echo   2. เปลี่ยนชื่อเป็น cloudflared.exe
    echo   3. วางไว้ในโฟลเดอร์นี้
    echo.
    pause
    exit /b 1
)

REM เริ่มต้นเซิร์ฟเวอร์
echo 🔵 เริ่มต้น Backend Server (port 3000)...
start "Backend Server (3000)" cmd /k "cd line-webhook && npm start"

timeout /t 3 /nobreak >nul

echo 🔵 เริ่มต้น Frontend Server (port 8085)...
start "Frontend Server (8085)" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  📋 ข้อมูลที่ต้องรู้:
echo ========================================
echo.
echo 🔵 Backend URL จะแสดงใน Terminal "Cloudflare Tunnel Backend"
echo 🔵 Frontend URL จะแสดงใน Terminal "Cloudflare Tunnel Frontend"
echo.
echo 📝 หลังจาก Tunnel เริ่มทำงาน:
echo   1. คัดลอก Backend URL (เช่น https://xxxx.trycloudflare.com)
echo   2. คัดลอก Frontend URL (เช่น https://yyyy.trycloudflare.com)
echo   3. แชร์ Frontend URL ให้คนอื่นใช้งาน
echo   4. ตั้งค่า LINE Webhook: Backend URL + /webhook/line
echo.
echo ⚠️  หมายเหตุ:
echo   - URL จะเปลี่ยนทุกครั้งที่รัน tunnel ใหม่
echo   - ถ้าต้องการ URL คงที่: ใช้ Named Tunnel (ดู CLOUDFLARE_TUNNEL_SETUP.md)
echo.
pause

echo.
echo 🔵 เริ่มต้น Cloudflare Tunnel สำหรับ Backend (port 3000)...
echo 💡 URL จะแสดงใน Terminal นี้
cd /d %~dp0
start "Cloudflare Tunnel Backend (3000)" cmd /k "cd /d %~dp0 && cloudflared.exe tunnel --url http://localhost:3000"

timeout /t 3 /nobreak >nul

echo.
echo 🔵 เริ่มต้น Cloudflare Tunnel สำหรับ Frontend (port 8085)...
echo 💡 URL จะแสดงใน Terminal นี้
start "Cloudflare Tunnel Frontend (8085)" cmd /k "cd /d %~dp0 && cloudflared.exe tunnel --url http://localhost:8085"

echo.
echo ========================================
echo  ✅ เริ่มต้นระบบแล้ว!
echo ========================================
echo.
echo 📝 ขั้นตอนต่อไป:
echo   1. ดู URL ใน Terminal "Cloudflare Tunnel Backend" และ "Cloudflare Tunnel Frontend"
echo   2. คัดลอก Backend URL (เช่น https://xxxx.trycloudflare.com)
echo   3. สร้างไฟล์ .env ในโฟลเดอร์ root (ถ้ายังไม่มี):
echo      VITE_API_URL=https://xxxx.trycloudflare.com
echo   4. Restart Frontend (กด Ctrl+C ใน Frontend Terminal แล้วรัน npm run dev อีกครั้ง)
echo   5. คัดลอก Frontend URL และแชร์ให้คนอื่นใช้งาน
echo   6. ตั้งค่า LINE Webhook: https://xxxx.trycloudflare.com/webhook/line
echo.
echo 💡 เคล็ดลับ:
echo   - URL จะแสดงใน Terminal ที่เปิดขึ้นมา
echo   - Frontend URL คือ URL ที่แชร์ให้คนอื่นเปิดเว็บ
echo   - Backend URL ใช้สำหรับ LINE Webhook และ API
echo.
echo ⚠️  หมายเหตุ:
echo   - URL จะเปลี่ยนทุกครั้งที่รัน tunnel ใหม่
echo   - ถ้าต้องการ URL คงที่: ใช้ Named Tunnel (ดู CLOUDFLARE_TUNNEL_SETUP.md)
echo.
pause

