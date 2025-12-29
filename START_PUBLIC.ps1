# PowerShell Script: เริ่มต้นระบบให้คนอื่นใช้งานได้
# รันใน Terminal ของ Cursor โดยตรง

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🌐 เริ่มต้นระบบให้คนอื่นใช้งานได้" -ForegroundColor Cyan
Write-Host " (Public Access - Cloudflare Tunnel)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่ามี cloudflared.exe หรือไม่
if (-not (Test-Path "cloudflared.exe")) {
    Write-Host "❌ ไม่พบ cloudflared.exe" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 กรุณาดาวน์โหลดจาก:" -ForegroundColor Yellow
    Write-Host "   https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 ขั้นตอน:" -ForegroundColor Yellow
    Write-Host "   1. ดาวน์โหลด cloudflared-windows-amd64.exe" -ForegroundColor Yellow
    Write-Host "   2. เปลี่ยนชื่อเป็น cloudflared.exe" -ForegroundColor Yellow
    Write-Host "   3. วางไว้ในโฟลเดอร์นี้" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่หรือไม่
Write-Host "🔍 ตรวจสอบสถานะเซิร์ฟเวอร์..." -ForegroundColor Yellow

$backendRunning = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$frontendRunning = Get-NetTCPConnection -LocalPort 8085 -ErrorAction SilentlyContinue

# เริ่มต้น Backend Server
if (-not $backendRunning) {
    Write-Host "🔵 เริ่มต้น Backend Server (port 3000)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\line-webhook'; npm start" -WindowStyle Minimized
    Start-Sleep -Seconds 3
} else {
    Write-Host "✅ Backend Server (port 3000) ทำงานอยู่แล้ว" -ForegroundColor Green
}

# เริ่มต้น Frontend Server
if (-not $frontendRunning) {
    Write-Host "🔵 เริ่มต้น Frontend Server (port 8085)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 5
} else {
    Write-Host "✅ Frontend Server (port 8085) ทำงานอยู่แล้ว" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 📋 ข้อมูลที่ต้องรู้:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔵 Backend URL และ Frontend URL จะแสดงด้านล่าง" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 หลังจาก Tunnel เริ่มทำงาน:" -ForegroundColor Yellow
Write-Host "   1. คัดลอก Backend URL (เช่น https://xxxx.trycloudflare.com)" -ForegroundColor White
Write-Host "   2. คัดลอก Frontend URL (เช่น https://yyyy.trycloudflare.com)" -ForegroundColor White
Write-Host "   3. แชร์ Frontend URL ให้คนอื่นใช้งาน" -ForegroundColor White
Write-Host "   4. ตั้งค่า LINE Webhook: Backend URL + /webhook/line" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  หมายเหตุ:" -ForegroundColor Yellow
Write-Host "   - URL จะเปลี่ยนทุกครั้งที่รัน tunnel ใหม่" -ForegroundColor White
Write-Host "   - ถ้าต้องการ URL คงที่: ใช้ Named Tunnel" -ForegroundColor White
Write-Host ""
Write-Host "กด Enter เพื่อเริ่มต้น Cloudflare Tunnel..." -ForegroundColor Cyan
Read-Host

Write-Host ""
Write-Host "🔵 เริ่มต้น Cloudflare Tunnel สำหรับ Backend (port 3000)..." -ForegroundColor Green
Write-Host "💡 URL จะแสดงด้านล่าง" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🌐 Backend Tunnel URL:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# รัน Backend Tunnel ใน background job
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    & ".\cloudflared.exe" tunnel --url http://localhost:3000 2>&1
}

# รอให้ Backend Tunnel แสดง URL
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🔵 เริ่มต้น Cloudflare Tunnel สำหรับ Frontend (port 8085)..." -ForegroundColor Green
Write-Host "💡 URL จะแสดงด้านล่าง" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🌐 Frontend Tunnel URL (แชร์ให้คนอื่น):" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# รัน Frontend Tunnel ใน background job
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    & ".\cloudflared.exe" tunnel --url http://localhost:8085 2>&1
}

# แสดง output จาก jobs
Write-Host ""
Write-Host "📊 กำลังแสดง URL จาก Tunnel..." -ForegroundColor Yellow
Write-Host ""

