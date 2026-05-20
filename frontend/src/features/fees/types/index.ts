export type FeeCollectionStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export type FeeStructureDTO = {
  id: string;
  monthlyAmountEtb: number;
  effectiveFrom: string;
  status: string;
  createdAt: string;
};

export type FeeCollectionRow = {
  studentId: string;
  fullName: string;
  photoUrl: string | null;
  month: number;
  year: number;
  amountDueEtb: number;
  amountPaidEtb: number;
  balanceEtb: number;
  status: FeeCollectionStatus;
};

export type FeeCollectionResponse = {
  month: number;
  year: number;
  summary: {
    totalDueEtb: number;
    totalCollectedEtb: number;
    totalOutstandingEtb: number;
    studentCount: number;
  };
  items: FeeCollectionRow[];
};

export type FeePaymentDTO = {
  id: string;
  studentId: string;
  medresaId: string;
  month: number;
  year: number;
  amountDueEtb: number;
  amountPaidEtb: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  bankReference: string | null;
  paymentDate: string;
  note: string | null;
  recordedAt: string;
};

export type StudentFeeHistoryDTO = {
  studentId: string;
  fullName: string;
  totalDueEtb: number;
  totalPaidEtb: number;
  outstandingBalanceEtb: number;
  payments: FeePaymentDTO[];
};
