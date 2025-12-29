# ✅ เริ่ม Backend ที่ถูกต้อง

## ❌ ปัญหา

Error: `Missing script: "start"`

**สาเหตุ:** รัน `npm start` ในโฟลเดอร์ root แต่ Backend อยู่ในโฟลเดอร์ `line-webhook`

---

## ✅ วิธีแก้ไข

### วิธีที่ 1: ไปที่โฟลเดอร์ line-webhook ก่อน

**ใน Terminal:**

```bash
cd line-webhook
npm start
```

---

### วิธีที่ 2: ใช้สคริปต์

**รันสคริปต์:**
```bash
START_SERVERS_ONLY.bat
```

สคริปต์จะไปที่โฟลเดอร์ `line-webhook` ให้อัตโนมัติ

---

## ✅ หลังจากเริ่ม Backend แล้ว

**ควรเห็น:**
```
✅ Database initialized: ...
✅ Synced chats to database
✅ Synced messages to database
✅ Synced bills to database
✅ Loaded 2 chats from file
✅ Loaded 51 messages from file
Server running on port 3000
```

**ถ้าเห็น "Server running on port 3000" = สำเร็จ!** ✅

---

## 🚀 ขั้นตอนต่อไป

### 1. เริ่ม Frontend

**Terminal ใหม่:**
```bash
npm run dev
```
(รันในโฟลเดอร์ root)

### 2. รัน Tunnel แบบ Manual

**Terminal ใหม่:**
```powershell
cd "C:\Users\jay_rpn\Documents\Project Big\Project Pos Chat\line chat"
cloudflared.exe tunnel run line-chat --config cloudflare-tunnel-config.yml
```

---

<div align="center">
✅ **ไปที่โฟลเดอร์ line-webhook ก่อน แล้วรัน npm start!** 🚀
</div>

