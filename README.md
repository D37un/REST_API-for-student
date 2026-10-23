# Student API

REST API สำหรับจัดการข้อมูลนักศึกษา (Create, Read, Update, Delete)
พัฒนาด้วย **Hono + TypeScript**, **Drizzle ORM**, **PostgreSQL** และ deploy บน **Vercel**

- **ผู้จัดทำ:** Atikan Chinwanno (รหัสนักศึกษา 67070193)
- **GitHub:** `https://github.com/D37un`
- **Deployed URL:** `https://restapi-for-student.vercel.app/api/v1`

---

## ข้อมูลที่จัดเก็บ

| ฟิลด์ | ชนิด | คำอธิบาย |
|---|---|---|
| `id` | number | เลขรันอัตโนมัติ (Primary Key) |
| `firstName` | string | ชื่อ |
| `lastName` | string | นามสกุล |
| `studentCode` | string | รหัสประจำตัว (ห้ามซ้ำ) |
| `birthDate` | string | วันเกิด รูปแบบ `YYYY-MM-DD` |
| `gender` | string | เพศ: `male`, `female` หรือ `other` |
| `createdAt` / `updatedAt` | datetime | เวลาสร้าง/แก้ไข (ระบบใส่ให้เอง) |

---

## สิ่งที่ต้องมี

- Node.js 20 ขึ้นไป
- PostgreSQL (ในเครื่อง, Docker หรือฐานข้อมูลออนไลน์ เช่น Neon / Vercel Postgres)

## วิธีรันในเครื่อง

**1. ติดตั้งแพ็กเกจ**

```bash
npm install
```

**2. ตั้งค่าตัวแปรสภาพแวดล้อม**

```bash
cp .env.example .env
```

แก้ไฟล์ `.env`:

```env
POSTGRES_URL=postgres://postgres:1234@localhost:5432/student-db
API_SECRET=ข้อความลับของคุณ
```

**3. เตรียมฐานข้อมูล** (ถ้ายังไม่มี Postgres สามารถรันด้วย Docker)

```bash
docker run --name student-db -e POSTGRES_PASSWORD=1234 -e POSTGRES_DB=student-db -p 5432:5432 -d postgres:16
```

**4. สร้างตารางด้วย migration**

```bash
npm run db:migrate
```

**5. เริ่มเซิร์ฟเวอร์**

```bash
npm run dev
```

เปิดที่ `http://localhost:3000/api/v1` ถ้าสำเร็จจะได้ `{"message":"Student API"}`

---

## วิธีใช้งาน API

Base URL (ในเครื่อง): `http://localhost:3000/api/v1`

ทุกเส้นทางภายใต้ `/students` ต้องแนบ Header

```
Authorization: Bearer <API_SECRET>
```

### สรุป Endpoints

| การกระทำ | Method | URL | Body |
|---|---|---|---|
| ตรวจสถานะ API (ไม่ต้องใช้ token) | GET | `/` | – |
| ดูนักศึกษาทั้งหมด | GET | `/students` | – |
| ดูนักศึกษารายคน | GET | `/students/:id` | – |
| เพิ่มนักศึกษา | POST | `/students` | ครบทุกฟิลด์ |
| แก้ไขทั้งหมด | PUT | `/students/:id` | ครบทุกฟิลด์ |
| แก้ไขบางฟิลด์ | PATCH | `/students/:id` | อย่างน้อย 1 ฟิลด์ |
| ลบนักศึกษา | DELETE | `/students/:id` | – |

### ตัวอย่างการเรียกใช้ (curl)

```bash
# เพิ่มนักศึกษา
curl -X POST http://localhost:3000/api/v1/students \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "studentCode": "67070001",
    "birthDate": "2005-03-14",
    "gender": "male"
  }'

# ดูทั้งหมด
curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/v1/students

# ดูรายคน
curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/v1/students/1

# แก้ไขบางฟิลด์
curl -X PATCH http://localhost:3000/api/v1/students/1 \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"lastName": "ใจงาม"}'

# ลบ
curl -X DELETE -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/v1/students/1
```

ใช้ **Postman** ได้เช่นกัน: ตั้ง Authorization เป็น *Bearer Token* และส่ง Body แบบ raw → JSON

### ตัวอย่าง Response

```json
{
  "success": true,
  "student": {
    "id": 1,
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "studentCode": "67070001",
    "birthDate": "2005-03-14",
    "gender": "male",
    "createdAt": "2026-10-23T10:00:00.000Z",
    "updatedAt": "2026-10-23T10:00:00.000Z"
  }
}
```

### รหัสสถานะ (HTTP Status)

| Code | ความหมาย |
|---|---|
| 200 | สำเร็จ (อ่าน/แก้ไข/ลบ) |
| 201 | สร้างสำเร็จ |
| 400 | ข้อมูลไม่ถูกต้อง เช่น วันเกิดผิดรูปแบบ, เพศไม่อยู่ในค่าที่กำหนด, `id` ไม่ใช่ตัวเลข |
| 401 | ไม่มีหรือส่ง token ผิด |
| 404 | ไม่พบนักศึกษา |
| 409 | รหัสนักศึกษาซ้ำ |
| 500 | ข้อผิดพลาดฝั่งเซิร์ฟเวอร์ (เช่น เชื่อมต่อฐานข้อมูลไม่ได้) |

---

## วิธี Deploy บน Vercel

1. push โค้ดขึ้น GitHub (ไฟล์ `.env` จะไม่ถูก push เพราะอยู่ใน `.gitignore`)
2. ที่ Vercel เลือก **Add New → Project** แล้ว import รีโปนี้
3. สร้างฐานข้อมูล Postgres (แท็บ **Storage**) และเชื่อมกับโปรเจกต์
4. ตั้ง Environment Variables ให้ครบ:
   - `POSTGRES_URL` — connection string ของฐานข้อมูล
   - `API_SECRET` — รหัสลับสำหรับเรียก API
5. กด **Deploy**
6. สร้างตารางบนฐานข้อมูลจริง (ทำครั้งเดียว):

   ```bash
   POSTGRES_URL="<connection string ของฐานข้อมูลออนไลน์>" npm run db:migrate
   ```

---

## โครงสร้างโปรเจกต์

```
api/
├── index.ts          # จุดเข้าสำหรับ Vercel (Serverless Function)
├── local.ts          # จุดเข้าสำหรับรันในเครื่อง (port 3000)
├── app.ts            # สร้างแอป Hono, CORS, จัดการ error
├── db/
│   ├── schema.ts     # นิยามตาราง students
│   └── drizzle.ts    # การเชื่อมต่อฐานข้อมูล
└── routes/
    ├── api.ts        # ตรวจ Bearer token และรวมเส้นทาง
    └── students.ts   # CRUD นักศึกษา + ตรวจข้อมูลด้วย Zod
drizzle/              # ไฟล์ SQL migration
vercel.json           # ส่งทุก /api/* เข้า Serverless Function
```

## Scripts

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รันเซิร์ฟเวอร์ในเครื่อง (รีสตาร์ทอัตโนมัติเมื่อแก้โค้ด) |
| `npm run typecheck` | ตรวจชนิดข้อมูล TypeScript |
| `npm run db:generate` | สร้างไฟล์ migration ใหม่จากการแก้ `schema.ts` |
| `npm run db:migrate` | รัน migration กับฐานข้อมูล |
| `npm run db:push` | ดัน schema เข้า DB ตรงๆ (ใช้ตอนทดลอง) |
