# 🤖 LINE Official Account Webhook System

> ระบบ Webhook สำหรับ LINE Official Account พร้อม UI สวยงาม สไตล์ Apple Design

![LINE Webhook](https://img.shields.io/badge/LINE-00C300?style=for-the-badge&logo=line&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)

## ✨ Features

- 🎨 **สวยงาม** - UI แบบ Apple Design พร้อม Dark/Light mode
- ⚡ **ง่ายต่อการใช้** - ตั้งค่าผ่าน UI ไม่ต้องแก้โค้ด
- 🔒 **ปลอดภัย** - บันทึกการตั้งค่าใน localStorage และ .env
- 🌐 **URL คงที่ถาวร** - ใช้ Cloudflare Named Tunnel (ไม่ต้องเปลี่ยน webhook บ่อยๆ)
- 📱 **Responsive** - ใช้งานได้ทั้ง Desktop และ Mobile
- 🧪 **ทดสอบง่าย** - มีปุ่มทดสอบการเชื่อมต่อในตัว
- 🤖 **Echo Bot** - ตอบข้อความอัตโนมัติ (ปรับแต่งได้)

## 📸 Screenshots

*Coming soon...*

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ 
- npm หรือ yarn
- LINE Official Account ([สมัครที่นี่](https://developers.line.biz/))
- Cloudflare Account (ฟรี) - สำหรับ Named Tunnel ([สมัครที่นี่](https://dash.cloudflare.com/sign-up))
- Cloudflare Tunnel ([ดาวน์โหลดที่นี่](https://github.com/cloudflare/cloudflared/releases))

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/line-chat.git
cd line-chat

# Install frontend dependencies
npm install

# Install backend dependencies
cd line-webhook
npm install
cd ..
```

### Running the Application

#### วิธีที่ 1: ใช้ Named Tunnel (แนะนำ - URL คงที่ถาวร)

**ตั้งค่าครั้งแรก (ทำครั้งเดียว):**
```bash
# 1. ตั้งค่า Named Tunnel
SETUP_PERMANENT_TUNNEL.bat

# 2. ตั้งค่า Public Hostname ใน Cloudflare Dashboard
# 3. แก้ไข hostname ใน cloudflare-tunnel-config.yml
```

**เริ่มต้นระบบ (ทุกครั้ง):**
```bash
# ใช้สคริปต์อัตโนมัติ
START_PERMANENT.bat
```

**หรือรันเอง:**
```bash
# Terminal 1 - Backend Server
cd line-webhook
npm start

# Terminal 2 - Frontend
npm run dev

# Terminal 3 - Cloudflare Named Tunnel
cloudflared.exe tunnel run line-chat --config cloudflare-tunnel-config.yml
```

#### วิธีที่ 2: ใช้ Quick Tunnel (URL เปลี่ยนทุกครั้ง)

```bash
# ใช้สคริปต์อัตโนมัติ
START_CLOUDFLARE.bat
```

**หรือรันเอง:**
```bash
# Terminal 1 - Backend
cd line-webhook
npm start

# Terminal 2 - Frontend
npm run dev

# Terminal 3 - Cloudflare Quick Tunnel (Backend)
cloudflared.exe tunnel --url http://localhost:3000

# Terminal 4 - Cloudflare Quick Tunnel (Frontend)
cloudflared.exe tunnel --url http://localhost:8085
```

### Configuration

#### สำหรับ Named Tunnel (URL คงที่)

1. ตั้งค่า Named Tunnel: `SETUP_PERMANENT_TUNNEL.bat`
2. ตั้งค่า Public Hostname ใน [Cloudflare Dashboard](https://one.dash.cloudflare.com/)
3. แก้ไข hostname ใน `cloudflare-tunnel-config.yml`
4. สร้างไฟล์ `.env` ในโฟลเดอร์ root:
   ```env
   VITE_API_URL=https://line-chat-backend-xxxxx.trycloudflare.com
   ```
5. เริ่มต้นระบบ: `START_PERMANENT.bat`
6. เปิดเบราว์เซอร์: Frontend URL (จาก config)
7. ตั้งค่า LINE Webhook: `https://line-chat-backend-xxxxx.trycloudflare.com/webhook/line`

#### สำหรับ Quick Tunnel (URL เปลี่ยนทุกครั้ง)

1. เริ่มต้นระบบ: `START_CLOUDFLARE.bat`
2. คัดลอก Backend URL จาก Terminal
3. สร้างไฟล์ `.env` ในโฟลเดอร์ root:
   ```env
   VITE_API_URL=https://xxxx.trycloudflare.com
   ```
4. Restart Frontend
5. ตั้งค่า LINE Webhook: `https://xxxx.trycloudflare.com/webhook/line`

### LINE Webhook Setup

1. เปิด [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Provider > Channel > **Messaging API** tab
3. **Webhook settings** > Edit
4. ใส่ Backend URL + `/webhook/line`:
   - Named Tunnel: `https://line-chat-backend-xxxxx.trycloudflare.com/webhook/line`
   - Quick Tunnel: `https://xxxx.trycloudflare.com/webhook/line`
5. เปิด **Use webhook** = Enabled
6. กด **Verify**

**💡 เคล็ดลับ:** ใช้ Named Tunnel เพื่อให้ URL คงที่ถาวร ไม่ต้องเปลี่ยน webhook บ่อยๆ!

## 📚 Documentation

**📁 เอกสารทั้งหมดอยู่ในโฟลเดอร์ [`docs/`](docs/)**

### 🚀 คู่มือเริ่มต้น (แนะนำ)
- 📖 **[คู่มือตั้งค่าแบบละเอียดทุกขั้นตอน](docs/SETUP_STEP_BY_STEP.md)** - Step-by-Step Guide (แนะนำสำหรับผู้เริ่มต้น)
- ⚡ **[Quick Start: URL คงที่](docs/QUICK_START_PERMANENT.md)** - เริ่มต้นแบบเร็ว 3 ขั้นตอน
- 📋 **[คู่มือแยกสิ่งที่ทำเอง vs AI ทำให้](docs/SETUP_GUIDE.md)** - แยกชัดเจนว่าต้องทำอะไรเอง

### 🌐 Cloudflare Tunnel
- 🌐 **[คู่มือตั้งค่า Named Tunnel แบบถาวร](docs/PERMANENT_TUNNEL_GUIDE.md)** - URL คงที่ถาวร (แนะนำ)
- ✅ **[ขั้นตอนต่อไปหลังจาก Login สำเร็จ](docs/NEXT_STEPS_AFTER_LOGIN.md)** - Login แล้วทำอะไรต่อ (อ่านนี้!)
- ✅ **[ไม่ต้องซื้อ Domain!](docs/NO_DOMAIN_NEEDED.md)** - ใช้ trycloudflare.com ได้เลย (ฟรี 100%)
- 🔍 **[หา Connectors Page ไม่เจอ](docs/FIND_CONNECTORS_PAGE.md)** - หา Zero Trust/Tunnels ไม่เจอ (อ่านนี้ก่อน!)
- 🔍 **[หา Public Hostnames ใน Panel](docs/FIND_PUBLIC_HOSTNAMES_IN_PANEL.md)** - เห็น Panel ด้านขวาแต่ไม่เห็น Public Hostnames (อ่านนี้!)
- 🔧 **[แก้ปัญหา URL Redirect](docs/PUBLIC_HOSTNAMES_REDIRECT_FIX.md)** - URL /public-hostnames redirect ไป overview (ใช้ Routes แทน!)
- 🔄 **[แก้ปัญหา Redirect ไป Overview ตลอด](docs/ALWAYS_REDIRECT_TO_OVERVIEW.md)** - กดลิงก์ไหนก็ไป Overview (ทำ Migration หรือใช้ไฟล์ Config!)
- ⚡ **[ตั้งค่าผ่านไฟล์ Config](SETUP_VIA_CONFIG.md)** - วิธีเดียวที่ใช้ได้! (ไม่ต้องหา Public Hostnames ใน Dashboard)
- ⚡ **[ตั้งค่าผ่านไฟล์ Config เท่านั้น](docs/SETUP_HOSTNAME_VIA_CONFIG_ONLY.md)** - หา Public Hostnames ไม่เจอ? ใช้วิธีนี้!
- 🚨 **[แก้ปัญหาไม่เห็น Public Hostnames](docs/CLOUDFLARE_PUBLIC_HOSTNAME_QUICK_FIX.md)** - เห็นหน้า Migration แทน (อ่านนี้ก่อน!)
- 🌐 [คู่มือหา Public Hostnames](docs/CLOUDFLARE_PUBLIC_HOSTNAME_GUIDE.md) - หาแท็บ Public Hostnames แบบละเอียด
- 🔐 **[แก้ปัญหา Login Cloudflare](docs/CLOUDFLARE_LOGIN_GUIDE.md)** - แก้ปัญหาไม่มี Zone
- 🔐 **[แก้ปัญหา Login Error](docs/CLOUDFLARE_LOGIN_ERROR.md)** - Certificate already exists
- 📖 [Cloudflare Tunnel Setup](docs/CLOUDFLARE_TUNNEL_SETUP.md) - คู่มือ Cloudflare Tunnel แบบละเอียด

### 🏗️ Architecture & Planning
- 🏛️ **[สถาปัตยกรรมระบบ](docs/ARCHITECTURE.md)** - System Architecture, Design, Best Practices
- 📊 **[ภาพรวมระบบ](docs/SYSTEM_OVERVIEW.md)** - System Overview แบบสรุป
- 🚀 **[คู่มืออัปเกรดเป็น Production](docs/MIGRATION_GUIDE.md)** - Migration Guide, VPS Setup, Scaling

### 📖 คู่มือระบบ
- 📖 [คู่มือตั้งค่า LINE](docs/README_LINE_SETUP.md) - Setup และ Troubleshooting
- 💾 [คู่มือฐานข้อมูล](docs/DATABASE_GUIDE.md) - Database Guide
- 💬 [คู่มือระบบแชท](docs/CHAT_SYSTEM.md) - Chat System Guide
- 🔄 [คู่มือ Sync แชท](docs/CHAT_SYNC_GUIDE.md) - Chat Sync Guide
- 🧪 [คู่มือการทดสอบ](docs/TESTING_GUIDE.md) - Testing Guide

**ดูเอกสารทั้งหมด:** [`docs/README.md`](docs/README.md)

## 🏗️ Project Structure

```
line-chat/
├── src/
│   ├── components/
│   │   ├── LineSettings.jsx      # หน้าตั้งค่า LINE@
│   │   ├── SettingsPage.jsx      # หน้า Settings หลัก
│   │   └── Toast.jsx             # Component แจ้งเตือน
│   ├── App.jsx                   # Main App
│   └── main.jsx                  # Entry point
├── line-webhook/
│   ├── index.js                  # Webhook server
│   ├── line.js                   # LINE SDK config
│   └── package.json              # Backend dependencies
├── public/
├── README.md
├── QUICK_START.md
└── package.json
```

## 🛠️ Tech Stack

### Frontend
- ⚛️ React 19
- 🎨 Tailwind CSS 4
- ⚡ Vite 7
- 🔥 Firebase (optional)
- 🎯 Lucide Icons

### Backend
- 🟢 Node.js
- 🚀 Express
- 💬 LINE Bot SDK
- 🔐 dotenv
- 🌐 CORS

## 🎯 API Endpoints

### Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/config/status` | ตรวจสอบสถานะการตั้งค่า |
| POST | `/api/config/update` | อัพเดทการตั้งค่า LINE |
| POST | `/webhook/line` | Webhook endpoint สำหรับ LINE |

## 📝 Environment Variables

สร้างไฟล์ `line-webhook/.env`:

```env
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here
PORT=3000
```

## 🤝 Contributing

Contributions, issues และ feature requests ยินดีต้อนรับเสมอ!

## 📄 License

This project is [MIT](LICENSE) licensed.

## 👨‍💻 Author

**Your Name**
- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

## 🙏 Acknowledgments

- LINE Messaging API
- React + Vite
- Tailwind CSS
- Cloudflare Tunnel (ฟรี, URL คงที่ถาวร)

## 📞 Support

หากมีปัญหาหรือคำถาม:
1. ดู [README_LINE_SETUP.md](README_LINE_SETUP.md) สำหรับ Troubleshooting
2. เปิด [Issue](https://github.com/YOUR_USERNAME/line-chat/issues)
3. ดู log ใน Terminal ของ backend

---

<div align="center">
Made with ❤️ and ☕

⭐ Star this repo if you find it helpful!
</div>

