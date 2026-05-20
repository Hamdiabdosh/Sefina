export type SalaryPaymentListStatus = 'PAID' | 'UNPAID';

export type SalaryRankDTO = {
  id: string;
  name: Record<string, string>;
  monthlyAmountEtb: number;
  effectiveFrom: string;
  status: string;
  teacherCount?: number;
  createdAt: string;
};

export type SalaryPaymentListRow = {
  teacherId: string;
  fullName: string;
  photoUrl: string | null;
  salaryRankId: string | null;
  rankName: Record<string, string> | null;
  monthlyAmountEtb: number | null;
  month: number;
  year: number;
  status: SalaryPaymentListStatus;
  paymentId: string | null;
  amountPaidEtb: number | null;
};

export type SalaryPaymentListResponse = {
  month: number;
  year: number;
  items: SalaryPaymentListRow[];
  summary: {
    totalTeachers: number;
    listedCount: number;
    unpaidCount: number;
    totalDisbursedEtb: number;
  };
};

export type TeacherSalaryHistoryDTO = {
  teacherId: string;
  fullName: string;
  photoUrl: string | null;
  currentRank: {
    salaryRankId: string;
    rankName: Record<string, string>;
    monthlyAmountEtb: number;
  } | null;
  totalPaidThisYearEtb: number;
  items: Array<{
    id: string;
    month: number;
    year: number;
    salaryRankId: string;
    rankName: Record<string, string>;
    amountPaidEtb: number;
    bankReference: string;
    paymentDate: string;
    note: string | null;
    isAdjusted: boolean;
    adjustmentReason: string | null;
  }>;
};

export type NetworkSalaryOverviewItem = {
  month: number;
  year: number;
  teacherCount: number;
  paidCount: number;
  unpaidCount: number;
  totalDisbursedEtb: number;
};
