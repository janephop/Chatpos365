# 🚀 ใช้ Tunnel แบบ Manual (แก้ปัญหา DNS)

## ❌ ปัญหา

Error: `ERR_NAME_NOT_RESOLVED`
- Managed Service อาจจะไม่ใช้ config file
- Routes ยังไม่ได้ sync กับ DNS

---

## ✅ วิธีแก้ไข: ใช้ Tunnel แบบ Manual

### ขั้นตอนที่ 1: หยุด Managed Service

**ใน PowerShell แบบ Administrator:**

```powershell
Stop-Service Cloudflared
```

**หรือ:**
```powershell
Get-Service Cloudflared | Stop-Service
```

---

### ขั้นตอนที่ 2: รัน Tunnel แบบ Manual

**ใน PowerShell (Terminal ใหม่):**

```powershell
cd "C:\Users\jay_rpn\Documents\Project Big\Project Pos Chat\line chat"
cloudflared.exe tunnel run line-chat --config cloudflare-tunnel-config.yml
```

**สิ่งที่ควรเห็น:**
```
2025-12-20T... INF +--------------------------------------------------------------------------------------------+
2025-12-20T... INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
2025-12-20T... INF |  https://line-chat-backend-12345.trycloudflare.com                                        |
2025-12-20T... INF |  https://line-chat-frontend-12345.trycloudflare.com                                        |
2025-12-20T... INF +--------------------------------------------------------------------------------------------+
```

**⚠️ ปล่อย Terminal นี้ไว้ (ไม่ต้องปิด)**

---

### ขั้นตอนที่ 3: เริ่ม Backend และ Frontend

**Terminal ใหม่ (หรือใช้สคริปต์):**

```bash
START_SERVERS_ONLY.bat
```

**หรือรันเอง:**
```bash
# Terminal 1: Backend
cd line-webhook
npm start

# Terminal 2: Frontend
npm run dev
```

---

### ขั้นตอนที่ 4: ทดสอบ URLs

**หลังจากรัน tunnel แบบ manual แล้ว:**

1. **รอสักครู่** (10-30 วินาที)

2. **ทดสอบ Backend:**
   ```
   https://line-chat-backend-12345.trycloudflare.com
   ```

3. **ทดสอบ Frontend:**
   ```
   https://line-chat-frontend-12345.trycloudflare.com
   ```

---

## ✅ หลังจาก Tunnel แบบ Manual ทำงาน

**คุณจะเห็น:**
- ✅ Tunnel ทำงาน (Terminal แสดง logs)
- ✅ URLs ทำงานได้
- ✅ Backend และ Frontend เชื่อมต่อได้

---

## 💡 หมายเหตุ

**สำหรับ Tunnel แบบ Manual:**
- ✅ ใช้ config file ได้เลย
- ✅ Routes ทำงานทันที
- ⚠️ ต้องรัน Terminal ไว้ (ไม่ต้องปิด)

**ถ้าปิด Terminal:**
- Tunnel จะหยุดทำงาน
- URLs จะไม่ทำงาน

**วิธีแก้:**
- ใช้ Task Scheduler หรือ PM2 เพื่อรัน tunnel แบบ background
- หรือใช้ Managed Service (แต่ต้องตั้งค่าให้ใช้ config file)

---

<div align="center">
✅ **ใช้ Tunnel แบบ Manual เพื่อแก้ปัญหา DNS!** 🚀

💡 **รัน tunnel แบบ manual แล้ว URLs จะทำงานทันที!**
</div>

