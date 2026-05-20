import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { useNetworkFeeOverview } from '../hooks/useFees';
import { formatEtb } from '../utils/money';
import { formatEthiopianMonthYear, getCurrentEthiopianMonthYear } from '../utils/ethiopian';

export const NetworkFeesOverviewPage = () => {
  const { t } = useTranslation();
  const current = getCurrentEthiopianMonthYear();
  const range = {
    fromMonth: current.month,
    fromYear: current.year,
    toMonth: current.month,
    toYear: current.year,
  };
  const [medresaFilter, setMedresaFilter] = useState('ALL');
  const { data, isLoading } = useNetworkFeeOverview(range, undefined, true);

  const items = data?.items ?? [];
  const medresaTabs = useMemo(
    () => [
      { value: 'ALL', label: t('fees.filterAllMedresas') },
      ...[...new Map(items.map((i) => [i.medresaId, i.medresaName])).entries()].map(
        ([id, name]) => ({ value: id, label: name })
      ),
    ],
    [items, t]
  );

  const filtered =
    medresaFilter === 'ALL' ? items : items.filter((i) => i.medresaId === medresaFilter);

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('fees.networkTitle')} subtitle={formatEthiopianMonthYear(current.month, current.year)} />
      <PageBody fullWidth>
        <div className="mb-4">
          <FilterTabs value={medresaFilter} onChange={setMedresaFilter} tabs={medresaTabs} />
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('fees.loading')}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-cream-dark bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-dark text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">{t('fees.medresa')}</th>
                  <th className="p-3">{t('fees.period')}</th>
                  <th className="p-3">{t('fees.due')}</th>
                  <th className="p-3">{t('fees.collected')}</th>
                  <th className="p-3">{t('fees.outstanding')}</th>
                  <th className="p-3">{t('fees.collectionRate')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={`${r.medresaId}-${r.month}-${r.year}`} className="border-b border-cream-dark/60">
                    <td className="p-3">{r.medresaName}</td>
                    <td className="p-3">{formatEthiopianMonthYear(r.month, r.year)}</td>
                    <td className="p-3 tabular-nums">{formatEtb(r.totalDueEtb)}</td>
                    <td className="p-3 tabular-nums">{formatEtb(r.totalCollectedEtb)}</td>
                    <td className="p-3 tabular-nums">{formatEtb(r.totalOutstandingEtb)}</td>
                    <td className="p-3 tabular-nums">
                      {r.collectionRatePercent !== null ? `${r.collectionRatePercent}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </div>
  );
};
