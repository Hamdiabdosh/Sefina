import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { StudentAvatar } from '../../students/components/StudentAvatar';
import { useMedresaContext } from '../../courses/hooks/useMedresaContext';
import { useFeeCollection } from '../hooks/useFees';
import { formatEtb } from '../utils/money';
import {
  formatEthiopianMonthYear,
  getCurrentEthiopianMonthYear,
} from '../utils/ethiopian';
import type { FeeCollectionStatus } from '../types';

const statusClass = (s: FeeCollectionStatus) => {
  switch (s) {
    case 'PAID':
      return 'bg-teal-50 text-teal-800';
    case 'PARTIAL':
      return 'bg-gold-50 text-[#8a6914]';
    default:
      return 'bg-[#FCEBEB] text-danger-text';
  }
};

export const FeeCollectionPage = () => {
  const { t } = useTranslation();
  const { medresaId, medresaName, adminMedresas, medresaScopeLoading } = useMedresaContext();
  const current = getCurrentEthiopianMonthYear();
  const [month, setMonth] = useState(current.month);
  const [year, setYear] = useState(current.year);
  const [statusFilter, setStatusFilter] = useState<'ALL' | FeeCollectionStatus>('ALL');

  const { data, isLoading } = useFeeCollection(
    medresaId,
    month,
    year,
    statusFilter,
    Boolean(medresaId)
  );

  if (medresaScopeLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('fees.collectionTitle')} subtitle={t('fees.loading')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('fees.collectionTitle')}
        subtitle={`${medresaName} · ${formatEthiopianMonthYear(month, year)}`}
      />
      <PageBody>
        {adminMedresas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('courses.noMedresaAccess')}</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-3 items-end">
              <label className="text-xs text-muted-foreground">
                {t('fees.ethiopianMonth')}
                <input
                  type="number"
                  min={1}
                  max={13}
                  className="field-input mt-1 block w-20"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                {t('fees.ethiopianYear')}
                <input
                  type="number"
                  className="field-input mt-1 block w-24"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </label>
            </div>

            {data?.summary ? (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-cream-dark bg-teal-50 p-3">
                  <p className="text-xs text-muted-foreground">{t('fees.collected')}</p>
                  <p className="text-lg font-medium text-teal-800">
                    {formatEtb(data.summary.totalCollectedEtb)}
                  </p>
                </div>
                <div className="rounded-xl border border-cream-dark bg-[#FCEBEB] p-3">
                  <p className="text-xs text-muted-foreground">{t('fees.outstanding')}</p>
                  <p className="text-lg font-medium text-danger-text">
                    {formatEtb(data.summary.totalOutstandingEtb)}
                  </p>
                </div>
              </div>
            ) : null}

            <FilterTabs
              value={statusFilter}
              onChange={setStatusFilter}
              tabs={[
                { value: 'ALL', label: t('fees.filterAll') },
                { value: 'PAID', label: t('fees.statusPaid') },
                { value: 'PARTIAL', label: t('fees.statusPartial') },
                { value: 'UNPAID', label: t('fees.statusUnpaid') },
              ]}
            />

            {isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">{t('fees.loading')}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {(data?.items ?? []).map((row) => (
                  <li
                    key={row.studentId}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-cream-dark bg-surface p-3"
                  >
                    <StudentAvatar
                      studentId={row.studentId}
                      name={row.fullName}
                      photoUrl={row.photoUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{row.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('fees.duePaidBalance', {
                          due: row.amountDueEtb,
                          paid: row.amountPaidEtb,
                          balance: row.balanceEtb,
                        })}
                      </p>
                    </div>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
                    >
                      {t(`fees.status${row.status}`)}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        to="/medresa/fees/record"
                        search={{
                          studentId: row.studentId,
                          studentName: row.fullName,
                          medresaId,
                          month,
                          year,
                          amountDueEtb: row.balanceEtb,
                        }}
                        className="text-xs text-teal-700 underline"
                      >
                        {t('fees.recordPayment')}
                      </Link>
                      <Link
                        to="/medresa/students/$studentId/fees"
                        params={{ studentId: row.studentId }}
                        search={{ medresaId }}
                        className="text-xs text-muted-foreground underline"
                      >
                        {t('fees.history')}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </PageBody>
    </div>
  );
};
