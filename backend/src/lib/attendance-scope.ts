import { Status } from "../../prisma/generated/prisma/enums";
import { prisma } from "./prisma";

export const getActiveTeacherIdForUser = async (
  userId: string
): Promise<string | null> => {
  const row = await prisma.teacher.findFirst({
    where: { user_id: userId, deleted_at: null, status: Status.ACTIVE },
    select: { id: true },
  });
  return row?.id ?? null;
};
