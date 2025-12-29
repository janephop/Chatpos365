# 🌐 คู่มือตั้งค่า Cloudflare Tunnel (URL คงที่, ไม่ต้องเปลี่ยน Webhook)

## 📋 ภาพรวม

Cloudflare Tunnel เป็นวิธีที่ดีที่สุดสำหรับการทดสอบระบบ เพราะ:
- ✅ **ฟรี 100%**
- ✅ **URL คงที่** (ไม่ต้องเปลี่ยน webhook บ่อย)
- ✅ **HTTPS อัตโนมัติ**
- ✅ **ไม่ต้อง Static IP**
- ✅ **ไม่ต้อง Forward Port**
- ✅ **ใช้กับ LINE OA ได้**

---

## 🚀 วิธีที่ 1: Quick Tunnel (ง่ายที่สุด - สำหรับทดสอบเร็ว)

### ขั้นตอน

#### 1. ดาวน์โหลด Cloudflare Tunnel
```bash
# ไปที่: https://github.com/cloudflare/cloudflared/releases
# ดาวน์โหลด cloudflared-windows-amd64.exe
# เปลี่ยนชื่อเป็น cloudflared.exe
# วางไว้ในโฟลเดอร์โปรเจกต์ (root)
```

#### 2. รัน Backend และ Frontend
```bash
# Terminal 1: Backend
cd line-webhook
npm start

# Terminal 2: Frontend
npm run dev
```

#### 3. เปิด Tunnel สำหรับ Backend (port 3000)
```bash
.\cloudflared.exe tunnel --url http://localhost:3000
```
- จะได้ URL เช่น: `https://xxxx.trycloudflare.com`
- **หมายเหตุ:** URL นี้จะเปลี่ยนทุกครั้งที่รันใหม่ (แต่ใช้ได้ตลอดจนกว่าจะปิด)

#### 4. เปิด Tunnel สำหรับ Frontend (port 8085)
```bash
# เปิด Terminal ใหม่
.\cloudflared.exe tunnel --url http://localhost:8085
```
- จะได้ URL เช่น: `https://yyyy.trycloudflare.com`

#### 5. ตั้งค่า Frontend ให้ใช้ Backend URL
สร้างไฟล์ `.env` ในโฟลเดอร์ root:
```env
VITE_API_URL=https://xxxx.trycloudflare.com
```

#### 6. Restart Frontend
```bash
# กด Ctrl+C เพื่อหยุด Frontend
npm run dev
```

#### 7. ตั้งค่า LINE Webhook
- ใช้ Backend URL: `https://xxxx.trycloudflare.com/webhook/line`
- **หมายเหตุ:** URL นี้จะใช้ได้จนกว่าจะปิด tunnel

---

## 🎯 วิธีที่ 2: Named Tunnel (URL คงที่ถาวร - แนะนำ)

### ขั้นตอน

#### 1. สร้าง Cloudflare Account (ฟรี)
- ไปที่: https://dash.cloudflare.com/sign-up
- สร้างบัญชีฟรี (ไม่ต้องใส่บัตรเครดิต)

#### 2. ดาวน์โหลด Cloudflare Tunnel
```bash
# ไปที่: https://github.com/cloudflare/cloudflared/releases
# ดาวน์โหลด cloudflared-windows-amd64.exe
# เปลี่ยนชื่อเป็น cloudflared.exe
# วางไว้ในโฟลเดอร์โปรเจกต์ (root)
```

#### 3. Login เข้า Cloudflare
```bash
.\cloudflared.exe tunnel login
```
- จะเปิดเบราว์เซอร์ให้ login
- เลือก domain (ถ้ามี) หรือข้ามไปได้

#### 4. สร้าง Tunnel
```bash
.\cloudflared.exe tunnel create line-chat
```
- จะได้ Tunnel ID (เก็บไว้)

#### 5. สร้างไฟล์ Config
สร้างไฟล์ `cloudflare-tunnel-config.yml` ในโฟลเดอร์ root:

```yaml
tunnel: <TUNNEL_ID>  # ใส่ Tunnel ID ที่ได้จากขั้นตอนที่ 4
credentials-file: C:\Users\jay_rpn\Documents\Project Big\Project Pos Chat\line chat\.cloudflared\<TUNNEL_ID>.json

ingress:
  # Frontend (port 8085)
  - hostname: line-chat-frontend.yourdomain.com
    service: http://localhost:8085
  # Backend (port 3000)
  - hostname: line-chat-backend.yourdomain.com
    service: http://localhost:3000
  # Catch-all
  - service: http_status:404
```

