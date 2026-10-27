import app from "./app.js";

// จุดเข้าของ Cloudflare Workers (ระบุไว้ใน wrangler.jsonc ที่ "main")
// Hono app มีเมธอด fetch อยู่แล้ว จึง export ได้ตรงๆ
export default app;
