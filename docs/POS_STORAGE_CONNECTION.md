# 💾 คู่มือเชื่อมต่อกับ POS Storage

## 📋 ภาพรวม

ระบบนี้สามารถเชื่อมต่อกับ POS Storage ได้ 3 วิธี:
1. **Railway Volume** (แนะนำ) - เก็บไฟล์ `products.sql` ใน persistent storage
2. **Environment Variable (JSON)** - ใช้ JSON format สำหรับ products
3. **Repository** - วางไฟล์ใน GitHub repository

---

## 🎯 วิธีที่ 1: ใช้ Railway Volume (แนะนำ)

### ขั้นตอนที่ 1: สร้าง Volume

1. **ไปที่ Railway Dashboard**
   - เปิด: https://railway.app
   - เลือก Project → Backend Service (chatpos365-backend)

2. **ไปที่ Settings → Volumes**
   - คลิก "+ New Volume"
   - ตั้งค่า:
     - **Mount Path:** `/app/line-webhook/data`
     - **Size:** 1GB (หรือตามต้องการ)
   - คลิก "Add"

3. **Redeploy Backend Service**
   - คลิก "Deploy" หรือ "Redeploy"
   - รอให้ deploy เสร็จ

### ขั้นตอนที่ 2: อัปโหลดไฟล์ products.sql

#### วิธีที่ A: ใช้ Railway CLI (แนะนำ)

1. **ติดตั้ง Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Link to project:**
   ```bash
   cd "c:\Users\jay_rpn\Documents\Project Big\Project Pos Chat\line chat"
   railway link
   ```

4. **อัปโหลดไฟล์:**
   ```bash
   # ถ้ามีไฟล์ products.sql อยู่แล้ว
   railway run --service chatpos365-backend -- sh -c "cat > /app/line-webhook/data/products.sql" < path/to/products.sql
   
   # หรือสร้างไฟล์ใหม่
   railway run --service chatpos365-backend -- sh -c "echo 'INSERT INTO products ...' > /app/line-webhook/data/products.sql"
   ```

#### วิธีที่ B: ใช้ Railway Dashboard

1. **ไปที่ Backend Service → Settings → Volumes**
2. **คลิก Volume ที่สร้างไว้**
3. **อัปโหลดไฟล์ `products.sql`** ไปยัง `/app/line-webhook/data/products.sql`

### ขั้นตอนที่ 3: ตั้งค่า Environment Variable (Optional)

1. **ไปที่ Backend Service → Variables**
2. **เพิ่ม Variable (ถ้าต้องการ):**
   - **Key:** `POS_DB_PATH`
   - **Value:** `/app/line-webhook/data/products.sql`
3. **Save**

### ขั้นตอนที่ 4: ตรวจสอบการทำงาน

1. **เปิด:** `https://chatpos365-production.up.railway.app/api/products`
2. **ควรเห็น:**
   ```json
   {
     "success": true,
     "products": [...],
     "count": 100,
     "source": "sql",
     "path": "/app/line-webhook/data/products.sql"
   }
   ```

---

## 🎯 วิธีที่ 2: ใช้ Environment Variable (JSON)

### ขั้นตอนที่ 1: Export Products จาก POS

1. **Export products จาก POS เป็น JSON**
2. **Format ตัวอย่าง:**
   ```json
   [
     {
       "id": "1",
       "sku": "SKU001",
       "name": "Product 1",
       "price": 100,
       "stock": 50,
       "category": "Category 1"
     },
     {
       "id": "2",
       "sku": "SKU002",
       "name": "Product 2",
       "price": 200,
       "stock": 30,
       "category": "Category 2"
     }
   ]
   ```

### ขั้นตอนที่ 2: ตั้งค่าใน Railway

1. **ไปที่ Backend Service → Variables**
2. **เพิ่ม Variable:**
   - **Key:** `POS_PRODUCTS_JSON`
   - **Value:** (วาง JSON content ที่ export มา)
3. **Save และ Redeploy**

### ขั้นตอนที่ 3: ตรวจสอบการทำงาน

1. **เปิด:** `https://chatpos365-production.up.railway.app/api/products`
2. **ควรเห็น:**
   ```json
   {
     "success": true,
     "products": [...],
     "count": 100,
     "source": "env"
   }
   ```

---

## 🎯 วิธีที่ 3: วางไฟล์ใน Repository

### ขั้นตอนที่ 1: วางไฟล์ใน Repository

1. **วางไฟล์ `products.sql`** ใน `line-webhook/data/products.sql`
2. **Commit และ Push:**

