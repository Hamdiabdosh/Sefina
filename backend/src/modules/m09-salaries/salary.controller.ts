import type { Request, Response } from "express";
import {
  assignTeacherRank,
  getTeacherRankHistory,
} from "./salary-teacher-rank.service";
import {
  createSalaryRank,
  deactivateSalaryRank,
  listSalaryRankHistory,
  listSalaryRanks,
  patchSalaryRank,
} from "./salary-rank.service";
import { recordSalaryPayment } from "./salary-payment.service";
import {
  getNetworkSalaryOverview,
  getSalaryPaymentList,
  getTeacherSalaryHistory,
} from "./salary-ledger.service";
import type {
  AssignTeacherRankInput,
  CreateSalaryRankInput,
  PatchSalaryRankInput,
  RecordSalaryPaymentInput,
  SalaryOverviewQuery,
  SalaryPaymentListQuery,
} from "./salary.schema";

const err = (res: Response, status: number, code: string, message: string) => {
  res.status(status).json({ success: false, error: { code, message } });
};

const getTeacherIdParam = (req: Request) => String(req.params.id);
const getRankIdParam = (req: Request) => String(req.params.id);

export const listSalaryRanksHandler = async (_req: Request, res: Response): Promise<void> => {
  const data = await listSalaryRanks();
  res.status(200).json({ success: true, data });
};

export const listSalaryRankHistoryHandler = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const data = await listSalaryRankHistory();
  res.status(200).json({ success: true, data });
};

export const createSalaryRankHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await createSalaryRank(
    req.user!.userId,
    req.body as CreateSalaryRankInput,
    req
  );
  res.status(201).json({ success: true, data: result.rank });
};

export const patchSalaryRankHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await patchSalaryRank(
    req.user!.userId,
    getRankIdParam(req),
    req.body as PatchSalaryRankInput,
    req
  );
  if ("error" in result) {
    err(res, 404, result.error ?? "NOT_FOUND", result.error ?? "Not found");
    return;
  }
  res.status(200).json({ success: true, data: result.rank });
};

export const deactivateSalaryRankHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await deactivateSalaryRank(req.user!.userId, getRankIdParam(req), req);
  if ("error" in result) {
    err(res, 404, result.error ?? "NOT_FOUND", result.error ?? "Not found");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const assignTeacherRankHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await assignTeacherRank(
    req.user!.userId,
    getTeacherIdParam(req),
    req.body as AssignTeacherRankInput,
    req
  );
  if ("error" in result) {
    const status = result.error === "TEACHER_NOT_FOUND" ? 404 : 404;
    err(res, status, result.error ?? "ERROR", result.error ?? "Request failed");
    return;
  }
  res.status(201).json({ success: true, data: result.assignment });
};

export const getTeacherRankHistoryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await getTeacherRankHistory(getTeacherIdParam(req));
  if ("error" in result) {
    err(res, 404, result.error ?? "NOT_FOUND", result.error ?? "Not found");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getSalaryPaymentListHandler = async (req: Request, res: Response): Promise<void> => {
  const data = await getSalaryPaymentList(req.validatedQuery as SalaryPaymentListQuery);
  res.status(200).json({ success: true, data });
};

export const recordSalaryPaymentHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await recordSalaryPayment(
    req.user!.userId,
    req.body as RecordSalaryPaymentInput,
    req
  );
  if ("error" in result) {
    const status =
      result.error === "DUPLICATE_PAYMENT"
        ? 409
        : result.error === "ADJUSTMENT_REASON_REQUIRED"
          ? 422
          : result.error === "PAYMENT_DATE_IN_FUTURE" || result.error === "INVALID_PAYMENT_DATE"
            ? 400
            : result.error === "TEACHER_NOT_FOUND" || result.error === "TEACHER_HAS_NO_RANK"
              ? 404
              : 400;
    err(res, status, result.error ?? "ERROR", result.error ?? "Request failed");
    return;
  }
  res.status(201).json({ success: true, data: result.payment });
};

export const getTeacherSalaryHistoryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await getTeacherSalaryHistory(getTeacherIdParam(req));
  if ("error" in result) {
    err(res, 404, result.error ?? "NOT_FOUND", result.error ?? "Not found");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getNetworkSalaryOverviewHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const data = await getNetworkSalaryOverview(req.validatedQuery as SalaryOverviewQuery);
  res.status(200).json({ success: true, data });
};
