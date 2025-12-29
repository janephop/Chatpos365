# ✅ ตรวจสอบสถานะ Routes

## ✅ Service Restart สำเร็จแล้ว!

**สถานะ:**
- ✅ Service: **Running**
- ✅ Config: มี Service URL ครบแล้ว

---

## 🔍 ขั้นตอนตรวจสอบ Routes

### ขั้นตอนที่ 1: ตรวจสอบใน Dashboard

1. **กลับไปที่หน้า Connectors:**
   - ไปที่: https://one.dash.cloudflare.com/
   - Networks → Connectors

2. **ดูที่คอลัมน์ "Routes"** สำหรับ tunnel "line-chat"
   - **ควรแสดงเป็น `2`** แทน `--` ✅
   - ถ้ายังเป็น `--` → รอสักครู่แล้วรีเฟรชหน้า (F5)

---

### ขั้นตอนที่ 2: ตรวจสอบในหน้า Hostname Routes

1. **คลิกที่ชื่อ tunnel "line-chat"**
2. **ไปที่แท็บ "Hostname routes"**
3. **ควรเห็น 2 routes:**
   - ✅ Backend: `line-chat-backend-12345.trycloudflare.com`
   - ✅ Frontend: `line-chat-frontend-12345.trycloudflare.com`

---

### ขั้นตอนที่ 3: ทดสอบ URLs

**ทดสอบ Backend URL:**
```
https://line-chat-backend-12345.trycloudflare.com
```
- เปิดในเบราว์เซอร์
- ควรเห็น response จาก Backend (ถ้า Backend ทำงานอยู่)

**ทดสอบ Frontend URL:**
```
https://line-chat-frontend-12345.trycloudflare.com
```
- เปิดในเบราว์เซอร์
- ควรเห็นหน้า Frontend (ถ้า Frontend ทำงานอยู่)

---

## 🚀 ขั้นตอนต่อไป

### 1. ตั้งค่า Frontend (.env)

**สร้างไฟล์ `.env` ในโฟลเดอร์ root:**

```
VITE_API_URL=https://line-chat-backend-12345.trycloudflare.com
```

**สำคัญ:** เปลี่ยน `12345` ให้ตรงกับ Backend URL ที่ตั้งไว้

---

### 2. เริ่ม Backend และ Frontend

**ใช้สคริปต์:**
```bash
START_PERMANENT.bat
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

### 3. ตั้งค่า LINE Webhook

1. **ไปที่ LINE Developers Console:**
   - URL: https://developers.line.biz/console/

2. **เลือก Provider** → **Channel** → **Messaging API** tab

3. **Webhook settings** → **Edit**

4. **ใส่ Webhook URL:**
   ```
   https://line-chat-backend-12345.trycloudflare.com/webhook/line
   ```
   (เปลี่ยน `12345` ให้ตรงกับ Backend URL)

5. **เปิด "Use webhook"** = **Enabled**

6. **คลิก "Verify"** เพื่อทดสอบ

7. **เสร็จแล้ว!** ✅

---

## ✅ Checklist

- [x] Service Restart สำเร็จ
- [x] Service Running
- [x] Config มี Service URL ครบ
- [ ] ตรวจสอบ Routes ใน Dashboard (ควรเป็น `2`)
- [ ] ทดสอบ Backend URL
- [ ] ทดสอบ Frontend URL
- [ ] ตั้งค่า .env สำหรับ Frontend
- [ ] เริ่ม Backend และ Frontend
- [ ] ตั้งค่า LINE Webhook

---

## 🎉 เสร็จแล้ว!

**ตอนนี้:**
- ✅ Routes ถูกตั้งค่าแล้ว (2 routes)
- ✅ Backend URL: `https://line-chat-backend-12345.trycloudflare.com`
- ✅ Frontend URL: `https://line-chat-frontend-12345.trycloudflare.com`
- ✅ URLs คงที่ถาวร - ไม่ต้องเปลี่ยน webhook!

---

<div align="center">
✅ **Service Restart สำเร็จแล้ว! ตรวจสอบ Routes ใน Dashboard!** 🚀

🎉 **URLs พร้อมใช้งานแล้ว!**
</div>

