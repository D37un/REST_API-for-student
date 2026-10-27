# Student API

REST API สำหรับจัดการข้อมูลนักศึกษา (Create, Read, Update, Delete)
พัฒนาด้วย **Hono + TypeScript**, **Drizzle ORM**, **PostgreSQL** และ deploy บน **Cloudflare Workers** (ต่อฐานข้อมูลผ่าน **Hyperdrive**)

> branch นี้คือเวอร์ชัน Cloudflare Workers ส่วนเวอร์ชัน Vercel อยู่ที่ branch `main`

- **ผู้จัดทำ:** Atikan Chinwanno (รหัสนักศึกษา 67070193)
- **GitHub:** `https://github.com/D37un/REST_API-for-student`
- **Deployed URL:** `https://student-api.<subdomain>.workers.dev/api/v1` *(ใส่หลัง deploy)*
- **รายงานการ deploy:** ดู [DEPLOYMENT.md](./DEPLOYMENT.md) และ [DEPLOYMENT-CLOUDFLARE.md](./DEPLOYMENT-CLOUDFLARE.md)

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
- PostgreSQL ออนไลน์ (เช่น Neon) — ไม่ต้องติดตั้ง Docker
- บัญชี Cloudflare (ฟรี) สำหรับ deploy

## วิธีรันในเครื่อง

**1. ติดตั้งแพ็กเกจ**

```bash
npm install
```

**2. ตั้งค่าตัวแปร**

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
```

- `.env` : ใส่ connection string ของฐานข้อมูลที่ `POSTGRES_URL` และ `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`
- `.dev.vars` : ใส่ `API_SECRET=ข้อความลับของคุณ`

**3. สร้างตารางด้วย migration**

```bash
npm run db:migrate
```

**4. เริ่มเซิร์ฟเวอร์**

```bash
npm run dev
```

เปิดที่ `http://localhost:8787/api/v1` ถ้าสำเร็จจะได้ `{"message":"Student API"}`

---

## วิธีใช้งาน API

Base URL (ในเครื่อง): `http://localhost:8787/api/v1`

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
curl -X POST http://localhost:8787/api/v1/students \
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
curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:8787/api/v1/students

# ดูรายคน
curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:8787/api/v1/students/1

# แก้ไขบางฟิลด์
curl -X PATCH http://localhost:8787/api/v1/students/1 \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"lastName": "ใจงาม"}'

# ลบ
curl -X DELETE -H "Authorization: Bearer YOUR_SECRET" http://localhost:8787/api/v1/students/1
```

> ตัวอย่าง curl ด้านบนเป็นสไตล์ bash (macOS/Linux/Git Bash) ถ้าใช้ **Windows PowerShell** ให้ใช้ชุดคำสั่งด้านล่างแทน เพราะ `curl` ใน PowerShell เป็นชื่อย่อของ `Invoke-WebRequest` และไม่รองรับ `\` ต่อบรรทัด

#### ตัวอย่างสำหรับ Windows PowerShell

```powershell
$B = "http://localhost:8787/api/v1"          # หรือ https://student-api.<subdomain>.workers.dev/api/v1
$Headers = @{ Authorization = "Bearer YOUR_SECRET" }

# เพิ่มนักศึกษา (ส่งเป็น UTF-8 เพื่อรองรับภาษาไทย)
$json = '{"firstName":"สมชาย","lastName":"ใจดี","studentCode":"67070001","birthDate":"2005-03-14","gender":"male"}'
Invoke-RestMethod -Method Post -Uri "$B/students" -Headers $Headers `
  -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($json))

# ดูทั้งหมด / รายคน
Invoke-RestMethod -Uri "$B/students" -Headers $Headers
Invoke-RestMethod -Uri "$B/students/1" -Headers $Headers

# แก้ไขบางฟิลด์
$patch = '{"lastName":"ใจงาม"}'
Invoke-RestMethod -Method Patch -Uri "$B/students/1" -Headers $Headers `
  -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($patch))

# ลบ
Invoke-RestMethod -Method Delete -Uri "$B/students/1" -Headers $Headers
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

## วิธี Deploy บน Cloudflare Workers

สรุปสั้นๆ (ขั้นตอนละเอียดและปัญหาที่เจออยู่ใน [DEPLOYMENT-CLOUDFLARE.md](./DEPLOYMENT-CLOUDFLARE.md)):

```bash
npx wrangler login
npx wrangler hyperdrive create student-db --connection-string="<connection string ของฐานข้อมูล>"
# นำ id ที่ได้ไปใส่ใน wrangler.jsonc ที่ hyperdrive[0].id
npx wrangler secret put API_SECRET
npm run deploy
```

---

## โครงสร้างโปรเจกต์

```
api/
├── worker.ts         # จุดเข้าของ Cloudflare Workers
├── app.ts            # สร้างแอป Hono, CORS, จัดการ error
├── types.ts          # ชนิดของ bindings (HYPERDRIVE, API_SECRET) และตัวแปรใน context
├── db/
│   ├── schema.ts     # นิยามตาราง students
│   └── drizzle.ts    # สร้างการเชื่อมต่อฐานข้อมูลต่อ 1 request
└── routes/
    ├── api.ts        # ตรวจ Bearer token, เปิด/ปิดการเชื่อมต่อ DB, รวมเส้นทาง
    └── students.ts   # CRUD นักศึกษา + ตรวจข้อมูลด้วย Zod
drizzle/              # ไฟล์ SQL migration
wrangler.jsonc        # ตั้งค่า Worker และ Hyperdrive binding
```

## Scripts

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน Worker ในเครื่องด้วย `wrangler dev` (port 8787) |
| `npm run deploy` | deploy ขึ้น Cloudflare Workers |
| `npm run typecheck` | ตรวจชนิดข้อมูล TypeScript |
| `npm run db:generate` | สร้างไฟล์ migration ใหม่จากการแก้ `schema.ts` |
| `npm run db:migrate` | รัน migration กับฐานข้อมูล |
| `npm run db:push` | ดัน schema เข้า DB ตรงๆ (ใช้ตอนทดลอง) |
