import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";

const DEFAULT_ADMIN = {
  fullName: "Sefinet Al Neja Super Admin",
  email: "superadmin@sefinet.local",
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
