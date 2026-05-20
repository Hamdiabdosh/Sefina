import type { Request, Response } from "express";
import {
  createFeeStructure,
  getActiveFeeStructure,
  listFeeStructures,
} from "./fee-structure.service";
import { recordFeePayment, voidFeePayment } from "./fee-payment.service";
import {
  getFeeCollection,
  getMedresaFeeOverview,
  getNetworkFeeOverview,
  getStudentFeeHistory,
} from "./fee-ledger.service";
import type {
  CreateFeeStructureInput,
  FeeCollectionQuery,
  FeeOverviewQuery,
  NetworkFeeOverviewQuery,
  RecordFeePaymentInput,
  VoidFeePaymentInput,
} from "./fee.schema";

const err = (res: Response, status: number, code: string, message: string) => {
  res.status(status).json({ success: false, error: { code, message } });
};

const getMedresaIdParam = (req: Request) => String(req.params.medresaId);
const getStudentIdParam = (req: Request) => String(req.params.studentId);
const getPaymentIdParam = (req: Request) => String(req.params.id);

export const listFeeStructuresHandler = async (_req: Request, res: Response): Promise<void> => {
  const data = await listFeeStructures();
  res.status(200).json({ success: true, data });
};

export const getActiveFeeStructureHandler = async (_req: Request, res: Response): Promise<void> => {
  const result = await getActiveFeeStructure();
  if ("error" in result) {
    err(res, 404, result.error ?? "NOT_FOUND", result.error ?? "Not found");
    return;
  }
  res.status(200).json({ success: true, data: result.structure });
};

export const createFeeStructureHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await createFeeStructure(
    req.user!.userId,
    req.body as CreateFeeStructureInput,
    req
  );
  res.status(201).json({ success: true, data: result.structure });
};

export const recordFeePaymentHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await recordFeePayment(
    req.user!.userId,
    req.body as RecordFeePaymentInput,
    req
  );
  if ("error" in result) {
    const status =
      result.error === "FORBIDDEN"
        ? 403
        : result.error === "STUDENT_NOT_FOUND"
          ? 404
          : result.error === "PAYMENT_DATE_IN_FUTURE" ||
              result.error === "INVALID_PAYMENT_DATE"
            ? 400
            : 400;
    err(res, status, result.error ?? "ERROR", result.error ?? "Request failed");
    return;
  }
  res.status(201).json({ success: true, data: result.payment });
};

export const voidFeePaymentHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await voidFeePayment(
    req.user!.userId,
    getPaymentIdParam(req),
    req.body as VoidFeePaymentInput,
    req
  );
  if ("error" in result) {
    const status = result.error === "FORBIDDEN" ? 403 : 404;
    err(res, status, result.error ?? "ERROR", result.error ?? "Request failed");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getFeeCollectionHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getFeeCollection(
    req,
    getMedresaIdParam(req),
    req.validatedQuery as FeeCollectionQuery
  );
  if ("error" in result) {
    const status =
      result.error === "FORBIDDEN" ? 403 : result.error === "NO_ACTIVE_FEE_STRUCTURE" ? 404 : 400;
    err(res, status, result.error ?? "ERROR", result.error ?? "Request failed");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getStudentFeeHistoryHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getStudentFeeHistory(
    req,
    getMedresaIdParam(req),
    getStudentIdParam(req)
  );
  if ("error" in result) {
    const status = result.error === "FORBIDDEN" ? 403 : 404;
    err(res, status, result.error ?? "ERROR", result.error ?? "Request failed");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getMedresaFeeOverviewHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getMedresaFeeOverview(
    req,
    getMedresaIdParam(req),
    req.validatedQuery as FeeOverviewQuery
  );
  if ("error" in result) {
    err(res, 403, result.error ?? "FORBIDDEN", "Forbidden");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getNetworkFeeOverviewHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getNetworkFeeOverview(req, req.validatedQuery as NetworkFeeOverviewQuery);
  if ("error" in result) {
    err(res, 403, result.error ?? "FORBIDDEN", "Forbidden");
    return;
  }
  res.status(200).json({ success: true, data: result });
};
