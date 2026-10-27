# รายงานการนำ Student API ขึ้น Cloudflare Workers

- **Cloud Platform:** Cloudflare Workers (+ Hyperdrive) — แพ็กเกจ Free
- **ฐานข้อมูล:** PostgreSQL บน Neon (ตัวเดียวกับเวอร์ชัน Vercel)
- **URL:** `https://student-api.<subdomain>.workers.dev/api/v1` *(ใส่ของจริงหลัง deploy)*
- **Branch:** `cloudflare` (เวอร์ชัน Vercel อยู่ที่ `main`)

---

## 1. ทำไมเลือก Cloudflare Workers

- เฟรมเวิร์ก Hono ที่ใช้ ออกแบบมาให้รันบน Workers ได้โดยตรง
- แพ็กเกจฟรีไม่ต้องใช้บัตรเครดิต (100,000 requests ต่อวัน)
- ได้เรียนรู้โมเดลการรันแบบ Edge/Serverless ที่ต่างจาก Vercel และเป็น Platform ที่ไม่ค่อยมีคนเลือก

## 2. สถาปัตยกรรม

```
Client ──▶ Cloudflare Worker (api/worker.ts, Hono)
                │  env.HYPERDRIVE.connectionString
                ▼
           Hyperdrive (connection pooling ฝั่ง Cloudflare)
                ▼
           PostgreSQL บน Neon
```

**Hyperdrive** คือบริการของ Cloudflare ที่ช่วยเปิดและเก็บ connection ไปยัง Postgres ไว้ให้ เพราะ Worker เป็นโปรแกรมอายุสั้น การเปิด connection ใหม่ไปฐานข้อมูลทุก request (ต้องทำ TCP + TLS + login) ช้าและเปลือง จึงให้ Hyperdrive ถือ connection ไว้แทน

## 3. สิ่งที่ต้องแก้ในโค้ดเมื่อย้ายจาก Vercel มา Workers

| เรื่อง | Vercel (`main`) | Cloudflare (`cloudflare`) | เหตุผล |
|---|---|---|---|
| จุดเข้า | `api/index.ts` + `vercel.json` | `api/worker.ts` + `wrangler.jsonc` | Workers เรียก `fetch` ของ Hono app โดยตรง |
| ตัวแปร | `process.env.POSTGRES_URL` | `c.env.HYPERDRIVE` (binding) และ `c.env.API_SECRET` (secret) | Workers ส่งค่าผ่าน `env` ของแต่ละ request |
| การเชื่อมต่อ DB | สร้างครั้งเดียวตอนเริ่ม (global) | สร้างใหม่ต่อ 1 request แล้วปิดด้วย `waitUntil` | Worker ห้ามเก็บ connection ข้าม request |
| Runtime flag | Node.js เต็มรูปแบบ | `compatibility_flags: ["nodejs_compat"]` | ให้ไลบรารี `pg` ทำงานได้ |
| รันในเครื่อง | `tsx watch api/local.ts` | `wrangler dev` | จำลอง runtime ของ Workers (workerd) |

## 4. ขั้นตอนที่ทำ

### 4.1 แยก branch
```powershell
git status
git checkout -b cloudflare
```
**เพื่อ:** ไม่แตะ `main` ที่ deploy บน Vercel และใช้ส่งงานส่วนหลักอยู่

### 4.2 แก้โค้ด/ติดตั้งแพ็กเกจ
วางไฟล์เวอร์ชัน Cloudflare ทับ ลบ `api/index.ts`, `api/local.ts`, `vercel.json` แล้ว

```powershell
Remove-Item -Recurse -Force node_modules
npm install
npm run typecheck
```

### 4.3 ตั้งค่าและทดสอบในเครื่อง
1. สร้าง `.env` (ใส่ connection string ของ Neon ทั้ง `POSTGRES_URL` และ `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`)
2. สร้าง `.dev.vars` ใส่ `API_SECRET=...`
3. `npm run dev` แล้วทดสอบที่ `http://localhost:8787/api/v1`

### 4.4 สมัครและล็อกอิน Cloudflare
```powershell
npx wrangler login
```

### 4.5 สร้าง Hyperdrive
```powershell
npx wrangler hyperdrive create student-db --connection-string="<Neon connection string แบบ unpooled>"
```
คัดลอก `id` ที่ได้ไปใส่ใน `wrangler.jsonc` ตรง `hyperdrive[0].id`

### 4.6 Deploy และตั้ง secret
```powershell
npm run deploy
npx wrangler secret put API_SECRET
```

### 4.7 ทดสอบบน production
ใช้ `Invoke-RestMethod` ตามตัวอย่างใน README กับ URL `https://student-api.<subdomain>.workers.dev/api/v1`

### 4.8 commit และ push
```powershell
git add .
git commit -m "Add Cloudflare Workers version"
git push -u origin cloudflare
```

---

## 5. ปัญหาที่เจอและวิธีแก้

| # | ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|---|
| 1 | `npm install` ขึ้น `ERESOLVE could not resolve` | `wrangler` รุ่นใหม่ต้องการ `@cloudflare/workers-types` เวอร์ชัน 5 แต่เขียนไว้เวอร์ชัน 4 | แก้เป็น `"@cloudflare/workers-types": "^5.20261023.1"` ใน `package.json` |
| 2 | `wrangler dev` ไม่เริ่ม ขึ้น `You must provide a password` | wrangler บังคับให้ connection string ของ Hyperdrive ตอนรันในเครื่องต้องมีรหัสผ่าน | ใส่รหัสผ่านใน `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` (ใช้ URL ของ Neon ที่มีรหัสผ่านอยู่แล้ว) |
| 3 | ใช้ `process.env` กับ DB แบบ global ตามเวอร์ชัน Vercel ไม่ได้ | Workers ส่งค่าตัวแปรผ่าน `env` ของ request และไม่ควรถือ connection ข้าม request | ย้ายการสร้าง DB ไปเป็น middleware ต่อ request (`withDb`) และอ่านค่าผ่าน `c.env` |
| 4 | ใช้ connection string แบบ pooled (`-pooler`) ของ Neon กับ Hyperdrive | Hyperdrive ทำ pooling ให้เองอยู่แล้ว การซ้อน pooler สองชั้นอาจมีปัญหา | ใช้ URL แบบ unpooled (`DATABASE_URL_UNPOOLED`) ตอนสร้าง Hyperdrive |

> **เพิ่มปัญหาที่เจอจริงตอนทำเอง** ลงตารางนี้ได้ (เช่น ขั้นตอนล็อกอิน, การตั้ง subdomain `workers.dev`, error ตอน deploy) พร้อมภาพหน้าจอ

## 6. สรุปเปรียบเทียบ Vercel กับ Cloudflare Workers

| หัวข้อ | Vercel | Cloudflare Workers |
|---|---|---|
| วิธี deploy | ต่อ GitHub แล้ว deploy อัตโนมัติ | ใช้ CLI `wrangler deploy` |
| การเชื่อมต่อ DB | ต่อตรงด้วย `pg` | ผ่าน Hyperdrive |
| ความยากในการย้ายโค้ด | – | ปานกลาง (ปรับเรื่อง env และ connection) |
| ค่าใช้จ่าย (แพ็กเกจฟรี) | ฟรี | ฟรี ไม่ต้องใช้บัตร |