```bash
cd "c:\Users\jay_rpn\Documents\Project Big\Project Pos Chat\line chat"
git add line-webhook/data/products.sql
git commit -m "Add products.sql for POS connection"
git push origin main
```

### ขั้นตอนที่ 2: Railway จะ Deploy อัตโนมัติ

- Railway จะ detect การเปลี่ยนแปลงและ deploy อัตโนมัติ
- ไฟล์จะถูก copy ไปยัง container

### ขั้นตอนที่ 3: ตรวจสอบการทำงาน

1. **เปิด:** `https://chatpos365-production.up.railway.app/api/products`
2. **ควรเห็น products**

---

## 📝 Format ไฟล์ products.sql

### ตัวอย่างไฟล์ products.sql:

```sql
INSERT INTO products (id, sku, barcode, name, price, price2, price3, price4, price5, cost, category, stock, description, image, tax_rate) VALUES 
('1', 'SKU001', '1234567890', 'Product 1', 100.00, NULL, NULL, NULL, NULL, 50.00, 'Category 1', 50, 'Description 1', 'images/product1.jpg', NULL),
('2', 'SKU002', '1234567891', 'Product 2', 200.00, NULL, NULL, NULL, NULL, 100.00, 'Category 2', 30, 'Description 2', 'images/product2.jpg', NULL);
```

### ฟิลด์ที่จำเป็น:
- `id` - Product ID
- `name` - Product name
- `price` - Product price
- `stock` - Stock quantity

### ฟิลด์ที่ optional:
- `sku` - SKU code
- `barcode` - Barcode
- `price2`, `price3`, `price4`, `price5` - Additional prices
- `cost` - Cost price
- `category` - Category
- `description` - Description
- `image` - Image path
- `tax_rate` - Tax rate

---

## 🔍 ตรวจสอบการทำงาน

### 1. ตรวจสอบ Products API

1. **เปิด:** `https://chatpos365-production.up.railway.app/api/products`
2. **ควรเห็น JSON response พร้อม products**

### 2. ตรวจสอบใน Frontend

1. **เปิด Frontend Application**
2. **ไปที่หน้า Chat**
3. **คลิกสร้างบิล**
4. **ควรเห็น products จาก POS**

### 3. ตรวจสอบ Logs

1. **ไปที่ Backend Service → Logs**
2. **ควรเห็น:**
   ```
   ✅ Found products at: /app/line-webhook/data/products.sql
   ✅ Loaded 100 products from SQL file
   ```

---

## 🛠️ Troubleshooting

### ปัญหา: ไม่พบ products.sql

**แก้ไข:**
1. ตรวจสอบว่า Volume ถูก mount ถูกต้อง
2. ตรวจสอบ path ใน `POS_DB_PATH`
3. ใช้ `POS_PRODUCTS_JSON` แทน

### ปัญหา: Products API return empty array

**แก้ไข:**
1. ตรวจสอบว่าไฟล์ `products.sql` มีข้อมูล
2. ตรวจสอบ format ของไฟล์ SQL
3. ตรวจสอบ Logs ใน Backend

### ปัญหา: Products ไม่แสดงใน Frontend

**แก้ไข:**
1. ตรวจสอบว่า Backend API ทำงาน (`/api/products`)
2. ตรวจสอบ Console Logs ใน Frontend
3. ตรวจสอบ Network tab ใน Browser DevTools

---

## 📋 Checklist

- [ ] สร้าง Railway Volume (ถ้าใช้วิธีที่ 1)
- [ ] อัปโหลดไฟล์ `products.sql` หรือตั้งค่า `POS_PRODUCTS_JSON`
- [ ] ตั้งค่า Environment Variables (ถ้าต้องการ)
- [ ] Redeploy Backend Service
- [ ] ตรวจสอบ Products API (`/api/products`)
- [ ] ทดสอบใน Frontend (สร้างบิล)

---

## 💡 Tips

- **ใช้ Railway Volume** สำหรับ persistent storage (ข้อมูลไม่หายเมื่อ deploy)
- **ใช้ Environment Variable** สำหรับข้อมูลเล็กน้อย (< 1MB)
- **ใช้ Repository** สำหรับข้อมูลที่ต้องการ version control
- **Monitor Logs** เพื่อดูว่า products ถูกโหลดหรือไม่

---

## 🆘 ต้องการความช่วยเหลือ?

1. ตรวจสอบ Logs ใน Railway Dashboard
2. ตรวจสอบ Environment Variables
3. ตรวจสอบ Products API endpoint
4. ดูคู่มือใน `docs/RAILWAY_DEPLOY_GUIDE.md`

