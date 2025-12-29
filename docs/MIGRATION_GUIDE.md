# 🚀 คู่มืออัปเกรดเป็น Production

## 📋 ภาพรวม

คู่มือนี้จะช่วยคุณอัปเกรดระบบจาก PC ส่วนตัวไปเป็น Production Server โดยไม่ต้องรื้อใหม่

---

## 🎯 Phase 1: Infrastructure Migration

### ตัวเลือก VPS (แนะนำ)

#### 1. Oracle Cloud Free Tier ⭐ แนะนำ

**ข้อดี:**
- ✅ ฟรีตลอด (ไม่ใช่แค่ Trial)
- ✅ 2 vCPU, 1GB RAM (เพียงพอสำหรับเริ่มต้น)
- ✅ 10TB Bandwidth/เดือน
- ✅ Always Free (ไม่มีวันหมดอายุ)

**ขั้นตอน:**
1. ไปที่: https://www.oracle.com/cloud/free/
2. สร้างบัญชี (ต้องใส่บัตรเครดิต แต่ไม่เสียเงิน)
3. สร้าง VM Instance (Always Free)
4. ใช้ Ubuntu 22.04 LTS

#### 2. Google Cloud Free Tier

**ข้อดี:**
- ✅ $300 Credit ฟรี 3 เดือน
- ✅ Performance ดี
- ✅ Documentation ครบ

**ข้อเสีย:**
- ⚠️ ฟรีแค่ 3 เดือน

#### 3. DigitalOcean (Paid - $4/เดือน)

**ข้อดี:**
- ✅ ราคาถูก ($4/เดือน)
- ✅ Performance ดี
- ✅ Simple Setup

---

### Setup VPS

```bash
# 1. SSH เข้า VPS
ssh root@your-vps-ip

# 2. Update System
apt update && apt upgrade -y

# 3. ติดตั้ง Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 4. ติดตั้ง Git
apt install -y git

# 5. Clone Repository
git clone <your-repo-url>
cd line-chat

# 6. ติดตั้ง Dependencies
npm install
cd line-webhook && npm install && cd ..

# 7. ติดตั้ง Cloudflare Tunnel
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

---

## 🗄️ Phase 2: Database Migration

### Export จาก SQLite

```bash
# บน PC เดิม
cd line-webhook/data
sqlite3 pos_chat.db .dump > backup.sql
```

### Import ไป PostgreSQL (Production)

```bash
# บน VPS
# 1. ติดตั้ง PostgreSQL
apt install -y postgresql postgresql-contrib

# 2. สร้าง Database
sudo -u postgres psql
CREATE DATABASE line_chat;
CREATE USER line_chat_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE line_chat TO line_chat_user;
\q

# 3. Convert SQLite to PostgreSQL
# ใช้ pgloader หรือเขียน script แปลง
```

### หรือใช้ SQLite ต่อ (ถ้า Traffic ไม่สูง)

```bash
# SQLite ยังใช้ได้สำหรับ Production ขนาดเล็ก
# แค่ต้อง Backup บ่อยๆ
```

---

## 🔄 Phase 3: Application Migration

### 1. Copy Files

```bash
# บน PC เดิม
# สร้าง Archive
tar -czf line-chat-backup.tar.gz line-chat/

# Upload ไป VPS
scp line-chat-backup.tar.gz root@your-vps-ip:/root/

# บน VPS
cd /root
tar -xzf line-chat-backup.tar.gz
cd line-chat
```

### 2. Setup Environment

```bash
# สร้างไฟล์ .env
nano .env
# VITE_API_URL=https://line-chat-backend-xxxxx.trycloudflare.com

nano line-webhook/.env
# LINE_CHANNEL_ACCESS_TOKEN=your_token
# LINE_CHANNEL_SECRET=your_secret
# PORT=3000
```

### 3. Setup Cloudflare Tunnel

```bash
# Login
cloudflared tunnel login

# ใช้ Tunnel เดิม (line-chat)
# หรือสร้างใหม่
cloudflared tunnel create line-chat-prod

# Copy config
cp cloudflare-tunnel-config.yml cloudflare-tunnel-config.yml.prod
```

---

## 🔧 Phase 4: Process Management

### ใช้ PM2 (แนะนำ)

```bash
# ติดตั้ง PM2
npm install -g pm2

# Start Backend
cd line-webhook
pm2 start npm --name "backend" -- start

# Start Frontend
cd ..
pm2 start npm --name "frontend" -- run dev

# Start Tunnel
pm2 start cloudflared --name "tunnel" -- tunnel run line-chat --config cloudflare-tunnel-config.yml

# Save PM2 Config
pm2 save

