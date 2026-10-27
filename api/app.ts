import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import apiRouter from "./routes/api.js";
import type { AppEnv } from "./types.js";

const app = new Hono<AppEnv>().basePath("/api");

app.use(
  "*",
  cors({
    // บน Workers ค่าตัวแปรอยู่ใน c.env ไม่ใช่ process.env
    origin: (_origin, c) => env<{ CORS_ORIGIN?: string }>(c).CORS_ORIGIN ?? "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.route("/v1", apiRouter);

app.onError((err, c) => {
  // error ที่ตั้งใจโยนเอง เช่น 401 จาก bearerAuth ให้ตอบตามรหัสเดิม
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
