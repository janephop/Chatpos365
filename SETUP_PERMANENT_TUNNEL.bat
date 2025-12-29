@echo off
chcp 65001 >nul
echo ========================================
echo  🌐 ตั้งค่า Cloudflare Tunnel แบบถาวร
echo  (URL คงที่ - ไม่ต้องเปลี่ยน Webhook)
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

echo 📋 ขั้นตอนการตั้งค่า:
echo   1. สร้าง Cloudflare Account (ฟรี)
echo   2. Login เข้า Cloudflare
echo   3. สร้าง Tunnel
echo   4. ตั้งค่า Public Hostname ใน Cloudflare Dashboard
echo   5. สร้างไฟล์ config
echo.
echo ⚠️  หมายเหตุ:
echo   - ต้องมี Cloudflare Account (ฟรี)
echo   - URL จะคงที่ถาวร ไม่ต้องเปลี่ยน webhook
echo   - ใช้ได้กับ LINE Official Account
echo.
pause

echo.
echo ========================================
echo  ขั้นตอนที่ 1: Login เข้า Cloudflare
echo ========================================
echo.
echo 💡 จะเปิดเบราว์เซอร์ให้ login
echo    เลือก domain (ถ้ามี) หรือข้ามไปได้
echo.
pause

cloudflared.exe tunnel login

if errorlevel 1 (
    echo.
    echo ❌ Login ไม่สำเร็จ
    echo    กรุณาลองใหม่อีกครั้ง
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Login สำเร็จ!
echo.
pause

echo.
echo ========================================
echo  ขั้นตอนที่ 2: สร้าง Tunnel
echo ========================================
echo.
echo 💡 กำลังสร้าง tunnel ชื่อ "line-chat"...
echo.

cloudflared.exe tunnel create line-chat

if errorlevel 1 (
    echo.
    echo ❌ สร้าง Tunnel ไม่สำเร็จ
    echo    อาจมี tunnel ชื่อนี้อยู่แล้ว
    echo    ลองใช้ชื่ออื่นหรือลบ tunnel เก่าก่อน
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ สร้าง Tunnel สำเร็จ!
echo.
echo 📝 Tunnel ID จะแสดงด้านบน (เก็บไว้)
echo.
pause

echo.
echo ========================================
echo  ขั้นตอนที่ 3: ตั้งค่า Public Hostname
echo ========================================
echo.
echo 💡 ต้องตั้งค่า Public Hostname ใน Cloudflare Dashboard
echo.
echo 📋 ขั้นตอน:
echo   1. ไปที่: https://one.dash.cloudflare.com/
echo   2. เลือก Zero Trust → Networks → Tunnels
echo   3. คลิก tunnel "line-chat"
echo   4. ไปที่แท็บ "Public Hostnames"
echo   5. คลิก "Add a public hostname"
echo   6. ตั้งค่าดังนี้:
echo.
echo      Hostname: line-chat-backend-xxxxx.trycloudflare.com
echo      Service: http://localhost:3000
echo.
echo   7. คลิก "Add hostname"
echo   8. เพิ่มอีก 1 hostname:
echo.
echo      Hostname: line-chat-frontend-xxxxx.trycloudflare.com
echo      Service: http://localhost:8085
echo.
echo ⚠️  หมายเหตุ:
echo   - เปลี่ยน xxxxx เป็นตัวเลขหรือตัวอักษรที่ต้องการ
echo   - หรือใช้ domain ของคุณเอง (ถ้ามี)
echo.
echo 📝 หลังจากตั้งค่าแล้ว ให้จด URL ทั้ง 2 ไว้:
echo   - Backend URL: https://line-chat-backend-xxxxx.trycloudflare.com
echo   - Frontend URL: https://line-chat-frontend-xxxxx.trycloudflare.com
echo.
pause

echo.
echo ========================================
echo  ขั้นตอนที่ 4: สร้างไฟล์ Config
echo ========================================
echo.

REM หา Tunnel ID จาก .cloudflared folder
set TUNNEL_ID=
if exist ".cloudflared\*.json" (
    for %%f in (.cloudflared\*.json) do (
        set "TUNNEL_ID=%%~nf"
        goto :found
    )
)

:found
if "%TUNNEL_ID%"=="" (
    echo ❌ ไม่พบ Tunnel ID
    echo    กรุณาสร้าง tunnel อีกครั้ง
    echo.
    pause
    exit /b 1
)

echo 💡 พบ Tunnel ID: %TUNNEL_ID%
echo.

REM สร้างไฟล์ config
(
echo tunnel: %TUNNEL_ID%
echo credentials-file: .cloudflared\%TUNNEL_ID%.json
echo.
echo ingress:
echo   # Backend ^(port 3000^)
echo   - hostname: line-chat-backend-xxxxx.trycloudflare.com
echo     service: http://localhost:3000
echo   # Frontend ^(port 8085^)
echo   - hostname: line-chat-frontend-xxxxx.trycloudflare.com
echo     service: http://localhost:8085
echo   # Catch-all
echo   - service: http_status:404
) > cloudflare-tunnel-config.yml

echo ✅ สร้างไฟล์ cloudflare-tunnel-config.yml แล้ว!
echo.
echo ⚠️  หมายเหตุ:
echo   - ต้องแก้ไข hostname ในไฟล์ config ให้ตรงกับที่ตั้งใน Dashboard
echo   - เปิดไฟล์ cloudflare-tunnel-config.yml แล้วแก้ไข
echo.
pause

echo.
echo ========================================
echo  ✅ ตั้งค่าเสร็จสิ้น!
echo ========================================
echo.
echo 📝 ขั้นตอนต่อไป:
echo   1. แก้ไข hostname ใน cloudflare-tunnel-config.yml
echo   2. ใช้สคริปต์ START_PERMANENT.bat เพื่อเริ่มต้นระบบ
echo   3. URL จะคงที่ถาวร ไม่ต้องเปลี่ยน webhook!
echo.
echo 💡 ใช้ START_PERMANENT.bat เพื่อเริ่มต้นระบบ
echo.
pause