# Setup Auto-start
pm2 startup
# รันคำสั่งที่แสดงออกมา
```

### หรือใช้ systemd

```bash
# สร้าง service file
sudo nano /etc/systemd/system/line-chat-backend.service

[Unit]
Description=LINE Chat Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/line-chat/line-webhook
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target

# Enable และ Start
sudo systemctl enable line-chat-backend
sudo systemctl start line-chat-backend
```

---

## 📊 Phase 5: Monitoring

### Setup Health Check

```bash
# เพิ่ม endpoint ใน backend
GET /health
```

### Setup Uptime Monitoring

- ใช้ **UptimeRobot** (ฟรี) - https://uptimerobot.com/
- ตรวจสอบทุก 5 นาที
- ส่ง Email เมื่อ Down

### Setup Logging

```bash
# ใช้ PM2 Logs
pm2 logs

# หรือใช้ systemd
journalctl -u line-chat-backend -f
```

---

## 🔒 Phase 6: Security Hardening

### 1. Firewall

```bash
# ติดตั้ง UFW
apt install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS (ถ้าจำเป็น)
ufw allow 80/tcp
ufw allow 443/tcp

# Enable Firewall
ufw enable
```

### 2. Fail2Ban

```bash
# ติดตั้ง Fail2Ban
apt install -y fail2ban

# ตั้งค่า
systemctl enable fail2ban
systemctl start fail2ban
```

### 3. Auto Updates

```bash
# ติดตั้ง unattended-upgrades
apt install -y unattended-upgrades

# ตั้งค่า
dpkg-reconfigure -plow unattended-upgrades
```

---

## 📦 Phase 7: Backup Strategy

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
DB_FILE="/root/line-chat/line-webhook/data/pos_chat.db"

mkdir -p $BACKUP_DIR

# Backup Database
cp $DB_FILE $BACKUP_DIR/pos_chat_$DATE.db

# Backup Config
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /root/line-chat/.env /root/line-chat/line-webhook/.env

# Keep only last 7 days
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Setup Cron Job

```bash
# Edit crontab
crontab -e

# Backup ทุกวันเวลา 2:00 AM
0 2 * * * /root/backup.sh
```

---

## 🚀 Phase 8: Performance Optimization

### 1. Node.js Optimization

```bash
# ใช้ Production Mode
NODE_ENV=production npm start

# ใช้ Cluster Mode (ถ้าจำเป็น)
pm2 start npm --name "backend" -- start -i max
```

### 2. Database Optimization

```sql
-- สร้าง Index
CREATE INDEX idx_timestamp ON messages(timestamp);
CREATE INDEX idx_user_id ON messages(user_id);
```

### 3. Caching

```javascript
// ใช้ Redis (ถ้าจำเป็น)
// หรือใช้ Memory Cache
```

---

## 📋 Migration Checklist

### Pre-Migration
- [ ] Backup Database
- [ ] Backup Config Files
- [ ] Document Current Setup
- [ ] Test Migration Scripts
- [ ] Setup VPS
- [ ] Test Connectivity

### Migration
- [ ] Copy Files to VPS
- [ ] Setup Environment Variables
- [ ] Migrate Database
- [ ] Test Application
- [ ] Update Cloudflare Config
- [ ] Test Webhook

### Post-Migration
- [ ] Monitor for 24-48 hours
- [ ] Setup Automated Backups
- [ ] Setup Monitoring
- [ ] Update Documentation
- [ ] Performance Tuning

---

## 🆘 Rollback Plan

### ถ้า Migration ล้มเหลว

```bash
# 1. Stop Services บน VPS
pm2 stop all

# 2. กลับไปใช้ PC เดิม
# 3. Update Cloudflare Config กลับ
# 4. Restart Services บน PC
```

---

## 📊 Cost Comparison

| Item | PC (Current) | VPS (Production) |
|------|-------------|-------------------|
| **Server** | ฟรี (ใช้ PC) | $0-10/เดือน |
| **Cloudflare** | ฟรี | ฟรี |
| **Domain** | ไม่ต้อง | $10-15/ปี (ถ้าต้องการ) |
| **Total** | **$0/เดือน** | **$0-10/เดือน** |

---

## 🎯 Conclusion

การอัปเกรดเป็น Production:
- ✅ **ไม่ต้องรื้อใหม่** - ใช้โค้ดเดิม
- ✅ **Migration ง่าย** - Copy Files + Config
- ✅ **Cost ต่ำ** - ใช้ Free Tier ได้
- ✅ **Scalable** - พร้อมขยายต่อ

---

<div align="center">
Ready for Production! 🚀
</div>

