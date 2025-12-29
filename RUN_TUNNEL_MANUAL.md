# 🚀 รัน Tunnel แบบ Manual (ไม่ต้องหยุด Service)

## ✅ วิธีแก้ไข: รัน Tunnel แบบ Manual Parallel

**ไม่ต้องหยุด Service!** รัน tunnel แบบ manual แยกไปเลย

---

## 📋 ขั้นตอน

### ขั้นตอนที่ 1: รัน Tunnel แบบ Manual

**เปิด Terminal ใหม่ (ไม่ต้องเป็น Admin):**

```powershell
cd "C:\Users\jay_rpn\Documents\Project Big\Project Pos Chat\line chat"
cloudflared.exe tunnel run line-chat --config cloudflare-tunnel-config.yml
```

**หรือถ้า cloudflared อยู่ใน PATH:**

```powershell
cd "C:\Users\jay_rpn\Documents\Project Big\Project Pos Chat\line chat"
cloudflared tunnel run line-chat --config cloudflare-tunnel-config.yml
```

**⚠️ ปล่อย Terminal นี้ไว้ (ไม่ต้องปิด)**

**สิ่งที่ควรเห็น:**
```
2025-12-20T... INF +--------------------------------------------------------------------------------------------+
2025-12-20T... INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
2025-12-20T... INF |  https://line-chat-backend-12345.trycloudflare.com                                        |
2025-12-20T... INF |  https://line-chat-frontend-12345.trycloudflare.com                                        |
2025-12-20T... INF +--------------------------------------------------------------------------------------------+
```

---

### ขั้นตอนที่ 2: เริ่ม Backend และ Frontend

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

### ขั้นตอนที่ 3: ทดสอบ URLs

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

## 🔍 ถ้าไม่พบ cloudflared.exe

**หาตำแหน่ง cloudflared:**

```powershell
Get-Command cloudflared -ErrorAction SilentlyContinue
```

**หรือ:**

```powershell
where.exe cloudflared
```

**แล้วใช้ path เต็ม:**

```powershell
"C:\path\to\cloudflared.exe" tunnel run line-chat --config cloudflare-tunnel-config.yml
```

---

## ✅ หลังจาก Tunnel แบบ Manual ทำงาน

**คุณจะเห็น:**
- ✅ Tunnel ทำงาน (Terminal แสดง logs)
- ✅ URLs ทำงานได้
- ✅ Backend และ Frontend เชื่อมต่อได้

---

<div align="center">
✅ **รัน Tunnel แบบ Manual โดยไม่ต้องหยุด Service!** 🚀

💡 **รัน tunnel แบบ manual แล้ว URLs จะทำงานทันที!**
</div>

