# PowerShell Script - เริ่มต้น Frontend Server
# รองรับ path ที่มีช่องว่าง

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🚀 เริ่มต้น Frontend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# เปลี่ยนไปที่โฟลเดอร์โปรเจกต์
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "📂 โฟลเดอร์ปัจจุบัน: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# ตรวจสอบว่า package.json มีอยู่
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ไม่พบ package.json!" -ForegroundColor Red
    Write-Host "💡 กรุณารันสคริปต์นี้ในโฟลเดอร์โปรเจกต์" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "กด Enter เพื่อปิด"
    exit 1
}

Write-Host "📋 กำลังเริ่มต้น Frontend (port 8085)..." -ForegroundColor Green
Write-Host ""

# ตรวจสอบว่า node_modules มีอยู่
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  ไม่พบ node_modules" -ForegroundColor Yellow
    Write-Host "📥 กำลังติดตั้ง dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ติดตั้ง dependencies ไม่สำเร็จ!" -ForegroundColor Red
        Read-Host "กด Enter เพื่อปิด"
        exit 1
    }
    Write-Host ""
}

# ตรวจสอบว่า vite ติดตั้งแล้ว
if (-not (Test-Path "node_modules\vite")) {
    Write-Host "⚠️  Vite ยังไม่ติดตั้ง" -ForegroundColor Yellow
    Write-Host "📥 กำลังติดตั้ง Vite..." -ForegroundColor Cyan
    npm install vite --save-dev
    Write-Host ""
}

Write-Host "🔵 เริ่มต้น Frontend Server..." -ForegroundColor Cyan
Write-Host "💡 เปิดเบราว์เซอร์: http://localhost:8085" -ForegroundColor Yellow
Write-Host "💡 กด Ctrl+C เพื่อหยุด" -ForegroundColor Yellow
Write-Host ""

npm run dev

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ เกิดข้อผิดพลาด!" -ForegroundColor Red
    Write-Host "💡 ตรวจสอบว่า:" -ForegroundColor Yellow
    Write-Host "   - อยู่ในโฟลเดอร์โปรเจกต์ที่ถูกต้อง" -ForegroundColor Yellow
    Write-Host "   - package.json มี script 'dev'" -ForegroundColor Yellow
    Write-Host "   - dependencies ติดตั้งแล้ว" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "กด Enter เพื่อปิด"
}

