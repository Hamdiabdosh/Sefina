/**
 * One-time / ops script: align Teacher identity columns with linked User rows.
 * Run before or after deploying User-as-source-of-truth teacher reads.
 */
import "./load-dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";

const connectionString =
  process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_ADMIN_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const run = async (): Promise<void> => {
  const mismatched = await prisma.$queryRaw<
    Array<{ id: string; user_id: string }>
  >`
    SELECT t.id, t.user_id
    FROM "Teacher" t
    INNER JOIN "User" u ON u.id = t.user_id
    WHERE t.full_name <> u.full_name
       OR t.phone <> u.phone
       OR t.email <> u.email
  `;

  if (mismatched.length === 0) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "Teacher" t
    SET
      full_name = u.full_name,
      phone = u.phone,
      email = u.email,
      updated_at = NOW()
    FROM "User" u
    WHERE t.user_id = u.id
      AND (t.full_name <> u.full_name OR t.phone <> u.phone OR t.email <> u.email)
  `;
};

run()
  .catch((err) => {
    console.error("[sync-teacher-identity] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
