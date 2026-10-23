import { handle } from "@hono/node-server/vercel";
import app from "./app.js";

// Vercel จะเรียกไฟล์นี้เป็น Serverless Function (Node.js runtime)
// ใช้ Node runtime เพราะไลบรารี pg ต้องการ Node (ใช้บน Edge runtime ไม่ได้)
export default handle(app);
