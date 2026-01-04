# 📦 คู่มือ Backup และ Restore ข้อมูลสำหรับ Railway

## ⚠️ ปัญหา: ข้อมูลหายไปหลัง Deploy

Railway ใช้ **ephemeral storage** ซึ่งหมายความว่าเมื่อ deploy ใหม่ container จะถูกลบและข้อมูลทั้งหมดจะหายไป

## 🔧 วิธีแก้ปัญหา

### วิธีที่ 1: ใช้ Railway Volume (แนะนำ - ข้อมูลจะไม่หาย)

1. ไปที่ **Backend Service** → **Settings** → **Volumes**
2. คลิก **"+ New Volume"**
3. ตั้งค่า:
   - **Mount Path**: `/app/line-webhook/data`
   - **Size**: 1GB (หรือตามต้องการ)
4. **Save**
5. Redeploy service

✅ ข้อมูลจะถูกเก็บถาวรใน Volume

---

### วิธีที่ 2: Backup ก่อน Deploy แล้ว Restore หลัง Deploy

#### ขั้นตอนที่ 1: Backup ข้อมูลก่อน Deploy

1. เปิด Backend URL: `https://chatpos365-production.up.railway.app/api/backup/all`
2. ดาวน์โหลดไฟล์ ZIP
3. เก็บไฟล์ไว้ในที่ปลอดภัย

หรือใช้ API:

```bash
curl https://chatpos365-production.up.railway.app/api/backup/all -o backup.zip
```

#### ขั้นตอนที่ 2: Restore ข้อมูลหลัง Deploy

1. หลัง deploy เสร็จ เปิด Frontend
2. ไปที่ Settings → LINE Official Account
3. ใช้ endpoint `/api/chats/sync/import` เพื่อ restore

หรือใช้ API:

```bash
# Extract backup.zip
# แล้ว POST ข้อมูลไปที่ /api/chats/sync/import
curl -X POST https://chatpos365-production.up.railway.app/api/chats/sync/import \
  -H "Content-Type: application/json" \
  -d @backup_data.json
```

---

### วิธีที่ 3: เก็บข้อมูลใน GitHub (Manual)

#### Backup:

1. เปิด: `https://chatpos365-production.up.railway.app/api/backup/github`
2. คัดลอก JSON response
3. สร้างไฟล์ `backup_data.json` ใน GitHub repository
4. Commit และ Push

#### Restore:

1. หลัง deploy เสร็จ
2. ดาวน์โหลด `backup_data.json` จาก GitHub
3. POST ไปที่ `/api/chats/sync/import`

---

## 📋 API Endpoints

### Backup

- `GET /api/backup/all` - ดาวน์โหลด backup ทั้งหมด (ZIP)
- `POST /api/backup/github` - รับ JSON สำหรับ commit ไป GitHub

### Restore

- `POST /api/chats/sync/import` - Import ข้อมูลกลับมา
  - Body: `{ chats: [...], messages: {...} }`

### ตรวจสอบข้อมูล

- `GET /api/database/info` - ดูข้อมูลใน database

---

## 💡 คำแนะนำ

1. **ใช้ Railway Volume** (วิธีที่ 1) - ง่ายที่สุด ข้อมูลไม่หาย
2. **Backup ก่อน Deploy** - ถ้าไม่ใช้ Volume
3. **ตั้งค่า Auto-backup** - ใช้ cron job หรือ GitHub Actions

---

## 🔄 Workflow แนะนำ

### ก่อน Deploy:

```bash
# 1. Backup
curl https://chatpos365-production.up.railway.app/api/backup/all -o backup_$(date +%Y%m%d).zip

# 2. Commit backup ไป GitHub (optional)
git add backup_*.zip
git commit -m "Backup before deploy"
git push
```

### หลัง Deploy:

```bash
# 1. Restore
curl -X POST https://chatpos365-production.up.railway.app/api/chats/sync/import \
  -H "Content-Type: application/json" \
  -d @backup_data.json
```

---

## ⚠️ หมายเหตุ

- Railway Volume ต้อง upgrade plan (มีค่าใช้จ่าย)
- Backup/Restore ต้องทำ manual
- ข้อมูลใน ephemeral storage จะหายเมื่อ deploy ใหม่

