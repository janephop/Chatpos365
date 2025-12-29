# 🔧 แก้ปัญหา: Domain name cannot be resolved

## ❌ ปัญหา

Error: "A domain name that can't be resolved or an incorrect parameter or value may have been specified"

**สาเหตุ:**
- Hostname ใน config file ยังไม่ได้ถูกสร้างใน Dashboard
- หรือ DNS ยังไม่ resolve

---

## ✅ วิธีแก้ไข

### วิธีที่ 1: ตรวจสอบว่า Routes ถูกสร้างใน Dashboard แล้ว

**ตรวจสอบ:**
1. **ไปที่หน้า Hostname routes:**
   - ไปที่: https://one.dash.cloudflare.com/
   - Networks → Connectors → คลิก tunnel "line-chat"
   - ไปที่แท็บ "Hostname routes"

2. **ตรวจสอบว่ามี routes ครบ 2 ตัว:**
   - ✅ Backend: `line-chat-backend-12345.trycloudflare.com`
   - ✅ Frontend: `line-chat-frontend-12345.trycloudflare.com`

**ถ้ายังไม่มี:**
- ต้องสร้าง routes ใน Dashboard ก่อน

---

### วิธีที่ 2: ใช้ Quick Tunnel แทน (ชั่วคราว)

**ถ้า routes ยังไม่ทำงาน:**

**รัน Quick Tunnel สำหรับ Backend:**
```powershell
cloudflared.exe tunnel --url http://localhost:3000
```

**รัน Quick Tunnel สำหรับ Frontend (Terminal ใหม่):**
```powershell
cloudflared.exe tunnel --url http://localhost:8085
```

**จะได้ URLs ชั่วคราว:**
- Backend: `https://xxxx.trycloudflare.com`
- Frontend: `https://yyyy.trycloudflare.com`

**หมายเหตุ:** URLs จะเปลี่ยนทุกครั้งที่รันใหม่

---

### วิธีที่ 3: ตรวจสอบ Config File

**ตรวจสอบว่า hostname ถูกต้อง:**

```yaml
ingress:
  - hostname: line-chat-backend-12345.trycloudflare.com
    service: http://localhost:3000
  - hostname: line-chat-frontend-12345.trycloudflare.com
    service: http://localhost:8085
```

**ตรวจสอบ:**
- ✅ Hostname มี `.trycloudflare.com` ครบถ้วน
- ✅ Service URL ถูกต้อง (`http://localhost:3000`, `http://localhost:8085`)

---

### วิธีที่ 4: รอ DNS Propagation

**ถ้า routes ถูกสร้างใน Dashboard แล้ว:**
- รอ 1-2 นาที
- ลองรัน tunnel อีกครั้ง

---

## 🔍 ตรวจสอบ

### 1. ตรวจสอบ Routes ใน Dashboard

**ไปที่หน้า Hostname routes:**
- ตรวจสอบว่ามี routes ครบ 2 ตัว
- ตรวจสอบว่า hostname ตรงกับ config file

---

### 2. ทดสอบ localhost ก่อน

**ทดสอบ Backend:**
```
http://localhost:3000
```

**ทดสอบ Frontend:**
```
http://localhost:8085
```

**ถ้า localhost ทำงาน = Backend/Frontend ทำงานแล้ว**
**ถ้า localhost ไม่ทำงาน = ต้องเริ่ม Backend/Frontend ก่อน**

---

## 💡 วิธีแก้ไขที่แนะนำ

### ใช้ Quick Tunnel (ชั่วคราว)

**ถ้า routes ยังไม่ทำงาน:**

1. **รัน Quick Tunnel สำหรับ Backend:**
   ```powershell
   cloudflared.exe tunnel --url http://localhost:3000
   ```

2. **รัน Quick Tunnel สำหรับ Frontend (Terminal ใหม่):**
   ```powershell
   cloudflared.exe tunnel --url http://localhost:8085
   ```

3. **ใช้ URLs ที่ได้:**
   - Backend: `https://xxxx.trycloudflare.com`
   - Frontend: `https://yyyy.trycloudflare.com`

4. **ตั้งค่า LINE Webhook:**
   - URL: `https://xxxx.trycloudflare.com/webhook/line`

---

<div align="center">
✅ **ลองใช้ Quick Tunnel ชั่วคราว หรือตรวจสอบ Routes ใน Dashboard!** 🚀
</div>

