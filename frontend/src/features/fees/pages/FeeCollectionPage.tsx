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
              <div className="mt-3 overflow-x-auto rounded-lg border border-cream-dark bg-surface">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-cream-dark bg-cream/80 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-1.5 sm:px-3">{t('fees.colStudent')}</th>
                      <th className="hidden px-2 py-1.5 text-right sm:table-cell sm:px-3">
                        {t('fees.colDue')}
                      </th>
                      <th className="hidden px-2 py-1.5 text-right md:table-cell md:px-3">
                        {t('fees.colPaid')}
                      </th>
                      <th className="px-2 py-1.5 text-right sm:px-3">{t('fees.colBalance')}</th>
                      <th className="px-2 py-1.5 sm:px-3">{t('fees.colStatus')}</th>
                      <th className="px-2 py-1.5 text-right sm:px-3">{t('fees.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.items ?? []).map((row) => (
                      <tr
                        key={row.studentId}
                        className="border-b border-cream-dark/60 last:border-0 hover:bg-cream/40"
                      >
                        <td className="px-2 py-1.5 sm:px-3">
                          <div className="flex items-center gap-2">
                            <StudentAvatar
                              studentId={row.studentId}
                              name={row.fullName}
                              photoUrl={row.photoUrl}
                              size="sm"
                            />
                            <span className="min-w-0 truncate font-medium leading-tight">
                              {row.fullName}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-muted-foreground sm:hidden">
                            {t('fees.duePaidBalance', {
                              due: row.amountDueEtb,
                              paid: row.amountPaidEtb,
                              balance: row.balanceEtb,
                            })}
                          </p>
                        </td>
                        <td className="hidden px-2 py-1.5 text-right tabular-nums sm:table-cell sm:px-3">
                          {formatEtb(row.amountDueEtb)}
                        </td>
                        <td className="hidden px-2 py-1.5 text-right tabular-nums md:table-cell md:px-3">
                          {formatEtb(row.amountPaidEtb)}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums font-medium sm:px-3">
                          {formatEtb(row.balanceEtb)}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3">
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${statusClass(row.status)}`}
                          >
                            {t(`fees.status${row.status}`)}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right sm:px-3">
                          <div className="flex flex-col items-end gap-0.5">
                            <Link
                              to="/medresa/fees/record"
                              search={{
                                studentId: row.studentId,
                                studentName: row.fullName,
                                medresaId,
                                month,
                                year,
                                amountDueEtb: row.balanceEtb,
                                returnTab: undefined,
                              }}
                              className="text-[11px] text-teal-700 underline"
                            >
                              {t('fees.recordPayment')}
                            </Link>
                            <Link
                              to="/medresa/students/$studentId"
                              params={{ studentId: row.studentId }}
                              search={{ medresaId, tab: 'fees' }}
                              className="text-[10px] text-muted-foreground underline"
                            >
                              {t('fees.history')}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </PageBody>
    </div>
  );
};
