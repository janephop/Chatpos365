# 🔍 ตรวจสอบสถานะระบบ

## 📋 สรุปสถานะ

### Backend (port 3000)
- **สถานะ:** ตรวจสอบ...
- **URL:** `http://localhost:3000`

### Frontend (port 8085)
- **สถานะ:** ตรวจสอบ...
- **URL:** `http://localhost:8085`

### Cloudflare Tunnel
- **Service:** ตรวจสอบ...
- **Manual Tunnel:** ตรวจสอบ...

---

## ✅ วิธีตรวจสอบ

### 1. ตรวจสอบ Backend

**ทดสอบ localhost:**
```
http://localhost:3000
```

**ถ้าเห็น response = Backend ทำงาน** ✅

---

### 2. ตรวจสอบ Frontend

**ทดสอบ localhost:**
```
http://localhost:8085
```

**ถ้าเห็นหน้า Frontend = Frontend ทำงาน** ✅

---

### 3. ตรวจสอบ Tunnel

**ถ้าใช้ Quick Tunnel:**
- ดูที่ Terminal ที่รัน tunnel
- ควรเห็น URL (เช่น `https://xxxx.trycloudflare.com`)

**ถ้าใช้ Managed Service:**
- ตรวจสอบ Service: `Get-Service Cloudflared`
- ควรเห็น Status = Running

---

## 🚀 ขั้นตอนต่อไป

### ถ้า Backend/Frontend ไม่ทำงาน:

**เริ่มใหม่:**
```bash
START_SERVERS_ONLY.bat
```

---

### ถ้า Tunnel ไม่ทำงาน:

**ใช้ Quick Tunnel:**
```powershell
# Terminal 1: Backend
cloudflared.exe tunnel --url http://localhost:3000

# Terminal 2: Frontend
cloudflared.exe tunnel --url http://localhost:8085
```

---

<div align="center">
🔍 **กำลังตรวจสอบสถานะระบบ...** ⏳
</div>

