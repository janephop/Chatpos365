# 🚀 Railway Deployment Guide

## 📋 ไฟล์ที่เตรียมไว้แล้ว

### ✅ ไฟล์ Config
- `railway.json` - Frontend service config
- `line-webhook/railway.json` - Backend service config
- `.railwayignore` - Files to exclude from deployment
- `.env.example` - Frontend environment variables template
- `line-webhook/.env.example` - Backend environment variables template

### ✅ Package.json Scripts
- Frontend: `npm run build` และ `npm run preview`
- Backend: `npm start`

---

## 🚀 ขั้นตอนการ Deploy (10 นาที)

### 1. เตรียม GitHub Repository

```bash
# ถ้ายังไม่ได้ push ขึ้น GitHub
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

### 3. Deploy Backend Service

1. คลิก **"New Project"**
2. เลือก **"Deploy from GitHub repo"**
3. เลือก Repository ของคุณ
4. **ตั้งค่า Root Directory:**
   - Settings → Root Directory → ใส่: `line-webhook`
5. **ตั้งค่า Environment Variables:**
   - Variables tab → เพิ่ม:
     ```
     PORT=3000
     LINE_CHANNEL_ACCESS_TOKEN=your_token_here
     LINE_CHANNEL_SECRET=your_secret_here
     NODE_ENV=production
     ```
6. **Generate Domain:**
   - Settings → Generate Domain
   - คัดลอก URL ไว้ (เช่น: `your-backend.railway.app`)

### 4. Deploy Frontend Service

1. ใน Project เดียวกัน คลิก **"New Service"**
2. เลือก Repository เดียวกัน
3. **ตั้งค่า Root Directory:**
   - Settings → Root Directory → ใส่: `/` (root)
4. **ตั้งค่า Build Command:**
   - Settings → Build Command → ใส่: `npm install && npm run build`
5. **ตั้งค่า Start Command:**
   - Settings → Start Command → ใส่: `npm run preview`
6. **ตั้งค่า Environment Variables:**
   - Variables tab → เพิ่ม:
     ```
     VITE_API_URL=https://your-backend.railway.app
     PORT=8085
     ```
   - ⚠️ **สำคัญ:** แทนที่ `your-backend.railway.app` ด้วย URL จริงจากขั้นตอนที่ 3
7. **Generate Domain:**
   - Settings → Generate Domain

### 5. ตั้งค่า LINE Webhook

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Channel → Messaging API tab
3. Webhook URL → ใส่: `https://your-backend.railway.app/webhook/line`
4. เปิด "Use webhook" → คลิก "Verify"

---

## 🔧 Environment Variables

### Backend Service (line-webhook)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (Railway sets automatically) |
| `LINE_CHANNEL_ACCESS_TOKEN` | **Yes** | LINE Channel Access Token |
| `LINE_CHANNEL_SECRET` | **Yes** | LINE Channel Secret |
| `NODE_ENV` | No | Set to `production` |

### Frontend Service (root)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend Railway URL (e.g., `https://your-backend.railway.app`) |
| `PORT` | No | Server port (Railway sets automatically) |

---

## 📁 Root Directory Settings

### Backend Service
- **Root Directory:** `line-webhook`
- **Build Command:** `npm install` (auto-detected)
- **Start Command:** `npm start` (auto-detected)

### Frontend Service
- **Root Directory:** `/` (root)
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run preview`

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
- **การใช้งาน 10-30 คน/วัน:**
  - Backend: ~$2-3/เดือน
  - Frontend: ~$1-2/เดือน
  - **รวม: ~$3-5/เดือน** ✅

---

## 🆘 แก้ปัญหา

### Backend ไม่ทำงาน
1. ตรวจสอบ Environment Variables ครบหรือไม่
2. ดู Logs ใน Railway Dashboard
3. ตรวจสอบ Root Directory ตั้งเป็น `line-webhook` หรือไม่

### Frontend ไม่เชื่อมต่อ Backend
1. ตรวจสอบ `VITE_API_URL` ใน Environment Variables
2. ตรวจสอบ URL ของ Backend ถูกต้อง (ต้องมี `https://`)
3. ตรวจสอบ CORS ใน Backend (ควรอนุญาต all origins)

### LINE Webhook ไม่ทำงาน
1. ตรวจสอบ Webhook URL ถูกต้อง
2. ตรวจสอบ `LINE_CHANNEL_ACCESS_TOKEN` และ `LINE_CHANNEL_SECRET`
3. ดู Logs ใน Railway Dashboard
4. ตรวจสอบว่าเปิด "Use webhook" ใน LINE Console แล้ว

---

## ✅ Checklist

- [ ] GitHub Repository สร้างแล้ว
- [ ] Railway Account สร้างแล้ว
- [ ] Backend Service Deploy แล้ว
- [ ] Frontend Service Deploy แล้ว
- [ ] Environment Variables ตั้งค่าแล้ว
- [ ] LINE Webhook ตั้งค่าแล้ว
- [ ] ทดสอบ Backend URL ทำงาน
- [ ] ทดสอบ Frontend URL ทำงาน
- [ ] ทดสอบ LINE Webhook ทำงาน

---

## 📝 หมายเหตุ

- Railway จะ restart service อัตโนมัติถ้า crash
- Database (SQLite) จะถูกเก็บใน Railway volume
- ไฟล์ uploads จะถูกเก็บใน Railway volume
- ถ้าใช้ credit หมด จะหยุดทำงาน (แต่ไม่คิดเงินเพิ่ม)
- ข้อมูลจะไม่หายถ้า service หยุด (เก็บใน volume)

---

## 🎉 เสร็จแล้ว!

ตอนนี้คุณมี:
- ✅ Backend ทำงานบน Railway
- ✅ Frontend ทำงานบน Railway
- ✅ LINE Webhook ตั้งค่าเรียบร้อย
- ✅ ระบบพร้อมใช้งาน!

