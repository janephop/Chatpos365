# ⚡ Railway Quick Start (5 นาที)

## 🎯 สิ่งที่ต้องมี

1. ✅ GitHub Account
2. ✅ Railway Account (สร้างได้ที่ [railway.app](https://railway.app))
3. ✅ LINE Developer Account (สำหรับ Token)

---

## 🚀 3 ขั้นตอนง่ายๆ

### 1️⃣ Push โค้ดขึ้น GitHub (2 นาที)

```bash
git init
git add .
git commit -m "Ready for Railway"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2️⃣ Deploy บน Railway (2 นาที)

1. ไปที่ [railway.app](https://railway.app) → Login with GitHub
2. คลิก **"New Project"** → **"Deploy from GitHub repo"**
3. เลือก Repository ของคุณ

#### Deploy Backend:
- Settings → Root Directory → `line-webhook`
- Variables → เพิ่ม:
  ```
  LINE_CHANNEL_ACCESS_TOKEN=your_token
  LINE_CHANNEL_SECRET=your_secret
  ```
- Settings → Generate Domain → คัดลอก URL

#### Deploy Frontend:
- New Service → เลือก Repository เดียวกัน
- Settings → Root Directory → `/` (root)
- Settings → Build Command → `npm install && npm run build`
- Settings → Start Command → `npm run preview`
- Variables → เพิ่ม:
  ```
  VITE_API_URL=https://your-backend.railway.app
  ```
- Settings → Generate Domain

### 3️⃣ ตั้งค่า LINE Webhook (1 นาที)

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. Channel → Messaging API → Webhook URL
3. ใส่: `https://your-backend.railway.app/webhook/line`
4. เปิด "Use webhook" → Verify

---

## ✅ เสร็จแล้ว!

เปิด Frontend URL ที่ Railway ให้ → ระบบพร้อมใช้งาน! 🎉

---

## 📚 ดูรายละเอียดเพิ่มเติม

- คู่มือเต็ม: `RAILWAY_DEPLOY_README.md`
- คู่มือแบบง่าย: `RAILWAY_SIMPLE_GUIDE.md`

