import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema.js";

// บน Workers ห้ามสร้าง connection ค้างไว้ข้าม request
// จึงสร้าง Client ใหม่ต่อ 1 request (Hyperdrive ทำ connection pooling ให้เบื้องหลังอยู่แล้ว)
export function createDb(connectionString: string) {
  const client = new Client({ connectionString });
  const db = drizzle({ client, schema, casing: "snake_case" });
  return { db, client };
}

export type Db = ReturnType<typeof createDb>["db"];
