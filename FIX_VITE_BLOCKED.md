# 🔧 แก้ปัญหา: Vite Blocked Request

## ❌ ปัญหา

Error: "Blocked request. This host ("presentation-sally-timber-peer.trycloudflare.com") is not allowed."

**สาเหตุ:**
- Vite block host ที่ไม่ใช่ localhost
- ต้องเพิ่ม `.trycloudflare.com` ใน `allowedHosts`

---

## ✅ วิธีแก้ไข

### แก้ไข vite.config.js

**เพิ่ม `.trycloudflare.com` ใน `allowedHosts`:**

```javascript
allowedHosts: [
    '.ngrok.io',
    '.ngrok-free.app',
    '.ngrok.app',
    '.trycloudflare.com',  // ← เพิ่มบรรทัดนี้
    'localhost',
    '127.0.0.1'
]
```

---

## 🔄 Restart Frontend

**หลังจากแก้ไขแล้ว:**

1. **หยุด Frontend** (กด Ctrl + C ใน Terminal ที่รัน Frontend)

2. **เริ่ม Frontend ใหม่:**
   ```bash
   npm run dev
   ```

3. **ทดสอบ URL อีกครั้ง:**
   ```
   https://presentation-sally-timber-peer.trycloudflare.com
   ```

---

## ✅ หลังจากแก้ไขแล้ว

**Frontend URL ควรทำงานได้แล้ว** ✅

---

<div align="center">
✅ **แก้ไข vite.config.js แล้ว Restart Frontend!** 🚀
</div>


