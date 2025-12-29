# 💾 คู่มือการใช้งานฐานข้อมูลและ Export/Import

## 📋 ภาพรวม

ระบบนี้ใช้ **Dual Storage System**:
- **JSON Files** - สำหรับ offline-first และการแก้ไขด้วย text editor
- **SQLite Database** - สำหรับเปิดด้วย SQL tools และ Excel

### ไฟล์ฐานข้อมูล
- **SQLite:** `line-webhook/data/pos_chat.db` - เปิดด้วย SQLite Browser, DB Browser, หรือ Excel
- **JSON Files:** `line-webhook/data/*.json` - เปิดด้วย text editor หรือ Excel (import JSON)

---

## 🗄️ โครงสร้างฐานข้อมูล

### ตารางหลัก

1. **chats** - ข้อมูลแชท
   - `user_id` (PRIMARY KEY)
   - `name`, `avatar`, `platform`
   - `online`, `time`, `unread`, `is_pinned`, `tags`

2. **messages** - ข้อความทั้งหมด
   - `id` (PRIMARY KEY)
   - `user_id` (FOREIGN KEY → chats)
   - `text`, `sender`, `type`
   - `timestamp`, `time`
   - `image_url`, `video_url`, `audio_url`, `file_url`

3. **online_bills** - บิลออนไลน์
   - `id` (PRIMARY KEY)
   - `bill_number`, `customer_name`, `status`
   - `items` (JSON string), `total_amount`
   - `created_at`, `updated_at`

4. **bank_accounts** - บัญชีธนาคาร
   - `id` (PRIMARY KEY)
   - `bank`, `name`, `number`, `account_holder`

5. **shipping_companies** - บริษัทขนส่ง
   - `id` (PRIMARY KEY)
   - `name`, `price`, `icon`

6. **settings** - การตั้งค่า
   - `key` (PRIMARY KEY)
   - `value` (JSON string)

7. **shop_data** - ข้อมูลร้าน
   - `key` (PRIMARY KEY)
   - `value` (JSON string)

---

## 📤 Export ข้อมูล

### 1. Export เป็น Excel (แนะนำ)

**API Endpoint:**
```
GET /api/export/excel
```

**วิธีใช้:**
- เปิดเบราว์เซอร์ไปที่: `http://localhost:3000/api/export/excel`
- ไฟล์จะถูกดาวน์โหลดอัตโนมัติ
- เปิดด้วย Excel, Google Sheets, หรือ LibreOffice

**ข้อมูลที่ Export:**
- Chats
- Messages
- Bills
- Bank Accounts
- Shipping Companies
- Settings

---

### 2. Export ฐานข้อมูล SQLite

**API Endpoint:**
```
GET /api/export/database
```

**วิธีใช้:**
- เปิดเบราว์เซอร์ไปที่: `http://localhost:3000/api/export/database`
- ไฟล์ `pos_chat.db` จะถูกดาวน์โหลด
- เปิดด้วย:
  - **DB Browser for SQLite** (แนะนำ): https://sqlitebrowser.org/
  - **SQLite Studio**: https://sqlitestudio.pl/
  - **VS Code Extension**: SQLite Viewer
  - **Excel**: ใช้ Power Query หรือ Add-in

---

### 3. Export JSON Files (ZIP)

**API Endpoint:**
```
GET /api/export/json
```

**วิธีใช้:**
- เปิดเบราว์เซอร์ไปที่: `http://localhost:3000/api/export/json`
- ไฟล์ ZIP จะมี JSON files ทั้งหมด + database

---

### 4. Backup ทั้งหมด (Database + JSON + Uploads)

**API Endpoint:**
```
GET /api/backup/all
```

**วิธีใช้:**
- เปิดเบราว์เซอร์ไปที่: `http://localhost:3000/api/backup/all`
- ไฟล์ ZIP จะมี:
  - `database/pos_chat.db`
  - `data/*.json`
  - `uploads/*` (ไฟล์ที่อัปโหลดทั้งหมด)

**ใช้สำหรับ:**
- ย้ายโปรแกรมไปเครื่องอื่น
- Backup ก่อนอัปเดต
- Restore ข้อมูล

---

## 📥 Import ข้อมูล

### วิธีที่ 1: แก้ไข JSON Files โดยตรง

1. หยุดโปรแกรม (ปิด server)
2. แก้ไขไฟล์ JSON ใน `line-webhook/data/`
3. เริ่มโปรแกรมใหม่
4. ข้อมูลจะ sync ไป database อัตโนมัติ

---

### วิธีที่ 2: แก้ไข SQLite Database

1. Export database: `GET /api/export/database`
2. เปิดด้วย DB Browser for SQLite
3. แก้ไขข้อมูล
4. วางไฟล์ `pos_chat.db` กลับไปที่ `line-webhook/data/`
5. Restart server
6. ข้อมูลจะ sync ไป JSON files อัตโนมัติ

---

### วิธีที่ 3: Import จาก Excel

1. Export เป็น Excel: `GET /api/export/excel`
2. แก้ไขใน Excel
3. Export เป็น CSV จาก Excel
4. ใช้ script หรือ tool แปลง CSV → JSON
5. วางไฟล์ JSON กลับไปที่ `line-webhook/data/`
6. Restart server

---

## 🔄 Sync ข้อมูล