# ฟังก์ชันแสดง output จาก job
function Show-JobOutput {
    param($Job, $Name)
    
    $output = Receive-Job -Job $Job -ErrorAction SilentlyContinue
    if ($output) {
        $urlLine = $output | Select-String -Pattern "https://.*\.trycloudflare\.com"
        if ($urlLine) {
            Write-Host "$Name URL: " -ForegroundColor Green -NoNewline
            Write-Host $urlLine.Matches.Value -ForegroundColor Yellow
        }
        # แสดง output ทั้งหมด
        $output | ForEach-Object { Write-Host $_ }
    }
}

# ตรวจสอบและแสดง output ทุก 2 วินาที
$timeout = 30
$elapsed = 0
$backendUrlFound = $false
$frontendUrlFound = $false

while ($elapsed -lt $timeout) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    
    if (-not $backendUrlFound) {
        $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        if ($backendOutput) {
            $urlMatch = $backendOutput | Select-String -Pattern "https://.*\.trycloudflare\.com"
            if ($urlMatch) {
                Write-Host ""
                Write-Host "✅ Backend URL: " -ForegroundColor Green -NoNewline
                Write-Host $urlMatch.Matches.Value -ForegroundColor Yellow
                $backendUrlFound = $true
            }
        }
    }
    
    if (-not $frontendUrlFound) {
        $frontendOutput = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        if ($frontendOutput) {
            $urlMatch = $frontendOutput | Select-String -Pattern "https://.*\.trycloudflare\.com"
            if ($urlMatch) {
                Write-Host ""
                Write-Host "✅ Frontend URL: " -ForegroundColor Green -NoNewline
                Write-Host $urlMatch.Matches.Value -ForegroundColor Yellow
                $frontendUrlFound = $true
            }
        }
    }
    
    if ($backendUrlFound -and $frontendUrlFound) {
        break
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ✅ เริ่มต้นระบบแล้ว!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 ขั้นตอนต่อไป:" -ForegroundColor Yellow
Write-Host "   1. คัดลอก Backend URL และ Frontend URL ด้านบน" -ForegroundColor White
Write-Host "   2. สร้างไฟล์ .env ในโฟลเดอร์ root:" -ForegroundColor White
Write-Host "      VITE_API_URL=<Backend URL>" -ForegroundColor Gray
Write-Host "   3. Restart Frontend (กด Ctrl+C แล้วรัน npm run dev อีกครั้ง)" -ForegroundColor White
Write-Host "   4. แชร์ Frontend URL ให้คนอื่นใช้งาน" -ForegroundColor White
Write-Host "   5. ตั้งค่า LINE Webhook: <Backend URL>/webhook/line" -ForegroundColor White
Write-Host ""
Write-Host "💡 เคล็ดลับ:" -ForegroundColor Yellow
Write-Host "   - Tunnel ยังทำงานอยู่ใน background" -ForegroundColor White
Write-Host "   - ใช้ Get-Job และ Receive-Job เพื่อดู output เพิ่มเติม" -ForegroundColor White
Write-Host "   - ใช้ Stop-Job เพื่อหยุด tunnel" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  หมายเหตุ:" -ForegroundColor Yellow
Write-Host "   - URL จะเปลี่ยนทุกครั้งที่รัน tunnel ใหม่" -ForegroundColor White
Write-Host "   - ถ้าต้องการ URL คงที่: ใช้ Named Tunnel" -ForegroundColor White
Write-Host ""
Write-Host "กด Enter เพื่อดู output จาก Tunnel (หรือ Ctrl+C เพื่อออก)..." -ForegroundColor Cyan
Read-Host

# แสดง output ต่อเนื่อง
Write-Host ""
Write-Host "📊 Output จาก Tunnel (กด Ctrl+C เพื่อหยุด):" -ForegroundColor Yellow
Write-Host ""

while ($true) {
    $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
    $frontendOutput = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
    
    if ($backendOutput) {
        Write-Host "[Backend] " -ForegroundColor Cyan -NoNewline
        Write-Host $backendOutput
    }
    
    if ($frontendOutput) {
        Write-Host "[Frontend] " -ForegroundColor Magenta -NoNewline
        Write-Host $frontendOutput
    }
    
    Start-Sleep -Seconds 1
}

