@echo off
chcp 65001 >nul
cls
echo ========================================
echo  🧪 ทดสอบ API ทั้งหมด
echo ========================================
echo.

REM ตรวจสอบว่า curl มีอยู่หรือไม่
where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ไม่พบ curl!
    pause
    exit /b 1
)

set BASE_URL=http://localhost:3000
set PASSED=0
set FAILED=0

echo 📋 กำลังทดสอบ API ทั้งหมด...
echo.

REM ทดสอบ Health
echo [1] Health Check...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/health | findstr /C:"200" >nul
if %errorlevel% equ 0 (
    echo    ✅ PASS
    set /a PASSED+=1
) else (
    echo    ❌ FAIL
    set /a FAILED+=1
)

REM ทดสอบ Database Info
echo [2] Database Info...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/api/database/info | findstr /C:"200" >nul
if %errorlevel% equ 0 (
    echo    ✅ PASS
    set /a PASSED+=1
) else (
    echo    ❌ FAIL
    set /a FAILED+=1
)

REM ทดสอบ Chats
echo [3] Chats...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/api/chats | findstr /C:"200" >nul
if %errorlevel% equ 0 (
    echo    ✅ PASS
    set /a PASSED+=1
) else (
    echo    ❌ FAIL
    set /a FAILED+=1
)

REM ทดสอบ Chat Stats
echo [4] Chat Stats...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/api/chats/stats | findstr /C:"200" >nul
if %errorlevel% equ 0 (
    echo    ✅ PASS
    set /a PASSED+=1
) else (
    echo    ❌ FAIL
    set /a FAILED+=1
)

REM ทดสอบ Settings
echo [5] Settings...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/api/settings | findstr /C:"200" >nul
if %errorlevel% equ 0 (
    echo    ✅ PASS
    set /a PASSED+=1
) else (
    echo    ❌ FAIL
    set /a FAILED+=1
)

REM ทดสอบ Bills
echo [6] Bills...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/api/bills | findstr /C:"200" >nul
if %errorlevel% equ 0 (
    echo    ✅ PASS
    set /a PASSED+=1
) else (
    echo    ❌ FAIL
    set /a FAILED+=1
)

REM ทดสอบ Shop Data
echo [7] Shop Data...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/api/shop-data | findstr /C:"200" >nul
if %errorlevel% equ 0 (
    echo    ✅ PASS
    set /a PASSED+=1
) else (
    echo    ❌ FAIL
    set /a FAILED+=1
)

REM ทดสอบ Bank Accounts
echo [8] Bank Accounts...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/api/bank-accounts | findstr /C:"200" >nul
if %errorlevel% equ 0 (
    echo    ✅ PASS
    set /a PASSED+=1
) else (
    echo    ❌ FAIL
    set /a FAILED+=1
)

REM ทดสอบ Shipping Companies
echo [9] Shipping Companies...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/api/shipping-companies | findstr /C:"200" >nul
if %errorlevel% equ 0 (
    echo    ✅ PASS
    set /a PASSED+=1
) else (
    echo    ❌ FAIL
    set /a FAILED+=1
)

echo.
echo ========================================
echo  📊 สรุปผลการทดสอบ
echo ========================================
echo   ✅ ผ่าน: %PASSED%
echo   ❌ ไม่ผ่าน: %FAILED%
echo   📋 ทั้งหมด: %PASSED%/%PASSED%+%FAILED%
echo ========================================
echo.
pause

