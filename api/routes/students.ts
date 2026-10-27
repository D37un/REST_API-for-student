import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { students, GENDERS } from "../db/schema.js";
import type { AppEnv } from "../types.js";

const studentsRouter = new Hono<AppEnv>();

// ---------- กติกาตรวจข้อมูล (validation) ----------
const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const studentBody = z.object({
  firstName: z.string().trim().min(1).max(255),
  lastName: z.string().trim().min(1).max(255),
  studentCode: z.string().trim().min(1).max(20),
  birthDate: z.iso.date(), // YYYY-MM-DD
  gender: z.enum(GENDERS),
});

// PATCH: ส่งมาเฉพาะช่องที่อยากแก้ แต่ต้องมีอย่างน้อย 1 ช่อง
const studentPatchBody = studentBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "ต้องส่งข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 ช่อง",
  });

// รหัสนักศึกษาซ้ำ -> Postgres ส่ง error code 23505 (unique_violation)
function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

const duplicateResponse = { error: "Student code already exists" };

// ---------- READ (ทั้งหมด) ----------
studentsRouter.get("/", async (c) => {
  const db = c.get("db");
  const all = await db.select().from(students).orderBy(students.id);
  return c.json(all);
});

// ---------- READ (รายคน) ----------
studentsRouter.get("/:id", zValidator("param", idParam), async (c) => {
  const db = c.get("db");
  const { id } = c.req.valid("param");
  const [student] = await db.select().from(students).where(eq(students.id, id));
  if (!student) {
    return c.json({ error: "Student not found" }, 404);
  }
  return c.json(student);
});

// ---------- CREATE ----------
studentsRouter.post("/", zValidator("json", studentBody), async (c) => {
  const db = c.get("db");
  const body = c.req.valid("json");
  try {
    const [created] = await db.insert(students).values(body).returning();
    return c.json({ success: true, student: created }, 201);
  } catch (err) {
    if (isUniqueViolation(err)) return c.json(duplicateResponse, 409);
    throw err;
  }
});

// ---------- UPDATE (แทนที่ทั้งหมด) ----------
studentsRouter.put(
  "/:id",
  zValidator("param", idParam),
  zValidator("json", studentBody),
  async (c) => {
    const db = c.get("db");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    try {
      const updated = await db
        .update(students)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(students.id, id))
        .returning();
      if (updated.length === 0) {
        return c.json({ error: "Student not found" }, 404);
      }
      return c.json({ success: true, student: updated[0] });
    } catch (err) {
      if (isUniqueViolation(err)) return c.json(duplicateResponse, 409);
      throw err;
    }
  }
);

// ---------- UPDATE (แก้บางช่อง) ----------
studentsRouter.patch(
  "/:id",
  zValidator("param", idParam),
  zValidator("json", studentPatchBody),
  async (c) => {
    const db = c.get("db");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    try {
      const updated = await db
        .update(students)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(students.id, id))
        .returning();
      if (updated.length === 0) {
        return c.json({ error: "Student not found" }, 404);
      }
      return c.json({ success: true, student: updated[0] });
    } catch (err) {
      if (isUniqueViolation(err)) return c.json(duplicateResponse, 409);
      throw err;
    }
  }
);

// ---------- DELETE ----------
studentsRouter.delete("/:id", zValidator("param", idParam), async (c) => {
  const db = c.get("db");
  const { id } = c.req.valid("param");
  const deleted = await db.delete(students).where(eq(students.id, id)).returning();
  if (deleted.length === 0) {
    return c.json({ error: "Student not found" }, 404);
  }
  return c.json({ success: true, student: deleted[0] });
});

export default studentsRouter;