**หมายเหตุ:** 
- ถ้าไม่มี domain สามารถใช้ subdomain จาก Cloudflare ได้ (เช่น `line-chat-frontend-xxxxx.trycloudflare.com`)
- หรือใช้วิธี Quick Tunnel แทน

#### 6. รัน Tunnel
```bash
.\cloudflared.exe tunnel run line-chat --config cloudflare-tunnel-config.yml
```

#### 7. ตั้งค่า Frontend
สร้างไฟล์ `.env` ในโฟลเดอร์ root:
```env
VITE_API_URL=https://line-chat-backend.yourdomain.com
```

#### 8. Restart Frontend
```bash
# กด Ctrl+C เพื่อหยุด Frontend
npm run dev
```

#### 9. ตั้งค่า LINE Webhook
- ใช้ Backend URL: `https://line-chat-backend.yourdomain.com/webhook/line`
- **URL นี้จะคงที่ถาวร!**

---

## 🎁 วิธีที่ 3: ใช้ TryCloudflare Subdomain (ฟรี, URL คงที่)

### ขั้นตอน

#### 1. สร้าง Cloudflare Account (ฟรี)
- ไปที่: https://dash.cloudflare.com/sign-up

#### 2. Login และสร้าง Tunnel
```bash
.\cloudflared.exe tunnel login
.\cloudflared.exe tunnel create line-chat
```

#### 3. สร้างไฟล์ Config (ใช้ trycloudflare.com)
สร้างไฟล์ `cloudflare-tunnel-config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: .cloudflared\<TUNNEL_ID>.json

ingress:
  # Frontend
  - hostname: line-chat-frontend-xxxxx.trycloudflare.com
    service: http://localhost:8085
  # Backend
  - hostname: line-chat-backend-xxxxx.trycloudflare.com
    service: http://localhost:3000
  # Catch-all
  - service: http_status:404
```

#### 4. ตั้งค่า Route (ใน Cloudflare Dashboard)
- ไปที่: Zero Trust → Networks → Tunnels
- เลือก tunnel ที่สร้าง
- เพิ่ม Public Hostname:
  - Frontend: `line-chat-frontend-xxxxx.trycloudflare.com` → `http://localhost:8085`
  - Backend: `line-chat-backend-xxxxx.trycloudflare.com` → `http://localhost:3000`

#### 5. รัน Tunnel
```bash
.\cloudflared.exe tunnel run line-chat --config cloudflare-tunnel-config.yml
```

---

## 📝 สรุปเปรียบเทียบ

| วิธี | URL คงที่ | ความยาก | เหมาะกับ |
|------|-----------|---------|----------|
| Quick Tunnel | ❌ (เปลี่ยนทุกครั้ง) | ⭐ ง่าย | ทดสอบเร็ว |
| Named Tunnel + Domain | ✅ คงที่ | ⭐⭐⭐ ปานกลาง | Production |
| Named Tunnel + TryCloudflare | ✅ คงที่ | ⭐⭐ ง่าย | ทดสอบ/Production |

---

## 🛠️ สคริปต์อัตโนมัติ

ดูไฟล์ `START_CLOUDFLARE.bat` สำหรับสคริปต์ที่รันอัตโนมัติ

---

## ✅ Checklist

- [ ] ดาวน์โหลด cloudflared.exe
- [ ] รัน Backend (port 3000)
- [ ] รัน Frontend (port 8085)
- [ ] เปิด Cloudflare Tunnel
- [ ] ตั้งค่า VITE_API_URL ใน .env
- [ ] Restart Frontend
- [ ] ทดสอบเปิด URL จากเครื่องอื่น
- [ ] ตั้งค่า LINE Webhook

---

## 🆘 Troubleshooting

### ปัญหา: Tunnel ไม่ทำงาน
**แก้ไข:**
- ตรวจสอบว่า Backend และ Frontend รันอยู่
- ตรวจสอบว่า port 3000 และ 8085 ไม่ถูกใช้งาน
- ตรวจสอบไฟล์ config.yml

### ปัญหา: Frontend ไม่เชื่อมต่อ Backend
**แก้ไข:**
- ตรวจสอบ VITE_API_URL ใน .env
- ตรวจสอบว่า Backend Tunnel ยังทำงานอยู่
- ตรวจสอบ CORS settings ใน Backend

### ปัญหา: LINE Webhook ไม่ทำงาน
**แก้ไข:**
- ตรวจสอบว่า Backend Tunnel ยังทำงานอยู่
- ตรวจสอบ URL ใน LINE Developers Console
- ตรวจสอบว่าใช้ HTTPS (ไม่ใช่ HTTP)

---

## 📚 อ่านเพิ่มเติม

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Tunnel Installation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)

