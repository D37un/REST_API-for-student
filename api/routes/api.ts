import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "hono/adapter";
import { createMiddleware } from "hono/factory";
import studentsRouter from "./students.js";
import { createDb } from "../db/drizzle.js";
import type { AppEnv } from "../types.js";

const apiRouter = new Hono<AppEnv>();

// เส้นทางสาธารณะ (ไม่ต้องใช้ token) ไว้เช็คว่า API ทำงานอยู่
apiRouter.get("/", (c) => {
  return c.json({ message: "Student API" });
});

// ทุกเส้นทางด้านล่างต้องส่ง Header: Authorization: Bearer <API_SECRET>
apiRouter.use(
  "*",
  bearerAuth({
    verifyToken: async (token, c) => {
      const { API_SECRET } = env<{ API_SECRET?: string }>(c);
      return !!API_SECRET && token === API_SECRET;
    },
  })
);

// เปิดการเชื่อมต่อฐานข้อมูลเฉพาะ request ที่ผ่านการตรวจ token แล้ว
// และปิดการเชื่อมต่อหลังตอบกลับเสร็จ (waitUntil = ให้ปิดต่อเบื้องหลังโดยไม่หน่วงการตอบ)
const withDb = createMiddleware<AppEnv>(async (c, next) => {
  const { db, client } = createDb(c.env.HYPERDRIVE.connectionString);
  await client.connect();
  c.set("db", db);
  try {
    await next();
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});
apiRouter.use("*", withDb);

apiRouter.route("/students", studentsRouter);

export default apiRouter;
