import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import apiRouter from "./routes/api.js";

// สร้างแอปไว้ที่เดียว แล้วให้ทั้งตอนรันในเครื่อง (local.ts) และบน Vercel (index.ts) เรียกใช้ร่วมกัน
const app = new Hono().basePath("/api");

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
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
