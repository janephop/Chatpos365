@echo off
chcp 65001 >nul
echo ========================================
echo  🌐 เริ่มต้นระบบด้วย Named Tunnel
echo  (URL คงที่ถาวร - ไม่ต้องเปลี่ยน Webhook)
echo ========================================
echo.

REM ตรวจสอบว่ามี cloudflared.exe หรือไม่
if not exist "cloudflared.exe" (
    echo ❌ ไม่พบ cloudflared.exe
    echo.
    echo 📥 กรุณาดาวน์โหลดจาก:
    echo    https://github.com/cloudflare/cloudflared/releases
    echo.
    pause
    exit /b 1
)

REM ตรวจสอบว่ามีไฟล์ config หรือไม่
if not exist "cloudflare-tunnel-config.yml" (
    echo ❌ ไม่พบไฟล์ cloudflare-tunnel-config.yml
    echo.
    echo 💡 ต้องตั้งค่า Named Tunnel ก่อน:
    echo   1. รัน SETUP_PERMANENT_TUNNEL.bat
    echo   2. ตั้งค่า Public Hostname ใน Cloudflare Dashboard
    echo   3. แก้ไข hostname ใน cloudflare-tunnel-config.yml
    echo.
    pause
    exit /b 1
)

echo 📋 จะรัน:
echo   1. Backend Server (port 3000)
echo   2. Frontend Server (port 8085)
echo   3. Cloudflare Named Tunnel (URL คงที่)
echo.
echo 💡 URL จะคงที่ถาวร ไม่ต้องเปลี่ยน webhook!
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
echo 🔵 เริ่มต้น Cloudflare Named Tunnel...
echo 💡 URL จะแสดงใน Terminal นี้
echo 💡 URL จะคงที่ถาวร (ไม่เปลี่ยน)
echo.
start "Cloudflare Named Tunnel" cmd /k "cloudflared.exe tunnel run line-chat --config cloudflare-tunnel-config.yml"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  ✅ เริ่มต้นระบบแล้ว!
echo ========================================
echo.
echo 📝 ข้อมูลสำคัญ:
echo   - Backend URL: ดูใน cloudflare-tunnel-config.yml
echo   - Frontend URL: ดูใน cloudflare-tunnel-config.yml
echo   - URL จะคงที่ถาวร ไม่ต้องเปลี่ยน webhook!
echo.
echo 📝 ขั้นตอนต่อไป:
echo   1. ดู URL ใน Terminal "Cloudflare Named Tunnel"
echo   2. ตั้งค่า VITE_API_URL ใน .env ให้ตรงกับ Backend URL
echo   3. Restart Frontend (ถ้ายังไม่ได้ตั้งค่า .env)
echo   4. ตั้งค่า LINE Webhook: Backend URL + /webhook/line
echo.
echo 💡 เคล็ดลับ:
echo   - URL จะคงที่ถาวร ไม่ต้องเปลี่ยนทุกครั้ง
echo   - ใช้ได้กับ LINE Official Account
echo   - ไม่ต้องตั้งค่า webhook ใหม่บ่อยๆ
echo.
pause

