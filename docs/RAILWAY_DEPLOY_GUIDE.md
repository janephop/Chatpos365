# 🚀 คู่มือ Deploy จาก PC ไป Railway และเชื่อมต่อ Storage

## 📋 สารบัญ
1. [เตรียมความพร้อม](#เตรียมความพร้อม)
2. [Deploy Backend ไป Railway](#deploy-backend-ไป-railway)
3. [Deploy Frontend ไป Railway](#deploy-frontend-ไป-railway)
4. [เชื่อมต่อกับ POS Storage](#เชื่อมต่อกับ-pos-storage)
5. [ตั้งค่า Environment Variables](#ตั้งค่า-environment-variables)
6. [ตรวจสอบการทำงาน](#ตรวจสอบการทำงาน)

---

## 🎯 เตรียมความพร้อม

### 1. สิ่งที่ต้องมี
- ✅ GitHub Account
- ✅ Railway Account (สมัครที่ https://railway.app)

- ✅ โค้ดโปรเจคพร้อมแล้ว
- ✅ ไฟล์ `products.sql` จาก POS (ถ้ามี)

### 2. เชื่อมต่อ GitHub กับ Railway
1. ไปที่ https://railway.app
2. คลิก "Login with GitHub"
3. Authorize Railway ให้เข้าถึง GitHub repositories

---

## 🔧 Deploy Backend ไป Railway

### ขั้นตอนที่ 1: สร้าง Backend Service

1. **ไปที่ Railway Dashboard**
   - คลิก "New Project"
   - เลือก "Deploy from GitHub repo"
   - เลือก repository: `janephop/Chatpos365`

2. **ตั้งค่า Service**
   - Service Name: `chatpos365-backend` (หรือชื่อที่ต้องการ)
   - Root Directory: `line-webhook`
   - Build Command: `npm install`
   - Start Command: `npm start`

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables

1. **ไปที่ Backend Service → Variables**
2. **เพิ่ม Variables ต่อไปนี้:**

```env
# LINE Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# Server Configuration
PORT=3000
NODE_ENV=production

# POS Database Path (เลือกวิธีใดวิธีหนึ่ง)
# วิธีที่ 1: ใช้ path ไปยังไฟล์ SQL
POS_DB_PATH=/app/line-webhook/data/products.sql

# วิธีที่ 2: ใช้ JSON (ถ้าไม่มีไฟล์ SQL)
# POS_PRODUCTS_JSON=[{"id":"1","name":"Product 1","price":100}]

# Railway URL (จะถูกตั้งค่าอัตโนมัติ)
RAILWAY_PUBLIC_DOMAIN=chatpos365-production.up.railway.app
```

3. **Save Variables**

### ขั้นตอนที่ 3: ตั้งค่า Build Settings

1. **ไปที่ Backend Service → Settings**
2. **ตั้งค่า:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Healthcheck Path:** `/` (root)

### ขั้นตอนที่ 4: ตั้งค่า Domain

1. **ไปที่ Backend Service → Settings → Networking**
2. **Generate Domain** (ถ้ายังไม่มี)
   - จะได้ URL เช่น: `https://chatpos365-production.up.railway.app`
3. **บันทึก URL นี้ไว้** (จะใช้สำหรับ Frontend)

---

## 🎨 Deploy Frontend ไป Railway

### ขั้นตอนที่ 1: สร้าง Frontend Service

1. **ใน Project เดียวกัน → Add Service**
2. **เลือก "Deploy from GitHub repo"**
3. **ตั้งค่า:**
   - Service Name: `chatpos365-frontend`
   - Root Directory: `/` (root)
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables

1. **ไปที่ Frontend Service → Variables**
2. **เพิ่ม Variable:**

```env
# Backend API URL
VITE_API_URL=https://chatpos365-production.up.railway.app
```

3. **Save Variables**

### ขั้นตอนที่ 3: ตั้งค่า Build Settings

1. **ไปที่ Frontend Service → Settings**
2. **ตั้งค่า:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run preview -- --host 0.0.0.0 --port $PORT`
   - **Output Directory:** `dist`

---

## 💾 เชื่อมต่อกับ POS Storage

### วิธีที่ 1: ใช้ Railway Volume (แนะนำ)

#### ขั้นตอนที่ 1: สร้าง Volume

1. **ไปที่ Backend Service → Settings → Volumes**
2. **คลิก "+ New Volume"**
3. **ตั้งค่า:**
   - **Mount Path:** `/app/line-webhook/data`
   - **Size:** 1GB (หรือตามต้องการ)
4. **Save**

#### ขั้นตอนที่ 2: อัปโหลดไฟล์ products.sql

1. **ไปที่ Backend Service → Settings → Volumes**
2. **คลิก Volume ที่สร้างไว้**
3. **อัปโหลดไฟล์ `products.sql`** ไปยัง `/app/line-webhook/data/products.sql`

**หรือใช้ Railway CLI:**

```bash
# ติดตั้ง Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Upload file
railway run --service chatpos365-backend -- sh -c "echo 'SQL content' > /app/line-webhook/data/products.sql"
```

### วิธีที่ 2: ใช้ Environment Variable (JSON)

#### ขั้นตอนที่ 1: Export Products เป็น JSON

1. **Export products จาก POS เป็น JSON**
2. **Format ตัวอย่าง:**
```json
[
  {
    "id": "1",
    "sku": "SKU001",
    "name": "Product 1",
    "price": 100,
    "stock": 50
  },
  {
    "id": "2",
    "sku": "SKU002",
    "name": "Product 2",
    "price": 200,
    "stock": 30
  }
]
```

#### ขั้นตอนที่ 2: ตั้งค่าใน Railway

1. **ไปที่ Backend Service → Variables**
2. **เพิ่ม Variable:**
   - **Key:** `POS_PRODUCTS_JSON`
   - **Value:** (วาง JSON content ที่ export มา)
3. **Save**

### วิธีที่ 3: วางไฟล์ใน Repository

#### ขั้นตอนที่ 1: วางไฟล์ใน Repository

1. **วางไฟล์ `products.sql`** ใน `line-webhook/data/products.sql`
2. **Commit และ Push:**

```bash
cd "c:\Users\jay_rpn\Documents\Project Big\Project Pos Chat\line chat"
git add line-webhook/data/products.sql
git commit -m "Add products.sql for POS connection"
git push origin main
```

#### ขั้นตอนที่ 2: Railway จะ Deploy อัตโนมัติ

- Railway จะ detect การเปลี่ยนแปลงและ deploy อัตโนมัติ
- ไฟล์จะถูก copy ไปยัง container

---

## ⚙️ ตั้งค่า Environment Variables

### Backend Service Variables

```env
# LINE Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here

# Server
PORT=3000
NODE_ENV=production

# POS Database (เลือกวิธีใดวิธีหนึ่ง)
POS_DB_PATH=/app/line-webhook/data/products.sql
# หรือ
# POS_PRODUCTS_JSON=[{"id":"1","name":"Product 1"}]

# Railway (อัตโนมัติ)
RAILWAY_PUBLIC_DOMAIN=chatpos365-production.up.railway.app
```

### Frontend Service Variables

```env
# Backend API URL
VITE_API_URL=https://chatpos365-production.up.railway.app
```

---

## ✅ ตรวจสอบการทำงาน

### 1. ตรวจสอบ Backend

1. **เปิด:** `https://chatpos365-production.up.railway.app/`
2. **ควรเห็น:**
```json
{
  "status": "ok",
  "message": "LINE Webhook Server is running",
  "endpoints": {
    "api": {
      "products": "/api/products"
    }
  }
}
```

### 2. ตรวจสอบ Products API

1. **เปิด:** `https://chatpos365-production.up.railway.app/api/products`
2. **ควรเห็น:**
```json
{
  "success": true,
  "products": [...],
  "count": 100,
  "source": "sql"
}
```

### 3. ตรวจสอบ Frontend

1. **เปิด Frontend URL** (จาก Railway)
2. **ตรวจสอบว่าเชื่อมต่อกับ Backend ได้**
3. **ทดสอบเปิดบิล ควรเห็น products**

---

## 🔍 Troubleshooting

### ปัญหา: Backend ไม่ตอบสนอง

**แก้ไข:**
1. ตรวจสอบว่า Backend Service ทำงานอยู่
2. ตรวจสอบ Logs ใน Railway Dashboard
3. ตรวจสอบ Environment Variables

### ปัญหา: ไม่พบ products.sql

**แก้ไข:**
1. ตรวจสอบว่า Volume ถูก mount ถูกต้อง
2. ตรวจสอบ path ใน `POS_DB_PATH`
3. ใช้ `POS_PRODUCTS_JSON` แทน

### ปัญหา: Frontend ไม่เชื่อมต่อกับ Backend

**แก้ไข:**
1. ตรวจสอบ `VITE_API_URL` ใน Frontend Variables
2. ตรวจสอบว่า Backend URL ถูกต้อง
3. ตรวจสอบ CORS settings

---

## 📝 สรุป

### Checklist

- [ ] Deploy Backend ไป Railway
- [ ] ตั้งค่า Environment Variables (LINE, PORT)
- [ ] ตั้งค่า POS Database (Volume หรือ JSON)
- [ ] Deploy Frontend ไป Railway
- [ ] ตั้งค่า `VITE_API_URL`
- [ ] ตรวจสอบการทำงาน

### วิธีที่แนะนำ

1. **ใช้ Railway Volume** สำหรับเก็บ `products.sql`
2. **ใช้ Environment Variables** สำหรับ configuration
3. **Monitor Logs** ใน Railway Dashboard

---

## 🆘 ต้องการความช่วยเหลือ?

- ตรวจสอบ Logs ใน Railway Dashboard
- ตรวจสอบ Environment Variables
- ตรวจสอบ Network settings

