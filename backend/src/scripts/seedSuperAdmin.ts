import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import { UserStatus } from "../../prisma/generated/prisma/enums";

const DEFAULT_ADMIN = {
  fullName: "Sefinet Al Neja Super Admin",
  email: "sefinaalnejah@gmail.com",
  phone: "+251900000000",
  password: "Admin@12345",
};

const connectionString =
  process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_ADMIN_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const run = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: DEFAULT_ADMIN.email }, { phone: DEFAULT_ADMIN.phone }],
      deleted_at: null,
    },
  });

  if (existing) {
    const isDev = process.env.NODE_ENV !== "production";
    const isDefaultAccount =
      existing.email === DEFAULT_ADMIN.email || existing.phone === DEFAULT_ADMIN.phone;

    if (isDev && isDefaultAccount) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          full_name: DEFAULT_ADMIN.fullName,
          email: DEFAULT_ADMIN.email,
          phone: DEFAULT_ADMIN.phone,
          password_hash: passwordHash,
          is_super_admin: true,
          status: UserStatus.ACTIVE,
          deleted_at: null,
        },
      });
      console.log("Super Admin updated (dev): password reset to default.");
      console.log(`Email: ${DEFAULT_ADMIN.email}`);
      console.log(`Password: ${DEFAULT_ADMIN.password}`);
      return;
    }

    console.log("Super Admin already exists.");
    console.log(`Email: ${existing.email}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      full_name: DEFAULT_ADMIN.fullName,
      email: DEFAULT_ADMIN.email,
      phone: DEFAULT_ADMIN.phone,
      password_hash: passwordHash,
      is_super_admin: true,
    },
  });

  console.log("Super Admin seeded successfully.");
  console.log(`User ID: ${user.id}`);
  console.log(`Email: ${DEFAULT_ADMIN.email}`);
  console.log(`Password: ${DEFAULT_ADMIN.password}`);
};

run()
  .catch((error) => {
    console.error("Failed to seed Super Admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
