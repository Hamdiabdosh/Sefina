import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { DataTable } from '../../../components/ui/DataTable';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { useMedresaContext } from '../../courses/hooks/useMedresaContext';
import { useStudentFeeHistory } from '../hooks/useFees';
import { formatEtb } from '../utils/money';
import { formatEthiopianMonthYear } from '../utils/ethiopian';

export const StudentFeeHistoryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { studentId } = useParams({ strict: false }) as { studentId: string };
  const search = useSearch({ strict: false }) as { medresaId?: string };
  const { medresaId: ctxMedresaId } = useMedresaContext();
  const medresaId = search.medresaId ?? ctxMedresaId;

  const { data, isLoading } = useStudentFeeHistory(medresaId, studentId, Boolean(medresaId && studentId));

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('fees.historyTitle')}
        subtitle={data?.fullName}
        onBack={() => void navigate({ to: '/medresa/fees', search: { medresaId } })}
      />
      <PageBody>
        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : !data ? null : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg border border-cream-dark p-2">
                <p className="text-xs text-muted-foreground">{t('fees.totalDue')}</p>
                <p className="font-medium">{formatEtb(data.totalDueEtb)}</p>
              </div>
              <div className="rounded-lg border border-cream-dark p-2">
                <p className="text-xs text-muted-foreground">{t('fees.totalPaid')}</p>
                <p className="font-medium">{formatEtb(data.totalPaidEtb)}</p>
              </div>
              <div className="rounded-lg border border-cream-dark p-2">
                <p className="text-xs text-muted-foreground">{t('fees.outstanding')}</p>
                <p className="font-medium text-danger-text">
                  {formatEtb(data.outstandingBalanceEtb)}
                </p>
              </div>
            </div>
            <Link
              to="/medresa/fees/record"
              search={{
                studentId,
                studentName: data.fullName,
                medresaId,
                month: data.payments[0]?.month ?? 1,
                year: data.payments[0]?.year ?? 2017,
                amountDueEtb: data.outstandingBalanceEtb,
                returnTab: 'fees',
              }}
              className="inline-block mb-4 text-sm text-teal-700 underline"
            >
              {t('fees.recordPayment')}
            </Link>
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
          </>
        )}
      </PageBody>
    </div>
  );
};
