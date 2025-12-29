@echo off
chcp 65001 >nul
echo ========================================
echo  🤖 ตั้งค่าระบบอัตโนมัติ
echo  (ทำส่วนที่ AI ทำได้ให้อัตโนมัติ)
echo ========================================
echo.

REM ตรวจสอบ Node.js
echo [1] ตรวจสอบ Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ ไม่พบ Node.js!
    echo    💡 ดาวน์โหลด: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    ✅ Node.js: %NODE_VERSION%

REM ตรวจสอบ npm
echo [2] ตรวจสอบ npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ ไม่พบ npm!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo    ✅ npm: %NPM_VERSION%

REM ติดตั้ง Frontend Dependencies
echo.
echo [3] ตรวจสอบ Frontend Dependencies...
if not exist "node_modules" (
    echo    ⚠️  ยังไม่ติดตั้ง กำลังติดตั้ง...
    call npm install
    if errorlevel 1 (
        echo    ❌ ติดตั้ง Frontend Dependencies ไม่สำเร็จ
        pause
        exit /b 1
    )
    echo    ✅ ติดตั้ง Frontend Dependencies สำเร็จ
) else (
    echo    ✅ Frontend Dependencies ติดตั้งแล้ว
)

REM ติดตั้ง Backend Dependencies
echo.
echo [4] ตรวจสอบ Backend Dependencies...
if not exist "line-webhook\node_modules" (
    echo    ⚠️  ยังไม่ติดตั้ง กำลังติดตั้ง...
    cd line-webhook
    call npm install
    if errorlevel 1 (
        echo    ❌ ติดตั้ง Backend Dependencies ไม่สำเร็จ
        pause
        exit /b 1
    )
    cd ..
    echo    ✅ ติดตั้ง Backend Dependencies สำเร็จ
) else (
    echo    ✅ Backend Dependencies ติดตั้งแล้ว
)

REM สร้างไฟล์ .env template (ถ้ายังไม่มี)
echo.
echo [5] ตรวจสอบไฟล์ .env...
if not exist ".env" (
    if exist ".env.example" (
        echo    ⚠️  ยังไม่มีไฟล์ .env กำลังสร้างจาก template...
        copy ".env.example" ".env" >nul
        echo    ✅ สร้างไฟล์ .env แล้ว (ต้องแก้ไขค่าเอง)
        echo    💡 แก้ไข VITE_API_URL ในไฟล์ .env
    ) else (
        echo    ⚠️  ยังไม่มีไฟล์ .env และ .env.example
        echo    💡 สร้างไฟล์ .env เอง: VITE_API_URL=https://...
    )
) else (
    echo    ✅ ไฟล์ .env มีอยู่แล้ว
)

if not exist "line-webhook\.env" (
    if exist "line-webhook\.env.example" (
        echo    ⚠️  ยังไม่มีไฟล์ line-webhook\.env กำลังสร้างจาก template...
        copy "line-webhook\.env.example" "line-webhook\.env" >nul
        echo    ✅ สร้างไฟล์ line-webhook\.env แล้ว (ต้องแก้ไขค่าเอง)
        echo    💡 แก้ไข LINE_CHANNEL_ACCESS_TOKEN และ LINE_CHANNEL_SECRET
    ) else (
        echo    ⚠️  ยังไม่มีไฟล์ line-webhook\.env และ .env.example
        echo    💡 สร้างไฟล์ line-webhook\.env เอง
    )
) else (
    echo    ✅ ไฟล์ line-webhook\.env มีอยู่แล้ว
)

REM ตรวจสอบ cloudflared
echo.
echo [6] ตรวจสอบ Cloudflare Tunnel...
if not exist "cloudflared.exe" (
    echo    ⚠️  ไม่พบ cloudflared.exe
    echo    💡 ดาวน์โหลด: https://github.com/cloudflare/cloudflared/releases
    echo    💡 ดาวน์โหลด cloudflared-windows-amd64.exe
    echo    💡 เปลี่ยนชื่อเป็น cloudflared.exe
    echo    💡 วางไว้ในโฟลเดอร์นี้
) else (
    echo    ✅ cloudflared.exe พร้อมใช้งาน
)

REM ตรวจสอบ config
echo.
echo [7] ตรวจสอบ Cloudflare Tunnel Config...
if not exist "cloudflare-tunnel-config.yml" (
    if exist "cloudflare-tunnel-config.yml.example" (
        echo    ⚠️  ยังไม่มีไฟล์ config กำลังสร้างจาก template...
        copy "cloudflare-tunnel-config.yml.example" "cloudflare-tunnel-config.yml" >nul
        echo    ✅ สร้างไฟล์ config แล้ว (ต้องแก้ไขค่าเอง)
        echo    💡 ต้องตั้งค่า Tunnel ก่อน: SETUP_PERMANENT_TUNNEL.bat
        echo    💡 แล้วแก้ไข hostname ในไฟล์ config
    ) else (
        echo    ⚠️  ยังไม่มีไฟล์ config
        echo    💡 ต้องตั้งค่า Tunnel ก่อน: SETUP_PERMANENT_TUNNEL.bat
    )
) else (
    echo    ✅ ไฟล์ config มีอยู่แล้ว
)

echo.
echo ========================================
echo  ✅ ตรวจสอบและตั้งค่าเสร็จสิ้น!
echo ========================================
echo.
echo 📋 สิ่งที่ต้องทำเอง:
echo   1. สร้าง Cloudflare Account (ถ้ายังไม่มี)
echo   2. รัน SETUP_PERMANENT_TUNNEL.bat
echo   3. ตั้งค่า Public Hostname ใน Cloudflare Dashboard
echo   4. แก้ไข cloudflare-tunnel-config.yml
echo   5. แก้ไขไฟล์ .env (ใส่ URL และ LINE credentials)
echo   6. รัน START_PERMANENT.bat
echo   7. ตั้งค่า LINE Webhook
echo.
echo 📚 อ่านคู่มือ: SETUP_GUIDE.md
echo.
pause

