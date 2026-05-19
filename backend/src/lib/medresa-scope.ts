import { Status } from "../../prisma/generated/prisma/enums";
import { prisma } from "./prisma";

export const activeMedresaWhere = () => ({
  status: Status.ACTIVE,
  deleted_at: null,
});

export const assertMedresaActive = async (medresaId: string): Promise<boolean> => {
  const medresa = await prisma.medresa.findFirst({
    where: { id: medresaId, ...activeMedresaWhere() },
    select: { id: true },
  });
  return medresa !== null;
};
