# 🌐 คู่มือตั้งค่า Public Hostname ใน Cloudflare Dashboard

## ❓ ปัญหา: ไม่เห็น Public Hostnames

เมื่อเข้าไปดู tunnel "line-chat" ใน Cloudflare Dashboard แต่ไม่เห็น Public Hostnames ให้ตั้งค่า

---

## ✅ วิธีแก้ไข: หาแท็บ Public Hostnames

### ⚠️ สำคัญ: ถ้าเห็นหน้า "Migrate line-chat"

**ถ้าคุณเห็นหน้า "Migrate line-chat" (มีปุ่ม "Start migration"):**
- **หน้านี้ไม่ใช่หน้า Public Hostnames!**
- **ต้องกลับไปที่หน้า Tunnel List ก่อน**

**วิธีทำ:**
1. **คลิก**: **"← Back to tunnels"** (ด้านบนซ้าย)
2. **หรือ**: **คลิกเมนูด้านซ้าย** → **"Tunnels"** หรือ **"Connectors"**
3. **กลับไปที่หน้า Tunnel List**

### ขั้นตอนที่ 1: ไปที่หน้า Tunnel Detail

1. เปิดเบราว์เซอร์
2. ไปที่: **https://one.dash.cloudflare.com/**
3. **Login** เข้าระบบ
4. **คลิกเมนูด้านซ้าย**: **"Zero Trust"**
5. **คลิก**: **"Networks"** (ในเมนูด้านซ้าย)
6. **คลิก**: **"Connectors"** หรือ **"Tunnels"** (ในเมนูด้านซ้าย)
7. **คลิก** ที่ tunnel **"line-chat"**

**⚠️ หมายเหตุ:** 
- **อย่าคลิก "Start migration"** (ไม่จำเป็นสำหรับการตั้งค่า Public Hostnames)
- **ต้องไปที่หน้า Tunnel Detail ธรรมดา** (ไม่ใช่หน้า Migration)

### ขั้นตอนที่ 2: หาแท็บ Public Hostnames

**ในหน้า Tunnel Detail จะมีแท็บหลายแท็บ:**

1. **มองหาที่ด้านบน** ของหน้า (ใต้ชื่อ tunnel "line-chat")
2. **จะเห็นแท็บต่างๆ เช่น:**
   - **"Overview"** (หรือ "Details")
   - **"Public Hostnames"** ← **นี่คือแท็บที่ต้องการ!**
   - **"Private Networks"** (ถ้ามี)
   - **"Routes"** (ถ้ามี)
   - **"Settings"** (ถ้ามี)

3. **คลิกแท็บ**: **"Public Hostnames"**

**ถ้าไม่เห็นแท็บ Public Hostnames:**

**วิธีที่ 1: ใช้เมนูด้านซ้าย**
1. **ดูเมนูด้านซ้าย** ในหน้า Tunnel Detail
2. **หาส่วน**: **"Public Hostnames"** หรือ **"Hostnames"**
3. **คลิก** เพื่อไปที่หน้า Public Hostnames

**วิธีที่ 2: ใช้ URL โดยตรง**
1. **Copy URL** จาก address bar (หน้า Tunnel Detail)
2. **เพิ่ม** `/public-hostnames` ต่อท้าย URL
3. **ตัวอย่าง:**
   ```
   https://one.dash.cloudflare.com/.../tunnels/line-chat/public-hostnames
   ```
4. **กด Enter** เพื่อไปที่หน้า Public Hostnames

**วิธีที่ 3: ใช้ปุ่ม "Configure"**
1. **ในหน้า Tunnel List** (ก่อนเข้า tunnel detail)
2. **คลิกขวา** ที่ tunnel "line-chat"
3. **เลือก**: **"Configure"** หรือ **"Manage"**
4. **หาส่วน**: **"Public Hostnames"**

---

## 📋 วิธีเพิ่ม Public Hostname

### ขั้นตอนที่ 1: ไปที่แท็บ Public Hostnames

1. **คลิกแท็บ**: **"Public Hostnames"**
2. จะเห็นรายการ hostname (ถ้ามี) หรือว่างเปล่า

### ขั้นตอนที่ 2: เพิ่ม Public Hostname สำหรับ Backend

1. **คลิกปุ่ม**: **"Add a public hostname"** หรือ **"Add hostname"** หรือ **"Create hostname"**
   - ปุ่มอาจจะเป็นสีฟ้า หรือสีเขียว
   - อาจจะอยู่ด้านบนขวา หรือกลางหน้า

2. **จะเห็นฟอร์มให้กรอก:**

   **Subdomain:**
   - พิมพ์: `line-chat-backend-12345`
     - เปลี่ยน `12345` เป็นตัวเลขที่ต้องการ (เช่น: `12345`, `99999`, `2024`)
     - หรือใช้ตัวอักษรก็ได้ (เช่น: `line-chat-backend-abc`)
     - **สำคัญ:** ต้องไม่มีช่องว่าง และใช้ตัวอักษร/ตัวเลข/ขีดกลาง (-) เท่านั้น
   
   **Domain:**
   - **คลิก dropdown** (ลูกศรลง)
   - **เลือก**: `trycloudflare.com`
     - ถ้าไม่เห็น ให้พิมพ์ `trycloudflare.com` ในช่อง
     - **สำคัญ:** ต้องเลือก `trycloudflare.com` (ไม่ใช่ domain อื่น)
   
   **Service:**
   - พิมพ์: `http://localhost:3000`
     - ต้องพิมพ์ให้ถูกต้อง: `http://localhost:3000` (ไม่ใช่ https)
     - **สำคัญ:** ต้องเป็น `localhost:3000` (ไม่ใช่ IP อื่น)

