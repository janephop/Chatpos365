@echo off
chcp 65001 >nul
echo ========================================
echo  📋 แสดง URL สำหรับการทดสอบ
echo ========================================
echo.

if exist "TUNNEL_URLS.txt" (
    type TUNNEL_URLS.txt
    echo.
    echo 💡 คัดลอก URL เหล่านี้ไปแชร์ให้คนอื่นได้เลย!
    echo.
) else (
    echo ⚠️  ยังไม่มีไฟล์ TUNNEL_URLS.txt
    echo.
    echo 📝 กรุณารัน SETUP_NAMED_TUNNEL.ps1 ก่อน
    echo.
)

if exist "cloudflare-tunnel-config.yml" (
    echo 📄 ข้อมูลจาก Config File:
    echo.
    findstr /C:"hostname:" cloudflare-tunnel-config.yml
    echo.
)

pause


