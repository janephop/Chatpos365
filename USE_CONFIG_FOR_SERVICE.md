# ✅ ใช้ไฟล์ Config สำหรับ Service URL

## ❌ ปัญหา

หลังจากสร้าง Hostname Route แล้ว:
- ✅ Route ถูกสร้างแล้ว (มีใน Dashboard)
- ❌ ไม่มีช่อง Service URL ในฟอร์ม
- ❌ หน้า "Edit hostname route" ก็ไม่มีช่อง Service URL

---

## ✅ วิธีแก้ไข: ใช้ไฟล์ Config

**สำหรับ Managed Tunnel (Service):**
- Service URL ต้องตั้งค่าในไฟล์ config
- Dashboard ใช้สำหรับสร้าง hostname เท่านั้น
- Tunnel จะอ่าน Service URL จากไฟล์ config อัตโนมัติ

---

## 📋 ขั้นตอน

### ขั้นตอนที่ 1: ตรวจสอบไฟล์ Config

**ไฟล์ `cloudflare-tunnel-config.yml` ควรมี:**

```yaml
tunnel: ea4f26bd-8e88-4941-bc4d-2bf4a47e3abd
credentials-file: C:\Users\jay_rpn\.cloudflared\ea4f26bd-8e88-4941-bc4d-2bf4a47e3abd.json

ingress:
  # Backend (port 3000)
  - hostname: line-chat-backend-12345.trycloudflare.com
    service: http://localhost:3000
  # Frontend (port 8085)
  - hostname: line-chat-frontend-12345.trycloudflare.com
    service: http://localhost:8085
  # Catch-all (ต้องมีเสมอ)
  - service: http_status:404
```

**ตรวจสอบว่า:**
- ✅ มี Backend hostname + service
- ✅ มี Frontend hostname + service
- ✅ Hostname ตรงกับที่สร้างใน Dashboard

---

### ขั้นตอนที่ 2: Restart Service

**เพื่อให้ Service อ่าน config ใหม่:**

**ใน PowerShell แบบ Administrator:**
```powershell
Restart-Service Cloudflared
```

**หรือ:**
```powershell
Stop-Service Cloudflared
Start-Service Cloudflared
```

---

### ขั้นตอนที่ 3: ตรวจสอบว่า Service ทำงาน

**ตรวจสอบสถานะ:**
```powershell
Get-Service Cloudflared
```

**ควรเห็น:**
- Status: **Running** ✅

---

## ✅ หลังจาก Restart Service แล้ว

**Tunnel จะ:**
- ✅ อ่าน config จากไฟล์ `cloudflare-tunnel-config.yml`
- ✅ ใช้ Service URL จากไฟล์ config
- ✅ Routes จะทำงานอัตโนมัติ

**ตรวจสอบ:**
1. **กลับไปที่หน้า Connectors**
2. **ดูที่คอลัมน์ "Routes"** สำหรับ tunnel "line-chat"
   - อาจแสดงเป็น `2` (ถ้า config sync แล้ว)
   - หรือยังเป็น `--` (ถ้ายังไม่ได้ sync)

---

## 🔍 ถ้า Routes ยังไม่ทำงาน

### ตรวจสอบว่า Service ใช้ config ถูกต้อง

**ตรวจสอบว่า Service รู้จัก config file:**

1. **ดูที่ Service configuration** (ถ้ามี)
2. **หรือตรวจสอบว่า** Service ใช้ config จากไฟล์ `cloudflare-tunnel-config.yml`

**สำหรับ Managed Tunnel:**
- Service อาจจะต้องตั้งค่า config path
- หรือใช้ config จาก Dashboard แทน

---

## 💡 หมายเหตุ

**สำหรับ Managed Tunnel (Service):**
- Dashboard = สร้าง hostname routes
- Config file = ตั้งค่า Service URL
- Service จะอ่านจาก config file

**ถ้า Dashboard ไม่มีช่อง Service URL:**
- ใช้ไฟล์ config แทน
- Service จะอ่าน Service URL จากไฟล์ config อัตโนมัติ

---

<div align="center">
✅ **ใช้ไฟล์ Config สำหรับ Service URL แล้ว Restart Service!** 🚀

💡 **Dashboard = Hostname | Config = Service URL**
</div>

