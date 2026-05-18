import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import { env } from "../config/env";

declare global {
  // eslint-disable-next-line no-var
  var __sefinetPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__sefinetPrisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__sefinetPrisma = prisma;
}
