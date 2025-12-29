@echo off
chcp 65001 >nul
echo ========================================
echo  📊 ตรวจสอบสถานะเซิร์ฟเวอร์
echo ========================================
echo.

echo 🔍 ตรวจสอบพอร์ต 8085 (Frontend)...
netstat -ano | findstr ":8085" >nul
if %errorlevel% == 0 (
    echo ✅ Frontend กำลังรันอยู่บนพอร์ต 8085
    netstat -ano | findstr ":8085"
) else (
    echo ❌ Frontend ไม่ได้รันอยู่
)

echo.
echo 🔍 ตรวจสอบพอร์ต 3000 (Backend)...
netstat -ano | findstr ":3000" >nul
if %errorlevel% == 0 (
    echo ✅ Backend กำลังรันอยู่บนพอร์ต 3000
    netstat -ano | findstr ":3000"
) else (
    echo ❌ Backend ไม่ได้รันอยู่
)

echo.
echo 🔍 ตรวจสอบ ngrok...
tasklist | findstr "ngrok.exe" >nul
if %errorlevel% == 0 (
    echo ✅ ngrok กำลังรันอยู่
    tasklist | findstr "ngrok.exe"
) else (
    echo ❌ ngrok ไม่ได้รันอยู่
)

echo.
echo 📝 เปิดเว็บ: http://localhost:8085
echo.
pause

