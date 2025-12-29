# 🔍 วิธีระบุว่า URL ไหนเป็น Backend หรือ Frontend

## 📋 URLs ที่ได้

1. `https://tulsa-frontier-deserve-broadcasting.trycloudflare.com`
2. `https://presentation-sally-timber-peer.trycloudflare.com`

---

## 🔍 วิธีตรวจสอบ

### วิธีที่ 1: ดูที่ Terminal ที่รัน Tunnel

**Terminal ที่รัน Backend Tunnel:**
```powershell
cloudflared.exe tunnel --url http://localhost:3000
```
- URL ที่แสดง = **Backend URL**

**Terminal ที่รัน Frontend Tunnel:**
```powershell
cloudflared.exe tunnel --url http://localhost:8085
```
- URL ที่แสดง = **Frontend URL**

---

### วิธีที่ 2: ทดสอบ URLs

**ทดสอบ URL แรก:**
```
https://tulsa-frontier-deserve-broadcasting.trycloudflare.com
```

**ถ้าเห็น:**
- Response จาก Backend (JSON หรือ API response) = **Backend URL** ✅
- หน้า Frontend (เว็บไซต์) = **Frontend URL** ✅

**ทดสอบ URL ที่สอง:**
```
https://presentation-sally-timber-peer.trycloudflare.com
```

**ถ้าเห็น:**
- Response จาก Backend (JSON หรือ API response) = **Backend URL** ✅
- หน้า Frontend (เว็บไซต์) = **Frontend URL** ✅

---

### วิธีที่ 3: ทดสอบ Webhook Endpoint

**ทดสอบ URL + /webhook/line:**

**URL แรก:**
```
https://tulsa-frontier-deserve-broadcasting.trycloudflare.com/webhook/line
```

**URL ที่สอง:**
```
https://presentation-sally-timber-peer.trycloudflare.com/webhook/line
```

**ถ้าเห็น response หรือไม่ error = Backend URL** ✅

---

## ✅ วิธีที่ง่ายที่สุด

**ดูที่ Terminal ที่รัน tunnel:**
- Terminal ที่รัน `--url http://localhost:3000` = **Backend URL**
- Terminal ที่รัน `--url http://localhost:8085` = **Frontend URL**

---

<div align="center">
🔍 **ดูที่ Terminal ที่รัน tunnel เพื่อระบุ URL!** 🚀
</div>

