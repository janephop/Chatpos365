@echo off
chcp 65001 >nul
cls
echo ========================================
echo  🔍 ตรวจสอบระบบ
echo ========================================
echo.

echo 📋 กำลังตรวจสอบ...
echo.

REM ตรวจสอบ Node.js
echo [1] ตรวจสอบ Node.js...
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo    ✅ Node.js: %NODE_VERSION%
) else (
    echo    ❌ ไม่พบ Node.js!
    echo    💡 ดาวน์โหลด: https://nodejs.org/
)

REM ตรวจสอบ npm
echo [2] ตรวจสอบ npm...
where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo    ✅ npm: %NPM_VERSION%
) else (
    echo    ❌ ไม่พบ npm!
)

REM ตรวจสอบ Port 3000
echo [3] ตรวจสอบ Port 3000 (Backend)...
netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo    ✅ Port 3000 ถูกใช้งาน (Backend ทำงานอยู่)
) else (
    echo    ⚠️  Port 3000 ว่าง (Backend ไม่ทำงาน)
)

REM ตรวจสอบ Port 8085
echo [4] ตรวจสอบ Port 8085 (Frontend)...
netstat -ano | findstr ":8085" >nul
if %errorlevel% equ 0 (
    echo    ✅ Port 8085 ถูกใช้งาน (Frontend ทำงานอยู่)
) else (
    echo    ⚠️  Port 8085 ว่าง (Frontend ไม่ทำงาน)
)

REM ตรวจสอบ Database
echo [5] ตรวจสอบ Database...
if exist "line-webhook\data\pos_chat.db" (
    echo    ✅ Database ถูกสร้างแล้ว
    for %%A in ("line-webhook\data\pos_chat.db") do set DB_SIZE=%%~zA
    set /a DB_SIZE_MB=%DB_SIZE%/1024/1024
    echo    📊 ขนาด: %DB_SIZE_MB% MB
) else (
    echo    ⚠️  Database ยังไม่ถูกสร้าง
)

REM ตรวจสอบ JSON Files
echo [6] ตรวจสอบ JSON Files...
set JSON_COUNT=0
if exist "line-webhook\data\chats.json" set /a JSON_COUNT+=1
if exist "line-webhook\data\messages.json" set /a JSON_COUNT+=1
if exist "line-webhook\data\settings.json" set /a JSON_COUNT+=1
if exist "line-webhook\data\online_bills.json" set /a JSON_COUNT+=1
echo    📁 พบ JSON files: %JSON_COUNT% ไฟล์

REM ตรวจสอบ Dependencies
echo [7] ตรวจสอบ Dependencies...
if exist "node_modules" (
    echo    ✅ Frontend dependencies ติดตั้งแล้ว
) else (
    echo    ⚠️  Frontend dependencies ยังไม่ติดตั้ง
    echo    💡 รัน: npm install
)

if exist "line-webhook\node_modules" (
    echo    ✅ Backend dependencies ติดตั้งแล้ว
) else (
    echo    ⚠️  Backend dependencies ยังไม่ติดตั้ง
    echo    💡 รัน: cd line-webhook ^&^& npm install
)

REM ตรวจสอบ cloudflared
echo [8] ตรวจสอบ Cloudflare Tunnel...
if exist "cloudflared.exe" (
    echo    ✅ cloudflared.exe พร้อมใช้งาน
) else (
    echo    ⚠️  ไม่พบ cloudflared.exe
    echo    💡 ดาวน์โหลด: https://github.com/cloudflare/cloudflared/releases
)

echo.
echo ========================================
echo  ✅ ตรวจสอบเสร็จสิ้น!
echo ========================================
echo.
echo 💡 ขั้นตอนต่อไป:
echo   1. ถ้า Backend/Frontend ไม่ทำงาน: รัน START_SERVERS.bat
echo   2. ถ้า Dependencies ไม่ติดตั้ง: npm install
echo   3. ทดสอบระบบ: QUICK_TEST.bat
echo.
pause

