import { getEthiopianToday } from "./ethiopian-calendar";
import { prisma } from "./prisma";

/** Next enrollment number for a medresa: `{ethiopianYear}/{seq}` e.g. `2018/001`. */
export const generateEnrollmentNumber = async (medresaId: string): Promise<string> => {
  const year = getEthiopianToday().year;
  const prefix = `${year}/`;

  const rows = await prisma.$queryRaw<Array<{ enrollment_number: string }>>`
    SELECT enrollment_number
    FROM "Student"
    WHERE current_medresa_id = ${medresaId}::uuid
      AND deleted_at IS NULL
      AND enrollment_number LIKE ${`${prefix}%`}
    ORDER BY enrollment_number DESC
    LIMIT 1
  `;

  let seq = 1;
  const latest = rows[0]?.enrollment_number;
  if (latest) {
    const part = latest.slice(prefix.length);
    const parsed = parseInt(part, 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(3, "0")}`;
};
