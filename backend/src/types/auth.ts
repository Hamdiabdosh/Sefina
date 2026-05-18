import type { MedresaRole } from "../../prisma/generated/prisma/enums";

export type AuthenticatedUser = {
  userId: string;
  isSuperAdmin: boolean;
  medresaRoles: Array<{
    medresaId: string;
    role: MedresaRole;
  }>;
};
