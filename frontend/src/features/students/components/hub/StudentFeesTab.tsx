import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../../../components/ui/DataTable';
import { SkeletonTable } from '../../../../components/ui/Skeleton';
import { useStudentFeeHistory } from '../../../fees/hooks/useFees';
import { formatEtb } from '../../../fees/utils/money';
import { formatEthiopianMonthYear, getCurrentEthiopianMonthYear } from '../../../fees/utils/ethiopian';

type Props = {
  studentId: string;
  medresaId: string;
  studentName: string;
};

export const StudentFeesTab = ({ studentId, medresaId, studentName }: Props) => {
  const { t } = useTranslation();
  const current = getCurrentEthiopianMonthYear();
  const { data, isLoading } = useStudentFeeHistory(medresaId, studentId, Boolean(medresaId && studentId));

  if (isLoading) {
    return <SkeletonTable rows={4} />;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">{t('fees.noFeeData')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-lg border border-cream-dark bg-surface p-2">
          <p className="text-xs text-muted-foreground">{t('fees.totalDue')}</p>
          <p className="font-medium">{formatEtb(data.totalDueEtb)}</p>
        </div>
        <div className="rounded-lg border border-cream-dark bg-surface p-2">
          <p className="text-xs text-muted-foreground">{t('fees.totalPaid')}</p>
          <p className="font-medium">{formatEtb(data.totalPaidEtb)}</p>
        </div>
        <div className="rounded-lg border border-cream-dark bg-surface p-2">
          <p className="text-xs text-muted-foreground">{t('fees.outstanding')}</p>
          <p className="font-medium text-danger-text">{formatEtb(data.outstandingBalanceEtb)}</p>
        </div>
      </div>

      <Link
        to="/medresa/fees/record"
        search={{
          studentId,
          studentName: studentName || data.fullName,
          medresaId,
          month: current.month,
          year: current.year,
          amountDueEtb: data.outstandingBalanceEtb,
          returnTab: 'fees' as const,
        }}
        className="btn-primary-inline inline-flex text-sm"
      >
        {t('fees.recordPayment')}
      </Link>

      {data.payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('students.hub.noPayments')}</p>
      ) : (
        <DataTable>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-dark text-left text-xs uppercase text-muted-foreground">
                <th className="p-3">{t('fees.period')}</th>
                <th className="p-3">{t('fees.amountPaid')}</th>
                <th className="p-3">{t('fees.paymentMethod')}</th>
                <th className="p-3">{t('fees.paymentDate')}</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.id} className="border-b border-cream-dark/60">
                  <td className="p-3">{formatEthiopianMonthYear(p.month, p.year)}</td>
                  <td className="p-3 tabular-nums">{formatEtb(p.amountPaidEtb)}</td>
                  <td className="p-3">{p.paymentMethod}</td>
                  <td className="p-3">{p.paymentDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </DataTable>
      )}
    </div>
  );
};
