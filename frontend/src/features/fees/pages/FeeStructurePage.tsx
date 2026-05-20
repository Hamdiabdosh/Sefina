import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { ContentCard } from '../../../components/ui/ContentCard';
import {
  useActiveFeeStructure,
  useCreateFeeStructure,
  useFeeStructures,
} from '../hooks/useFees';
import { formatEtb } from '../utils/money';
import { getTodayCalendarEt } from '../utils/ethiopian';

export const FeeStructurePage = () => {
  const { t } = useTranslation();
  const active = useActiveFeeStructure();
  const history = useFeeStructures();
  const create = useCreateFeeStructure();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(getTodayCalendarEt());

  const onSave = async () => {
    const n = Number.parseFloat(amount);
    if (!n || n <= 0) return;
    await create.mutateAsync({ monthlyAmountEtb: n, effectiveFrom });
    setShowForm(false);
    setAmount('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('fees.structureTitle')}
        subtitle={t('fees.structureSubtitle')}
        actions={
          <button type="button" className="btn-primary-inline" onClick={() => setShowForm(true)}>
            {t('fees.setNewFee')}
          </button>
        }
      />
      <PageBody>
        {active.data ? (
          <ContentCard className="mb-4">
            <p className="text-xs text-muted-foreground">{t('fees.currentMonthlyFee')}</p>
            <p className="text-2xl font-medium text-teal-800">
              {formatEtb(active.data.monthlyAmountEtb)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('fees.effectiveFrom', { date: active.data.effectiveFrom })}
            </p>
          </ContentCard>
        ) : (
          <p className="mb-4 text-sm text-amber-800">{t('fees.noActiveStructure')}</p>
        )}

        {showForm ? (
          <div className="mb-6 rounded-xl border border-cream-dark bg-surface p-4 space-y-3">
            <h3 className="text-sm font-medium">{t('fees.setNewFee')}</h3>
            <input
              type="number"
              className="field-input w-full"
              placeholder={t('fees.monthlyAmountEtb')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              type="date"
              className="field-input w-full"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="button" className="btn-primary-inline" onClick={() => void onSave()}>
                {t('fees.save')}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                {t('fees.cancel')}
              </button>
            </div>
          </div>
        ) : null}

        <h3 className="text-sm font-medium mb-2">{t('fees.historyTitle')}</h3>
        {history.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('fees.loading')}</p>
        ) : (
          <ul className="space-y-2">
            {(history.data?.items ?? []).map((row) => (
              <li key={row.id} className="rounded-lg border border-cream-dark px-3 py-2 text-sm">
                {formatEtb(row.monthlyAmountEtb)} · {row.effectiveFrom} · {row.status}
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </div>
  );
};
