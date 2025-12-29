# 🚀 คู่มือ Deploy บน Railway (ฟรี)

## ✅ สิ่งที่ทำได้แน่นอน

- ✅ เปิดเซิร์ฟเวอร์ POS (Backend)
- ✅ เปิดเซิร์ฟเวอร์ Chat (Frontend)
- ✅ วางระบบเว็บไซต์ทั้งหมด
- ✅ ฟรี $5/เดือน (พอใช้สำหรับทดลอง)

---

## 📋 ขั้นตอนการ Deploy

### 1. เตรียม GitHub Repository

1. สร้าง Repository ใหม่บน GitHub
2. Push โค้ดทั้งหมดขึ้น GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. สร้างบัญชี Railway

1. ไปที่ [railway.app](https://railway.app)
2. คลิก **"Login"** → เลือก **"Login with GitHub"**
3. อนุญาต Railway เข้าถึง GitHub

### 3. Deploy Backend (POS + Chat Server)

1. ใน Railway Dashboard คลิก **"New Project"**
2. เลือก **"Deploy from GitHub repo"**
3. เลือก Repository ของคุณ
4. Railway จะ detect โค้ดอัตโนมัติ
5. **ตั้งค่า Root Directory:**
   - ไปที่ Settings → Root Directory
   - ตั้งค่าเป็น: `line-webhook`
6. **ตั้งค่า Environment Variables:**
   - ไปที่ Variables tab
   - เพิ่มตัวแปรต่อไปนี้:

```
PORT=3000
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
NODE_ENV=production
```

7. **ตั้งค่า Public Domain:**
   - ไปที่ Settings → Generate Domain
   - Railway จะให้ URL เช่น: `your-backend.railway.app`
   - **คัดลอก URL นี้ไว้** (จะใช้สำหรับ Frontend)

### 4. Deploy Frontend (React App)

1. ใน Project เดียวกัน คลิก **"New Service"**
2. เลือก **"Deploy from GitHub repo"**
3. เลือก Repository เดียวกัน
4. **ตั้งค่า Root Directory:**
   - ไปที่ Settings → Root Directory
   - ตั้งค่าเป็น: `/` (root)
5. **ตั้งค่า Build Command:**
   - ไปที่ Settings → Build Command
   - ตั้งค่าเป็น: `npm install && npm run build`
6. **ตั้งค่า Start Command:**
   - ไปที่ Settings → Start Command
   - ตั้งค่าเป็น: `npm run preview`
7. **ตั้งค่า Environment Variables:**
   - ไปที่ Variables tab
   - เพิ่มตัวแปร:

```
VITE_API_URL=https://your-backend.railway.app
PORT=8085
```

   ⚠️ **สำคัญ:** แทนที่ `your-backend.railway.app` ด้วย URL จริงของ Backend ที่ได้จากขั้นตอนที่ 3

8. **ตั้งค่า Public Domain:**
   - ไปที่ Settings → Generate Domain
   - Railway จะให้ URL เช่น: `your-frontend.railway.app`

---

## 🔧 ตั้งค่า LINE Webhook

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Channel ของคุณ
3. ไปที่ **"Messaging API"** tab
4. ในส่วน **"Webhook URL"** ใส่:
   ```
   https://your-backend.railway.app/webhook/line
   ```
5. เปิด **"Use webhook"**
6. คลิก **"Verify"** เพื่อทดสอบ

---

## ✅ ตรวจสอบการทำงาน

### Backend
- เปิด: `https://your-backend.railway.app/api/health` (ถ้ามี)
- ควรเห็น response 200 OK

### Frontend
- เปิด: `https://your-frontend.railway.app`
- ควรเห็นหน้าเว็บทำงานปกติ

---

## 🔄 อัปเดตโค้ด

เมื่อแก้ไขโค้ด:

1. Push ขึ้น GitHub:
```bash
git add .
git commit -m "Update code"
git push
```

2. Railway จะ Deploy อัตโนมัติภายใน 1-2 นาที

---

## 💰 ราคา

- **ฟรี:** $5 credit/เดือน
- **พอใช้สำหรับ:**
  - Backend: ~$2-3/เดือน
  - Frontend: ~$1-2/เดือน
  - เหลือ credit สำหรับทดลอง

---

## 🆘 แก้ปัญหา

### Backend ไม่ทำงาน
1. ตรวจสอบ Environment Variables ครบหรือไม่
2. ดู Logs ใน Railway Dashboard
3. ตรวจสอบ PORT ถูกต้องหรือไม่

### Frontend ไม่เชื่อมต่อ Backend
1. ตรวจสอบ `VITE_API_URL` ใน Environment Variables
2. ตรวจสอบ CORS ใน Backend
3. ตรวจสอบ URL ของ Backend ถูกต้อง

### LINE Webhook ไม่ทำงาน
1. ตรวจสอบ Webhook URL ถูกต้อง
2. ตรวจสอบ LINE_CHANNEL_ACCESS_TOKEN และ LINE_CHANNEL_SECRET
3. ดู Logs ใน Railway Dashboard

---

## 📝 หมายเหตุ

- Railway จะ restart service อัตโนมัติถ้า crash
- Database (SQLite) จะถูกเก็บใน Railway volume
- ไฟล์ uploads จะถูกเก็บใน Railway volume
- ถ้าใช้ credit หมด จะหยุดทำงาน (แต่ไม่คิดเงินเพิ่ม)

---

## 🎉 เสร็จสิ้น!

ตอนนี้คุณมี:
- ✅ Backend ทำงานบน Railway
- ✅ Frontend ทำงานบน Railway
- ✅ LINE Webhook ตั้งค่าเรียบร้อย
- ✅ ระบบ POS + Chat พร้อมใช้งาน!

---

**คำถาม?** ดู Logs ใน Railway Dashboard หรือตรวจสอบ Environment Variables

