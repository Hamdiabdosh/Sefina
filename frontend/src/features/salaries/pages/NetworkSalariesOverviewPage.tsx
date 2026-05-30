import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { DataTable } from '../../../components/ui/DataTable';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { useNetworkSalaryOverview } from '../hooks/useSalaries';
import { formatEtb } from '../utils/money';
import { formatEthiopianMonthYear, getCurrentEthiopianMonthYear } from '../utils/ethiopian';

export const NetworkSalariesOverviewPage = () => {
  const { t } = useTranslation();
  const current = getCurrentEthiopianMonthYear();
  const range = {
    fromMonth: current.month,
    fromYear: current.year,
    toMonth: current.month,
    toYear: current.year,
  };
  const [fromMonth, setFromMonth] = useState(range.fromMonth);
  const [fromYear, setFromYear] = useState(range.fromYear);
  const [toMonth, setToMonth] = useState(range.toMonth);
  const [toYear, setToYear] = useState(range.toYear);

  const queryRange = { fromMonth, fromYear, toMonth, toYear };
  const { data, isLoading } = useNetworkSalaryOverview(queryRange);

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('salaries.networkTitle')} subtitle={t('salaries.networkSubtitle')} />
      <PageBody fullWidth>
        <div className="mb-4 flex flex-wrap gap-3 items-end">
          <label className="text-xs text-muted-foreground">
            {t('salaries.fromMonth')}
            <input
              type="number"
              min={1}
              max={13}
              className="field-input mt-1 block w-20"
              value={fromMonth}
              onChange={(e) => setFromMonth(Number(e.target.value))}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {t('salaries.fromYear')}
            <input
              type="number"
              className="field-input mt-1 block w-24"
              value={fromYear}
              onChange={(e) => setFromYear(Number(e.target.value))}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {t('salaries.toMonth')}
            <input
              type="number"
              min={1}
              max={13}
              className="field-input mt-1 block w-20"
              value={toMonth}
              onChange={(e) => setToMonth(Number(e.target.value))}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {t('salaries.toYear')}
            <input
              type="number"
              className="field-input mt-1 block w-24"
              value={toYear}
              onChange={(e) => setToYear(Number(e.target.value))}
            />
          </label>
        </div>
        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : (
          <DataTable>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-dark text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">{t('salaries.period')}</th>
                  <th className="p-3">{t('salaries.teachers')}</th>
                  <th className="p-3">{t('salaries.paid')}</th>
                  <th className="p-3">{t('salaries.unpaid')}</th>
                  <th className="p-3">{t('salaries.disbursed')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((row) => (
                  <tr key={`${row.year}-${row.month}`} className="border-b border-cream-dark/60">
                    <td className="p-3">{formatEthiopianMonthYear(row.month, row.year)}</td>
                    <td className="p-3">{row.teacherCount}</td>
                    <td className="p-3">{row.paidCount}</td>
                    <td className="p-3">{row.unpaidCount}</td>
                    <td className="p-3">{formatEtb(row.totalDisbursedEtb)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </DataTable>
        )}
      </PageBody>
    </div>
  );
};
