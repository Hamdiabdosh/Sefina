/**
 * Dev-only dataset: 5 medresas, 10 teachers, 3 master courses, 100 students (20/medresa).
 * Idempotent — safe to re-run (upserts by fixed names/emails).
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import {
  CourseLevel,
  Gender,
  MedresaRole,
  Status,
  StudentStatus,
  UserStatus,
} from "../../prisma/generated/prisma/enums";

const DEV_PASSWORD = "Teacher@12345";
const STUDENTS_PER_MEDRESA = 20;

const MEDRESA_NAMES = [
  "Dev Medresa — Aw Bare",
  "Dev Medresa — Jugol",
  "Dev Medresa — Amir Umer",
  "Dev Medresa — Ferensay",
  "Dev Medresa — Aboker",
] as const;

const MEDRESA_LOCATIONS = [
  "Aw Bare, Harar",
  "Jugol, Harar",
  "Amir Umer, Harar",
  "Ferensay, Harar",
  "Aboker, Harar",
] as const;

const MASTER_COURSES = [
  {
    nameEn: "Dev Course — Quran Recitation",
    level: CourseLevel.BEGINNER,
    descriptionEn: "Foundational Quran reading for dev testing.",
  },
  {
    nameEn: "Dev Course — Tajweed",
    level: CourseLevel.INTERMEDIATE,
    descriptionEn: "Tajweed rules and practice for dev testing.",
  },
  {
    nameEn: "Dev Course — Islamic Studies",
    level: CourseLevel.BEGINNER,
    descriptionEn: "General Islamic studies for dev testing.",
  },
] as const;

type TeacherSeed = {
  fullName: string;
  email: string;
  phone: string;
  specializationEn: string;
};

const TEACHERS: TeacherSeed[] = [
  { fullName: "Sheikh Ibrahim (Admin)", email: "admin01@sefinet.dev", phone: "+251911000001", specializationEn: "Quran" },
  { fullName: "Sheikh Yusuf (Admin)", email: "admin02@sefinet.dev", phone: "+251911000002", specializationEn: "Fiqh" },
  { fullName: "Sheikh Ahmed (Admin)", email: "admin03@sefinet.dev", phone: "+251911000003", specializationEn: "Arabic" },
  { fullName: "Sheikh Omar (Admin)", email: "admin04@sefinet.dev", phone: "+251911000004", specializationEn: "Hadith" },
  { fullName: "Sheikh Khalid (Admin)", email: "admin05@sefinet.dev", phone: "+251911000005", specializationEn: "Seerah" },
  { fullName: "Ustaz Musa", email: "ustaz06@sefinet.dev", phone: "+251911000006", specializationEn: "Quran" },
  { fullName: "Ustaz Ali", email: "ustaz07@sefinet.dev", phone: "+251911000007", specializationEn: "Tajweed" },
  { fullName: "Ustaz Hamza", email: "ustaz08@sefinet.dev", phone: "+251911000008", specializationEn: "Islamic Studies" },
  { fullName: "Ustaz Bilal", email: "ustaz09@sefinet.dev", phone: "+251911000009", specializationEn: "Quran" },
  { fullName: "Ustaz Hassan", email: "ustaz10@sefinet.dev", phone: "+251911000010", specializationEn: "Arabic" },
];

const connectionString =
  process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_ADMIN_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const localized = (en: string) => ({
  en,
  am: en,
  ar: en,
});

const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, 10);

const requireSuperAdmin = async () => {
  const user = await prisma.user.findFirst({
    where: {
      is_super_admin: true,
      deleted_at: null,
      status: UserStatus.ACTIVE,
    },
    orderBy: { created_at: "asc" },
  });
  if (!user) {
    throw new Error("Super Admin not found. Run: npm run db:seed");
  }
  return user;
};

const upsertMedresa = async (name: string, location: string, phone: string) => {
  const existing = await prisma.medresa.findFirst({
    where: { name, deleted_at: null },
  });
  if (existing) {
    return prisma.medresa.update({
      where: { id: existing.id },
      data: { location, phone, status: Status.ACTIVE, deleted_at: null },
    });
  }
  return prisma.medresa.create({
    data: { name, location, phone, status: Status.ACTIVE },
  });
};

const upsertMasterCourse = async (
  nameEn: string,
  level: CourseLevel,
  descriptionEn: string
) => {
  const courses = await prisma.course.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true },
  });
  const normalized = nameEn.trim().toLowerCase();
  const match = courses.find((c) => {
    const name = c.name as { en?: string };
    return typeof name?.en === "string" && name.en.trim().toLowerCase() === normalized;
  });
  if (match) {
    return prisma.course.update({
      where: { id: match.id },
      data: {
        name: localized(nameEn),
        description: localized(descriptionEn),
        level,
        status: Status.ACTIVE,
        deleted_at: null,
      },
    });
  }
  return prisma.course.create({
    data: {
      name: localized(nameEn),
      description: localized(descriptionEn),
      level,
      status: Status.ACTIVE,
    },
  });
};

const upsertTeacherUser = async (seed: TeacherSeed, passwordHash: string) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: seed.email }, { phone: seed.phone }],
      deleted_at: null,
    },
  });

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        full_name: seed.fullName,
        email: seed.email,
        phone: seed.phone,
        password_hash: passwordHash,
        is_super_admin: false,
        status: UserStatus.ACTIVE,
      },
    }));

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        full_name: seed.fullName,
        email: seed.email,
        phone: seed.phone,
        password_hash: passwordHash,
        status: UserStatus.ACTIVE,
        deleted_at: null,
      },
    });
  }

  const existingTeacher = await prisma.teacher.findFirst({
    where: { user_id: user.id, deleted_at: null },
  });

  if (existingTeacher) {
    return prisma.teacher.update({
      where: { id: existingTeacher.id },
      data: {
        full_name: seed.fullName,
        email: seed.email,
        phone: seed.phone,
        specialization: localized(seed.specializationEn),
        status: Status.ACTIVE,
        deleted_at: null,
      },
    });
  }

  return prisma.teacher.create({
    data: {
      user_id: user.id,
      full_name: seed.fullName,
      email: seed.email,
      phone: seed.phone,
      specialization: localized(seed.specializationEn),
      date_joined: new Date("2024-01-01"),
      status: Status.ACTIVE,
    },
  });
};

const upsertTeacherMedresa = async (
  teacherId: string,
  medresaId: string,
  role: MedresaRole
) => {
  const existing = await prisma.teacherMedresa.findUnique({
    where: {
      teacher_id_medresa_id: { teacher_id: teacherId, medresa_id: medresaId },
    },
  });
  if (existing) {
    return prisma.teacherMedresa.update({
      where: { id: existing.id },
      data: { role, deleted_at: null },
    });
  }
  return prisma.teacherMedresa.create({
    data: { teacher_id: teacherId, medresa_id: medresaId, role },
  });
};

const upsertMedresaCourse = async (medresaId: string, courseId: string) => {
  const existing = await prisma.medresaCourse.findUnique({
    where: {
      medresa_id_course_id: { medresa_id: medresaId, course_id: courseId },
    },
  });
  if (existing) {
    return prisma.medresaCourse.update({
      where: { id: existing.id },
      data: { status: Status.ACTIVE, deleted_at: null },
    });
  }
  return prisma.medresaCourse.create({
    data: { medresa_id: medresaId, course_id: courseId, status: Status.ACTIVE },
  });
};

const upsertCourseAssignment = async (
  medresaCourseId: string,
  teacherId: string
) => {
  const existing = await prisma.courseAssignment.findFirst({
    where: { medresa_course_id: medresaCourseId, teacher_id: teacherId },
  });
  if (existing) {
    await prisma.courseAssignment.updateMany({
      where: {
        medresa_course_id: medresaCourseId,
        deleted_at: null,
        id: { not: existing.id },
      },
      data: { deleted_at: new Date() },
    });
    return prisma.courseAssignment.update({
      where: { id: existing.id },
      data: { deleted_at: null, assigned_since: new Date() },
    });
  }
  await prisma.courseAssignment.updateMany({
    where: { medresa_course_id: medresaCourseId, deleted_at: null },
    data: { deleted_at: new Date() },
  });
  return prisma.courseAssignment.create({
    data: { medresa_course_id: medresaCourseId, teacher_id: teacherId },
  });
};

const guardianPhone = (medresaIndex: number, studentIndex: number): string => {
  const suffix = String(medresaIndex * 100 + studentIndex).padStart(6, "0");
  return `+251912${suffix}`;
};

const upsertStudentsForMedresa = async (
  medresaId: string,
  medresaIndex: number,
  primaryMedresaCourseId: string
) => {
  const existingCount = await prisma.student.count({
    where: {
      current_medresa_id: medresaId,
      deleted_at: null,
      full_name: { startsWith: `Dev Student M${medresaIndex + 1}-` },
    },
  });

  const toCreate = Math.max(0, STUDENTS_PER_MEDRESA - existingCount);
  if (toCreate === 0) return;

  const startIndex = existingCount + 1;
  for (let i = 0; i < toCreate; i++) {
    const studentNum = startIndex + i;
    const fullName = `Dev Student M${medresaIndex + 1}-${String(studentNum).padStart(2, "0")}`;
    const gender = studentNum % 2 === 0 ? Gender.FEMALE : Gender.MALE;
    const year = 2010 + (studentNum % 8);

    const student = await prisma.student.create({
      data: {
        full_name: fullName,
        date_of_birth: new Date(`${year}-06-15`),
        gender,
        address: `${MEDRESA_LOCATIONS[medresaIndex]}, Ethiopia`,
        guardian_name: `Guardian of ${fullName}`,
        guardian_phone: guardianPhone(medresaIndex, studentNum),
        current_medresa_id: medresaId,
        status: StudentStatus.ACTIVE,
      },
    });

    await prisma.studentCourse.upsert({
      where: {
        student_id_medresa_course_id: {
          student_id: student.id,
          medresa_course_id: primaryMedresaCourseId,
        },
      },
      create: {
        student_id: student.id,
        medresa_course_id: primaryMedresaCourseId,
      },
      update: { deleted_at: null },
    });
  }
};

const run = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run dev seed in production (NODE_ENV=production)");
  }

  await requireSuperAdmin();
  const passwordHash = await hashPassword(DEV_PASSWORD);

  console.log("Seeding dev dataset…");

  const medresas = await Promise.all(
    MEDRESA_NAMES.map((name, i) => {
      const location = MEDRESA_LOCATIONS[i] ?? name;
      return upsertMedresa(name, location, `+25191300000${i + 1}`);
    })
  );

  const masterCourses = await Promise.all(
    MASTER_COURSES.map((c) => upsertMasterCourse(c.nameEn, c.level, c.descriptionEn))
  );

  const teachers = await Promise.all(
    TEACHERS.map((t) => upsertTeacherUser(t, passwordHash))
  );

  const ustaz06 = teachers[5];
  const ustaz07 = teachers[6];
  const ustaz08 = teachers[7];
  const ustaz09 = teachers[8];
  const ustaz10 = teachers[9];
  const quranCourse = masterCourses[0];
  const tajweedCourse = masterCourses[1];
  const islamicStudiesCourse = masterCourses[2];
  if (
    !ustaz06 ||
    !ustaz07 ||
    !ustaz08 ||
    !ustaz09 ||
    !ustaz10 ||
    !quranCourse ||
    !tajweedCourse ||
    !islamicStudiesCourse
  ) {
    throw new Error("Seed internal error: expected 10 teachers and 3 courses");
  }

  const secondCourses = [
    tajweedCourse,
    tajweedCourse,
    islamicStudiesCourse,
    islamicStudiesCourse,
    tajweedCourse,
  ];

  // Admins: teachers 0–4 → medresas 0–4 as ADMIN
  for (let i = 0; i < 5; i++) {
    const admin = teachers[i];
    const medresa = medresas[i];
    if (!admin || !medresa) continue;
    await upsertTeacherMedresa(admin.id, medresa.id, MedresaRole.ADMIN);
  }

  // Ustaz06: TEACHER at all medresas (primary course instructor)
  for (const medresa of medresas) {
    await upsertTeacherMedresa(ustaz06.id, medresa.id, MedresaRole.TEACHER);
  }

  // Ustaz07–10: TEACHER at medresas 0–3; ustaz10 also at medresa 4
  const extraTeachers = [ustaz07, ustaz08, ustaz09, ustaz10];
  for (let i = 0; i < 4; i++) {
    const medresa = medresas[i];
    const ustaz = extraTeachers[i];
    if (!medresa || !ustaz) continue;
    await upsertTeacherMedresa(ustaz.id, medresa.id, MedresaRole.TEACHER);
  }
  const medresa5 = medresas[4];
  if (medresa5) {
    await upsertTeacherMedresa(ustaz10.id, medresa5.id, MedresaRole.TEACHER);
  }

  const secondaryTeachers = [ustaz07, ustaz08, ustaz09, ustaz10];

  for (let i = 0; i < medresas.length; i++) {
    const medresa = medresas[i];
    const secondCourse = secondCourses[i];
    const secondaryTeacher = secondaryTeachers[i % secondaryTeachers.length];
    if (!medresa || !secondCourse || !secondaryTeacher) continue;

    const primaryMc = await upsertMedresaCourse(medresa.id, quranCourse.id);
    const secondaryMc = await upsertMedresaCourse(medresa.id, secondCourse.id);

    await upsertCourseAssignment(primaryMc.id, ustaz06.id);
    await upsertCourseAssignment(secondaryMc.id, secondaryTeacher.id);

    await upsertStudentsForMedresa(medresa.id, i, primaryMc.id);
  }

  const totalStudents = await prisma.student.count({
    where: {
      deleted_at: null,
      current_medresa: { name: { startsWith: "Dev Medresa" } },
    },
  });

  console.log("");
  console.log("Dev dataset ready.");
  console.log(`  Medresas:  ${medresas.length}`);
  console.log(`  Teachers:  ${teachers.length}`);
  console.log(`  Courses:   ${masterCourses.length} master, 2 active per medresa`);
  console.log(`  Students:  ${totalStudents} (target ${STUDENTS_PER_MEDRESA} per medresa)`);
  console.log("");
  console.log("Logins (password for all):", DEV_PASSWORD);
  console.log("  Medresa admins: admin01@sefinet.dev … admin05@sefinet.dev");
  console.log("  Teachers:       ustaz06@sefinet.dev … ustaz10@sefinet.dev");
  console.log("  See docs/seed-dev-credentials.md for full list.");
};

run()
  .catch((error) => {
    console.error("Dev seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
