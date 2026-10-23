import * as t from "drizzle-orm/pg-core";

// ค่าเพศที่อนุญาต (ใช้ทั้งใน DB และตอนตรวจข้อมูลด้วย zod)
export const GENDERS = ["male", "female", "other"] as const;

export const genderEnum = t.pgEnum("gender", GENDERS);

export const students = t.pgTable("students", {
  id: t.bigserial({ mode: "number" }).primaryKey(),
  firstName: t.varchar({ length: 255 }).notNull(), // ชื่อ
  lastName: t.varchar({ length: 255 }).notNull(), // นามสกุล
  studentCode: t.varchar("student_code", { length: 20 }).notNull().unique(), // รหัสประจำตัว (ห้ามซ้ำ)
  birthDate: t.date({ mode: "string" }).notNull(), // วันเกิด รูปแบบ YYYY-MM-DD
  gender: genderEnum().notNull(), // เพศ
  // withTimezone: true เพื่อให้เวลาตรงกันเสมอ ไม่ว่า DB หรือเครื่องจะตั้ง timezone อะไร
  createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
});
