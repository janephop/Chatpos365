# ⚡ Quick Start Guide - LINE@ Integration

## 🚀 เริ่มใช้งานด่วน 3 ขั้นตอน

### Terminal 1: Backend Server 🔧
```bash
cd line-webhook
npm install
npm start
```

### Terminal 2: ngrok 🌐
```bash
ngrok http 3000
```
คัดลอก URL: `https://xxxx.ngrok-free.app`

### Terminal 3: Frontend 💻
```bash
npm install
npm run dev
```
เปิดเบราว์เซอร์: `http://localhost:5173`

---

## ⚙️ ตั้งค่าใน UI

1. 🔧 คลิก **Settings** (ไอคอนเฟือง)
2. 🔌 เลือก **Channels & Integrations**  
3. 💬 คลิก **LINE Official Account**
4. 📝 กรอกข้อมูล:
   - **ngrok URL**: `https://xxxx.ngrok-free.app` (ไม่ต้องใส่ `/webhook/line`)
   - **Channel Secret**: จาก LINE Developers Console
   - **Channel Access Token**: จาก LINE Developers Console
5. 💾 คลิก **บันทึกการตั้งค่า**
6. 🧪 คลิก **ทดสอบการเชื่อมต่อ**

---

## 🔗 ตั้งค่า LINE Developers Console

1. เปิด https://developers.line.biz/console/
2. เลือก Channel > **Messaging API** tab
3. **Webhook settings** > Edit
4. Webhook URL: `https://xxxx.ngrok-free.app/webhook/line`
5. เปิด **Use webhook** = Enabled
6. คลิก **Verify** ✅

---

## ✅ ทดสอบ

ส่งข้อความใน LINE OA → Bot จะตอบ "คุณส่งมา: [ข้อความของคุณ]"

---

## 📚 อ่านเพิ่มเติม

ดูคู่มือฉบับเต็มที่ `README_LINE_SETUP.md`

