import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import {
  useCreateSalaryRank,
  useDeactivateSalaryRank,
  useSalaryRankHistory,
  useSalaryRanks,
} from '../hooks/useSalaries';
import { formatEtb } from '../utils/money';
import { getTodayCalendarEt } from '../utils/ethiopian';

type NameFields = { en: string; am: string; ar: string };
const emptyName = (): NameFields => ({ en: '', am: '', ar: '' });

export const SalaryRanksPage = () => {
  const { t } = useTranslation();
  const ranks = useSalaryRanks();
  const history = useSalaryRankHistory();
  const create = useCreateSalaryRank();
  const deactivate = useDeactivateSalaryRank();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState<NameFields>(emptyName());
  const [amount, setAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(getTodayCalendarEt());

  const onSave = async () => {
    const n = Number.parseFloat(amount);
    if (!name.en.trim() || !n || n <= 0) return;
    await create.mutateAsync({
      name: {
        en: name.en.trim(),
        ...(name.am.trim() ? { am: name.am.trim() } : {}),
        ...(name.ar.trim() ? { ar: name.ar.trim() } : {}),
      },
      monthlyAmountEtb: n,
      effectiveFrom,
    });
    setShowForm(false);
    setName(emptyName());
    setAmount('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('salaries.ranksTitle')}
        subtitle={t('salaries.ranksSubtitle')}
        actions={
          <div className="flex gap-2">
            <Link to="/admin/salaries" className="btn-secondary text-sm">
              {t('salaries.paymentList')}
            </Link>
            <button type="button" className="btn-primary-inline" onClick={() => setShowForm(true)}>
              {t('salaries.createRank')}
            </button>
          </div>
        }
      />
      <PageBody>
        {ranks.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('salaries.loading')}</p>
        ) : (
          <ul className="mb-6 space-y-2">
            {(ranks.data?.items ?? []).map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cream-dark bg-surface px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{getLocalizedValue(row.name)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEtb(row.monthlyAmountEtb)} · {t('salaries.teacherCount', { count: row.teacherCount ?? 0 })}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  disabled={deactivate.isPending}
                  onClick={() => void deactivate.mutateAsync(row.id)}
                >
                  {t('salaries.deactivate')}
                </button>
              </li>
            ))}
          </ul>
        )}

        {showForm ? (
          <div className="mb-6 rounded-xl border border-cream-dark bg-surface p-4 space-y-3">
            <h3 className="text-sm font-medium">{t('salaries.createRank')}</h3>
            <input
              className="field-input w-full"
              placeholder={t('salaries.nameEn')}
              value={name.en}
              onChange={(e) => setName((n) => ({ ...n, en: e.target.value }))}
            />
            <input
              type="number"
              className="field-input w-full"
              placeholder={t('salaries.monthlyAmountEtb')}
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
                {t('salaries.save')}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                {t('salaries.cancel')}
              </button>
            </div>
          </div>
        ) : null}

        <h3 className="text-sm font-medium mb-2">{t('salaries.historyTitle')}</h3>
        <ul className="space-y-2">
          {(history.data?.items ?? []).map((row) => (
            <li key={row.id} className="rounded-lg border border-cream-dark px-3 py-2 text-sm">
              {getLocalizedValue(row.name)} · {formatEtb(row.monthlyAmountEtb)} · {row.effectiveFrom}{' '}
              · {row.status}
            </li>
          ))}
        </ul>
      </PageBody>
    </div>
  );
};
