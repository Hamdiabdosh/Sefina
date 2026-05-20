import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { getMedresaResultsOverviewHandler } from "./grade.controller";

const medresaGradeRoutes = Router({ mergeParams: true });

const medresaRead = [
  requireAuth,
  requireRole(["super_admin", "medresa_admin"], { medresaIdParam: "medresaId" }),
] as const;

medresaGradeRoutes.get("/overview", ...medresaRead, getMedresaResultsOverviewHandler);

export default medresaGradeRoutes;
