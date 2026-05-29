import { Router, type Request, type Response } from "express";
import { ApprovalStatus, MedresaRole } from "../../../prisma/generated/prisma/enums";
import { getActiveTeacherIdForUser } from "../../lib/grade-scope";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

const notificationsRoutes = Router();

const countPendingGradeEdits = async (req: Request): Promise<number> => {
  const user = req.user!;
  const baseWhere = {
    deleted_at: null,
    status: ApprovalStatus.PENDING,
  };

  if (user.isSuperAdmin) {
    return prisma.gradeEditRequest.count({
      where: {
        ...baseWhere,
        grade: { deleted_at: null },
      },
    });
  }

  const adminMedresaIds = (user.medresaRoles ?? [])
    .filter((r) => r.role === MedresaRole.ADMIN)
    .map((r) => r.medresaId);

  if (adminMedresaIds.length > 0) {
    return prisma.gradeEditRequest.count({
      where: {
        ...baseWhere,
        grade: {
          deleted_at: null,
          medresa_course: { medresa_id: { in: adminMedresaIds } },
        },
      },
    });
  }

  const teacherId = await getActiveTeacherIdForUser(user.userId);
  if (!teacherId) {
    return 0;
  }

  return prisma.gradeEditRequest.count({
    where: {
      ...baseWhere,
      requested_by: teacherId,
    },
  });
};

notificationsRoutes.get("/summary", requireAuth, async (req: Request, res: Response) => {
  const pendingGradeEdits = await countPendingGradeEdits(req);
  res.json({
    success: true,
    data: { pendingGradeEdits },
  });
});

export default notificationsRoutes;