### Auto Sync

ระบบจะ sync อัตโนมัติ:
- **JSON → Database:** เมื่อเริ่มโปรแกรม
- **Database → JSON:** เมื่อมีการเปลี่ยนแปลงผ่าน API

### Manual Sync

**API Endpoint:**
```
POST /api/database/sync
```

**วิธีใช้:**
- เรียก API นี้เพื่อ sync JSON files → Database
- ใช้เมื่อแก้ไข JSON files โดยตรง

---

## 📊 ตรวจสอบสถานะฐานข้อมูล

**API Endpoint:**
```
GET /api/database/info
```

**Response:**
```json
{
  "available": true,
  "path": "C:\\...\\pos_chat.db",
  "size": 1234567,
  "stats": {
    "chats": 10,
    "messages": 150,
    "bills": 25,
    "bankAccounts": 3,
    "shippingCompanies": 5
  },
  "jsonFiles": {
    "chats": true,
    "messages": true,
    "settings": true,
    "bills": true,
    "shopData": true,
    "bankAccounts": true,
    "shippingCompanies": true
  }
}
```

---

## 🛠️ เครื่องมือแนะนำ

### สำหรับ SQLite

1. **DB Browser for SQLite** (ฟรี)
   - ดาวน์โหลด: https://sqlitebrowser.org/
   - เปิดไฟล์ `.db` ได้เลย
   - แก้ไขข้อมูลได้
   - Export เป็น CSV/Excel ได้

2. **SQLite Studio** (ฟรี)
   - ดาวน์โหลด: https://sqlitestudio.pl/
   - รองรับหลาย database

3. **VS Code Extension**
   - Extension: SQLite Viewer
   - เปิดไฟล์ `.db` ใน VS Code

### สำหรับ Excel

1. **Excel** (Microsoft Office)
   - เปิดไฟล์ `.xlsx` ได้เลย
   - Import JSON ได้ (Data → Get Data → From File → JSON)

2. **Google Sheets**
   - Upload ไฟล์ `.xlsx` หรือ `.csv`
   - Import JSON ได้

3. **LibreOffice Calc** (ฟรี)
   - เปิดไฟล์ `.xlsx` ได้
   - แทนที่ Excel ได้

---

## 📝 ตัวอย่างการใช้งาน

### ตัวอย่าง 1: Export ข้อมูลไป Excel

```bash
# เปิดเบราว์เซอร์
http://localhost:3000/api/export/excel

# ไฟล์จะถูกดาวน์โหลด: pos_chat_export_1234567890.xlsx
# เปิดด้วย Excel
```

### ตัวอย่าง 2: แก้ไขข้อมูลใน SQLite

```bash
# 1. Export database
http://localhost:3000/api/export/database

# 2. เปิดด้วย DB Browser for SQLite
# 3. แก้ไขข้อมูล
# 4. Save
# 5. วางไฟล์กลับไปที่ line-webhook/data/pos_chat.db
# 6. Restart server
```

### ตัวอย่าง 3: Backup ทั้งหมด

```bash
# เปิดเบราว์เซอร์
http://localhost:3000/api/backup/all

# ไฟล์จะถูกดาวน์โหลด: pos_chat_backup_1234567890.zip
# เก็บไว้สำหรับ restore หรือย้ายโปรแกรม
```

---

## 🔒 Offline-First

### หลักการ

- **JSON Files** เป็น source of truth หลัก
- **SQLite Database** เป็น secondary storage
- ข้อมูลถูกเก็บในเครื่อง (ไม่ต้องเชื่อมต่ออินเทอร์เน็ต)
- ยกเว้น Chat LINE ที่ต้องเชื่อมต่อ LINE API

### การทำงาน

1. เมื่อเริ่มโปรแกรม:
   - โหลด JSON files → Memory
   - Sync JSON → SQLite Database

2. เมื่อมีการเปลี่ยนแปลง:
   - บันทึก Memory → JSON files
   - Sync JSON → SQLite Database

3. เมื่อ Export:
   - อ่านจาก SQLite (ถ้ามี) หรือ JSON files

---

## 🚨 ข้อควรระวัง

1. **Backup ก่อนแก้ไข**
   - ใช้ `GET /api/backup/all` ก่อนแก้ไขข้อมูล

2. **หยุด Server ก่อนแก้ไข**
   - หยุด server ก่อนแก้ไข JSON files หรือ database โดยตรง

3. **ตรวจสอบข้อมูลหลัง Import**
   - ตรวจสอบข้อมูลหลัง import/restore

4. **ไม่แก้ไขพร้อมกัน**
   - อย่าแก้ไข JSON และ Database พร้อมกัน

---

## 📚 อ่านเพิ่มเติม

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [Excel JSON Import Guide](https://support.microsoft.com/en-us/office/import-data-from-external-data-sources-power-query-be4330b3-3276-4e7b-be471-6d213728dfd7)

---

## ✅ Checklist

- [ ] ติดตั้ง DB Browser for SQLite
- [ ] ทดสอบ Export Excel
- [ ] ทดสอบ Export Database
- [ ] ทดสอบ Backup
- [ ] ตรวจสอบสถานะฐานข้อมูล
- [ ] ทดสอบแก้ไข JSON files
- [ ] ทดสอบแก้ไข SQLite database

