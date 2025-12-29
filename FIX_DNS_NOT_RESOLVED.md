# 🔧 แก้ปัญหา: DNS ไม่ resolve (ERR_NAME_NOT_RESOLVED)

## ❌ ปัญหา

Error: `ERR_NAME_NOT_RESOLVED`
- `line-chat-backend-12345.trycloudflare.com` ไม่สามารถ resolve ได้

---

## ✅ วิธีแก้ไข

### ปัญหาที่ 1: Service ยังไม่ได้อ่าน Config

**สำหรับ Managed Tunnel (Service):**
- Service อาจจะไม่ได้อ่าน config จากไฟล์
- ต้องตั้งค่า Service ให้ใช้ config file

**ตรวจสอบ:**
1. Service ทำงานอยู่หรือไม่
2. Service ใช้ config file หรือไม่

---

### ปัญหาที่ 2: Routes ยังไม่ได้ Sync กับ DNS

**สำหรับ Managed Tunnel:**
- Routes ที่สร้างใน Dashboard อาจจะยังไม่ได้ sync กับ DNS
- ต้องรอสักครู่ (DNS propagation)

**ตรวจสอบ:**
1. Routes ถูกสร้างใน Dashboard แล้วหรือไม่
2. รอ 1-2 นาที แล้วลองอีกครั้ง

---

### ปัญหาที่ 3: ต้องใช้ Tunnel แบบ Manual

**สำหรับ Managed Tunnel:**
- Service อาจจะไม่ใช้ config file
- ต้องรัน tunnel แบบ manual

**แก้ไข:**
1. **หยุด Service:**
   ```powershell
   Stop-Service Cloudflared
   ```

2. **รัน Tunnel แบบ Manual:**
   ```powershell
   cd "C:\Users\jay_rpn\Documents\Project Big\Project Pos Chat\line chat"
   cloudflared.exe tunnel run line-chat --config cloudflare-tunnel-config.yml
   ```

3. **เริ่ม Backend และ Frontend:**
   ```bash
   START_SERVERS_ONLY.bat
   ```

---

## 🔍 ตรวจสอบ

### 1. ตรวจสอบ Service

```powershell
Get-Service Cloudflared
```

**ควรเห็น:**
- Status = Running

---

### 2. ตรวจสอบ Backend

```powershell
Get-NetTCPConnection -LocalPort 3000
```

**ควรเห็น:**
- Port 3000 = LISTENING

---

### 3. ทดสอบ localhost ก่อน

**ทดสอบ Backend:**
```
http://localhost:3000
```

**ถ้า localhost ทำงาน = Backend ทำงานแล้ว**
**ถ้า localhost ไม่ทำงาน = ต้องเริ่ม Backend ก่อน**

---

## 💡 วิธีแก้ไขที่แนะนำ

### วิธีที่ 1: ใช้ Tunnel แบบ Manual (แนะนำ)

**สำหรับ Managed Tunnel ที่ยังไม่ sync:**

1. **หยุด Service:**
   ```powershell
   Stop-Service Cloudflared
   ```

2. **รัน Tunnel แบบ Manual:**
   ```powershell
   cloudflared.exe tunnel run line-chat --config cloudflare-tunnel-config.yml
   ```

3. **เริ่ม Backend และ Frontend:**
   ```bash
   START_SERVERS_ONLY.bat
   ```

---

### วิธีที่ 2: รอ DNS Propagation

**ถ้า Routes ถูกสร้างใน Dashboard แล้ว:**
- รอ 1-2 นาที
- ลองอีกครั้ง

---

<div align="center">
✅ **ลองใช้ Tunnel แบบ Manual หรือรอ DNS Propagation!** 🚀
</div>

