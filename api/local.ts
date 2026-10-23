import "dotenv/config";
import { serve } from "@hono/node-server";

// import แบบ dynamic หลังโหลด .env แล้ว เพื่อให้ POSTGRES_URL พร้อมก่อนสร้าง connection
const { default: app } = await import("./app.js");

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
