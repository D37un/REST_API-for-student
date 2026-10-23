import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "hono/adapter";
import studentsRouter from "./students.js";

const apiRouter = new Hono();

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

apiRouter.route("/students", studentsRouter);

export default apiRouter;
