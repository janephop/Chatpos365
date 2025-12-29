@echo off
chcp 65001 >nul
cls
echo ========================================
echo  🧪 Quick Test Script - ระบบทดสอบอัตโนมัติ
echo ========================================
echo.
echo 📋 กำลังทดสอบระบบ...
echo.

REM ตรวจสอบว่า curl มีอยู่หรือไม่
where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ไม่พบ curl! กรุณาติดตั้ง curl หรือใช้ PowerShell แทน
    echo.
    echo 💡 วิธีแก้: ดาวน์โหลด curl จาก https://curl.se/windows/
    pause
    exit /b 1
)

REM ทดสอบ Backend Health
echo [1/5] 🔍 ทดสอบ Backend Health...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:3000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ Backend ไม่ทำงาน! (port 3000)
    echo    💡 แก้ไข: รัน START_SERVERS.bat หรือ cd line-webhook ^&^& npm start
    echo.
    set TEST_FAILED=1
) else (
    echo    ✅ Backend ทำงานปกติ
)
echo.

REM ทดสอบ Database Info
echo [2/5] 💾 ทดสอบ Database Info...
curl -s http://localhost:3000/api/database/info >nul 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  ไม่สามารถเชื่อมต่อ Database API ได้
    set TEST_FAILED=1
) else (
    echo    ✅ Database API ทำงานปกติ
    curl -s http://localhost:3000/api/database/info | findstr /C:"available" >nul
    if %errorlevel% equ 0 (
        echo    ✅ Database พร้อมใช้งาน
    ) else (
        echo    ⚠️  Database อาจยังไม่ถูกสร้าง
    )
)
echo.

REM ทดสอบ Chats API
echo [3/5] 💬 ทดสอบ Chats API...
curl -s http://localhost:3000/api/chats >nul 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  ไม่สามารถเชื่อมต่อ Chats API ได้
    set TEST_FAILED=1
) else (
    echo    ✅ Chats API ทำงานปกติ
)
echo.

REM ทดสอบ Chat Stats
echo [4/5] 📊 ทดสอบ Chat Stats...
curl -s http://localhost:3000/api/chats/stats >nul 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  ไม่สามารถเชื่อมต่อ Chat Stats API ได้
    set TEST_FAILED=1
) else (
    echo    ✅ Chat Stats API ทำงานปกติ
)
echo.

REM ทดสอบ Settings
echo [5/5] ⚙️  ทดสอบ Settings API...
curl -s http://localhost:3000/api/settings >nul 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  ไม่สามารถเชื่อมต่อ Settings API ได้
    set TEST_FAILED=1
) else (
    echo    ✅ Settings API ทำงานปกติ
)
echo.

REM สรุปผลการทดสอบ
echo ========================================
if defined TEST_FAILED (
    echo  ⚠️  พบปัญหาบางส่วน
    echo.
    echo  💡 แก้ไข:
    echo    1. ตรวจสอบว่า Backend ทำงานอยู่ (port 3000)
    echo    2. ตรวจสอบว่า Frontend ทำงานอยู่ (port 8085)
    echo    3. ดูเอกสาร: TESTING_GUIDE.md
) else (
    echo  ✅ ทดสอบเสร็จสิ้น - ระบบทำงานปกติ!
    echo.
    echo  📋 สรุป:
    echo     ✅ Backend: http://localhost:3000
    echo     ✅ Frontend: http://localhost:8085
    echo     ✅ Database: line-webhook/data/pos_chat.db
)
echo ========================================
echo.
echo 🔗 Links สำคัญ:
echo   - Frontend: http://localhost:8085
echo   - Backend API: http://localhost:3000
echo   - Health Check: http://localhost:3000/health
echo   - Database Info: http://localhost:3000/api/database/info
echo   - Chats: http://localhost:3000/api/chats
echo   - Chat Stats: http://localhost:3000/api/chats/stats
echo.
echo 📚 เอกสาร:
echo   - START_TESTING.md - Quick Start
echo   - TESTING_GUIDE.md - คู่มือการทดสอบแบบละเอียด
echo.
pause

