@echo off
chcp 65001 >nul
echo ========================================
echo  ⚙️  ตั้งค่า .env สำหรับ Frontend
echo ========================================
echo.

set /p BACKEND_URL="กรอก Backend URL (จาก Terminal Cloudflare Tunnel Backend): "

if "%BACKEND_URL%"=="" (
    echo ❌ ไม่ได้กรอก URL
    pause
    exit /b 1
)

echo.
echo 📝 กำลังสร้างไฟล์ .env...
echo VITE_API_URL=%BACKEND_URL% > .env

echo ✅ สร้างไฟล์ .env เรียบร้อยแล้ว!
echo.
echo 📋 เนื้อหาในไฟล์ .env:
type .env
echo.
echo ⚠️  หมายเหตุ:
echo   - ต้อง Restart Frontend Server เพื่อให้การตั้งค่าใหม่มีผล
echo   - กด Ctrl+C ใน Terminal "Frontend Server (8085)"
echo   - แล้วรัน npm run dev อีกครั้ง
echo.
pause

