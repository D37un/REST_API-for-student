import type { Db } from "./db/drizzle.js";

// ตัวแปร/binding ที่ Cloudflare ส่งให้ Worker ผ่าน c.env
export type Bindings = {
  HYPERDRIVE: Hyperdrive; // การเชื่อมต่อฐานข้อมูลผ่าน Hyperdrive
  API_SECRET: string; // ตั้งด้วย: wrangler secret put API_SECRET
  CORS_ORIGIN?: string;
};

// ค่าที่ middleware ใส่ไว้ใน context ให้ route ดึงไปใช้ด้วย c.get("db")
export type Variables = {
  db: Db;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
