@echo off
chcp 65001 >nul
echo ========================================
echo  🔧 ติดตั้ง Cloudflare Tunnel Service
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

echo 📋 ขั้นตอนการติดตั้ง:
echo   1. คัดลอกคำสั่งจาก Cloudflare Dashboard
echo   2. วางคำสั่งใน PowerShell แบบ Administrator
echo   3. รันคำสั่ง
echo.
echo 💡 คำสั่งจะมีลักษณะ: cloudflared.exe service install eyJhIjoiZj...
echo.

REM ตรวจสอบว่า Service ติดตั้งอยู่แล้วหรือไม่
sc query cloudflared >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Cloudflared Service ติดตั้งอยู่แล้ว!
    echo.
    echo 📋 ตรวจสอบสถานะ Service...
    sc query cloudflared | findstr "STATE"
    echo.
    echo 💡 ถ้า Service ไม่ทำงาน ให้รันคำสั่งนี้ใน PowerShell แบบ Admin:
    echo    Start-Service cloudflared
    echo.
) else (
    echo ⚠️  Cloudflared Service ยังไม่ติดตั้ง
    echo.
    echo 📝 ขั้นตอนการติดตั้ง:
    echo   1. ไปที่ Cloudflare Dashboard
    echo   2. คลิก Copy คำสั่ง install service
    echo   3. เปิด PowerShell แบบ Administrator (Windows + X)
    echo   4. เปลี่ยนไปที่โฟลเดอร์นี้:
    echo      cd "C:\Users\jay_rpn\Documents\Project Big\Project Pos Chat\line chat"
    echo   5. วางคำสั่งแล้วกด Enter
    echo.
)

echo ========================================
echo  📚 อ่านคู่มือเพิ่มเติม
echo ========================================
echo.
echo 💡 ดูไฟล์ INSTALL_TUNNEL_SERVICE.md สำหรับคำแนะนำแบบละเอียด
echo.

pause

