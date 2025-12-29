# 🚀 Quick Setup: แชร์เว็บให้คนอื่นใช้งาน

## ✅ สถานะปัจจุบัน

คุณมี **Frontend URL** แล้ว:
```
https://frame-pays-undertake-auckland.trycloudflare.com
```

## 📝 ขั้นตอนต่อไป

### 1️⃣ ดู Backend URL

เปิด Terminal **"Cloudflare Tunnel Backend (3000)"** และดู URL ที่แสดง (เช่น `https://xxxx.trycloudflare.com`)

### 2️⃣ ตั้งค่า .env

**วิธีที่ 1: ใช้สคริปต์อัตโนมัติ**
```bash
.\SETUP_ENV.bat
```
แล้วกรอก Backend URL ที่ได้จาก Terminal

**วิธีที่ 2: สร้างเอง**
สร้างไฟล์ `.env` ในโฟลเดอร์ root:
```env
VITE_API_URL=https://xxxx.trycloudflare.com
```
(แทน `https://xxxx.trycloudflare.com` ด้วย Backend URL จริง)

### 3️⃣ Restart Frontend

1. ไปที่ Terminal **"Frontend Server (8085)"**
2. กด `Ctrl+C` เพื่อหยุด
3. รัน `npm run dev` อีกครั้ง

### 4️⃣ แชร์ Frontend URL

แชร์ URL นี้ให้คนอื่น:
```
https://frame-pays-undertake-auckland.trycloudflare.com
```

### 5️⃣ ตั้งค่า LINE Webhook (ถ้าต้องการ)

ใช้ Backend URL ที่ได้จาก Terminal:
```
https://xxxx.trycloudflare.com/webhook/line
```

---

## ⚠️ หมายเหตุ

- **URL จะเปลี่ยนทุกครั้งที่รัน tunnel ใหม่**
- ถ้าต้องการ URL คงที่: ใช้ Named Tunnel (ดู `CLOUDFLARE_TUNNEL_SETUP.md`)

---

## 🎯 สรุป

1. ✅ Frontend URL: `https://frame-pays-undertake-auckland.trycloudflare.com`
2. ⏳ ดู Backend URL จาก Terminal
3. ⏳ ตั้งค่า `.env` (ใช้ `.\SETUP_ENV.bat`)
4. ⏳ Restart Frontend
5. ⏳ แชร์ Frontend URL ให้คนอื่น

**เสร็จแล้ว!** 🎉

