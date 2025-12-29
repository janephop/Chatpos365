@echo off
chcp 65001 >nul
echo ========================================
echo  🌐 เริ่มต้นระบบด้วย Cloudflare Tunnel
echo ========================================
echo.

REM ตรวจสอบว่ามี cloudflared.exe หรือไม่
if not exist "cloudflared.exe" (
    echo ❌ ไม่พบ cloudflared.exe
    echo.
    echo 📥 กรุณาดาวน์โหลดจาก:
    echo    https://github.com/cloudflare/cloudflared/releases
    echo.
    echo 💡 ดาวน์โหลด cloudflared-windows-amd64.exe
    echo    แล้วเปลี่ยนชื่อเป็น cloudflared.exe
    echo    วางไว้ในโฟลเดอร์นี้
    echo.
    pause
    exit /b 1
)

echo 📋 จะรัน:
echo   1. Backend Server (port 3000)
echo   2. Frontend Server (port 8085)
echo   3. Cloudflare Tunnel สำหรับ Backend (port 3000)
echo   4. Cloudflare Tunnel สำหรับ Frontend (port 8085)
echo.
echo 💡 วิธีใช้:
echo   - Quick Tunnel: URL จะแสดงใน Terminal (เปลี่ยนทุกครั้ง)
echo   - Named Tunnel: ใช้ไฟล์ config.yml (URL คงที่)
echo.
echo ⚠️  หมายเหตุ:
echo   - ถ้าใช้ Quick Tunnel: URL จะเปลี่ยนทุกครั้งที่รันใหม่
echo   - ถ้าต้องการ URL คงที่: ใช้ Named Tunnel (ดู CLOUDFLARE_TUNNEL_SETUP.md)
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
echo 🔵 เริ่มต้น Cloudflare Tunnel สำหรับ Backend (port 3000)...
echo 💡 URL จะแสดงใน Terminal นี้
start "Cloudflare Tunnel Backend (3000)" cmd /k "cloudflared.exe tunnel --url http://localhost:3000"

timeout /t 3 /nobreak >nul

echo.
echo 🔵 เริ่มต้น Cloudflare Tunnel สำหรับ Frontend (port 8085)...
echo 💡 URL จะแสดงใน Terminal นี้
start "Cloudflare Tunnel Frontend (8085)" cmd /k "cloudflared.exe tunnel --url http://localhost:8085"

echo.
echo ✅ เริ่มต้นระบบแล้ว!
echo.
echo 📝 ขั้นตอนต่อไป:
echo   1. รอให้ Cloudflare Tunnel แสดง URL
echo   2. คัดลอก Backend Tunnel URL (เช่น https://xxxx.trycloudflare.com)
echo   3. สร้างไฟล์ .env ในโฟลเดอร์ root:
echo      VITE_API_URL=https://xxxx.trycloudflare.com
echo   4. Restart Frontend (กด Ctrl+C แล้วรัน npm run dev อีกครั้ง)
echo   5. คัดลอก Frontend Tunnel URL และแชร์ให้คนอื่น
echo   6. ตั้งค่า LINE Webhook: https://xxxx.trycloudflare.com/webhook/line
echo.
echo ⚠️  หมายเหตุ:
echo   - URL จะเปลี่ยนทุกครั้งที่รัน tunnel ใหม่
echo   - ถ้าต้องการ URL คงที่: ใช้ Named Tunnel (ดู CLOUDFLARE_TUNNEL_SETUP.md)
echo.
pause