3. **คลิกปุ่ม**: **"Add hostname"** หรือ **"Save"** หรือ **"Create"**

4. **รอสักครู่** จนเห็น hostname แสดงในรายการ

5. **จด URL ที่ได้ไว้:**
   - จะเห็น URL แสดงในรายการ (เช่น: `https://line-chat-backend-12345.trycloudflare.com`)
   - **Copy URL นี้ไว้** (คลิกขวา → Copy หรือ Select แล้ว Ctrl+C)

### ขั้นตอนที่ 3: เพิ่ม Public Hostname สำหรับ Frontend

1. **คลิกปุ่ม**: **"Add a public hostname"** อีกครั้ง

2. **กรอกฟอร์ม:**

   **Subdomain:**
   - พิมพ์: `line-chat-frontend-12345`
     - ใช้ตัวเลขเดียวกันกับ Backend (เช่น: ถ้า Backend เป็น `12345` Frontend ก็เป็น `12345`)
   
   **Domain:**
   - **คลิก dropdown**
   - **เลือก**: `trycloudflare.com`
   
   **Service:**
   - พิมพ์: `http://localhost:8085`
     - ต้องพิมพ์ให้ถูกต้อง: `http://localhost:8085`

3. **คลิกปุ่ม**: **"Add hostname"** หรือ **"Save"**

4. **จด URL ที่ได้ไว้:**
   - จะเห็น URL แสดงในรายการ (เช่น: `https://line-chat-frontend-12345.trycloudflare.com`)
   - **Copy URL นี้ไว้**

---

## 🆘 ถ้ายังไม่เห็น Public Hostnames

### วิธีที่ 1: ตรวจสอบว่า Tunnel ทำงานอยู่

1. **กลับไปที่หน้า Tunnel List**
2. **ดู Status** ของ tunnel "line-chat"
3. **ต้องเป็น "Healthy"** หรือ **"Active"**
4. ถ้าเป็น "Inactive" หรือ "Unhealthy":
   - ต้องรัน tunnel ก่อน: `cloudflared.exe tunnel run line-chat --config cloudflare-tunnel-config.yml`

### วิธีที่ 2: ใช้เมนูด้านซ้าย

1. **ในหน้า Tunnel Detail**
2. **ดูเมนูด้านซ้าย** (ถ้ามี)
3. **หา**: **"Public Hostnames"** หรือ **"Hostnames"**
4. **คลิก** เพื่อไปที่หน้า Public Hostnames

### วิธีที่ 3: ใช้ URL โดยตรง

1. **Copy URL** จาก address bar
2. **เพิ่ม** `/public-hostnames` ต่อท้าย
3. **ตัวอย่าง:**
   ```
   https://one.dash.cloudflare.com/.../tunnels/line-chat/public-hostnames
   ```

### วิธีที่ 4: ใช้วิธีอื่น (ถ้ายังไม่เห็น)

**ลองวิธีนี้:**
1. **กลับไปที่หน้า Tunnel List**
2. **คลิกขวา** ที่ tunnel "line-chat"
3. **เลือก**: **"Manage"** หรือ **"Edit"** หรือ **"Configure"**
4. **หาส่วน**: **"Public Hostnames"** หรือ **"Hostnames"**

---

## 📸 ตัวอย่างหน้าจอ

### หน้า Tunnel Detail

```
┌─────────────────────────────────────────┐
│  ← Back to tunnels                      │
│                                         │
│  line-chat                              │
│                                         │
│  [Overview] [Public Hostnames] [Settings]  ← แท็บต่างๆ
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Public Hostnames               │   │
│  │                                 │   │
│  │  [Add a public hostname]  ← ปุ่มนี้│   │
│  │                                 │   │
│  │  (รายการ hostname จะแสดงที่นี่)    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] ไปที่หน้า Tunnel Detail
- [ ] หาแท็บ "Public Hostnames"
- [ ] คลิกแท็บ "Public Hostnames"
- [ ] คลิกปุ่ม "Add a public hostname"
- [ ] เพิ่ม Backend Hostname (localhost:3000)
- [ ] เพิ่ม Frontend Hostname (localhost:8085)
- [ ] จด URL ทั้ง 2 ไว้

---

## 🔗 ลิงก์ที่เกี่ยวข้อง

- **Cloudflare Zero Trust Dashboard**: https://one.dash.cloudflare.com/
- **Tunnels Page**: https://one.dash.cloudflare.com/ → Zero Trust → Networks → Tunnels

---

## 💡 เคล็ดลับ

1. **ถ้าไม่เห็นแท็บ:** ลองรีเฟรชหน้า (F5) หรือล็อกอินใหม่
2. **ถ้า Tunnel ไม่ทำงาน:** ต้องรัน tunnel ก่อนถึงจะเพิ่ม hostname ได้
3. **ถ้ายังไม่เห็น:** ลองใช้เบราว์เซอร์อื่น (Chrome, Edge, Firefox)

---

<div align="center">
✅ **หาแท็บ "Public Hostnames" แล้วเพิ่ม hostname ได้เลย!**
</div>

