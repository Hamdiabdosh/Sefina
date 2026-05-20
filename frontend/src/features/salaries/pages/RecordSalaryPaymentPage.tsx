import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { useRecordSalaryPayment } from '../hooks/useSalaries';
import { formatEtb } from '../utils/money';
import { formatEthiopianMonthYear, getTodayCalendarEt } from '../utils/ethiopian';

export const RecordSalaryPaymentPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    teacherId?: string;
    teacherName?: string;
    month?: number;
    year?: number;
    amountEtb?: number;
  };

  const teacherId = search.teacherId ?? '';
  const month = Number(search.month) || 1;
  const year = Number(search.year) || 2017;
  const rankAmount = Number(search.amountEtb) || 0;

  const [amountPaid, setAmountPaid] = useState(rankAmount ? String(rankAmount) : '');
  const [bankReference, setBankReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayCalendarEt());
  const [note, setNote] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const record = useRecordSalaryPayment();

  useEffect(() => {
    if (rankAmount && !amountPaid) setAmountPaid(String(rankAmount));
  }, [rankAmount, amountPaid]);

  const paidNum = Number.parseFloat(amountPaid);
  const needsAdjustment =
    rankAmount > 0 && paidNum > 0 && Math.abs(paidNum - rankAmount) > 0.001;

  const back = () => void navigate({ to: '/admin/salaries' });

  const onSubmit = async () => {
    if (!teacherId || !paidNum || paidNum <= 0 || !bankReference.trim()) return;
    if (needsAdjustment && !adjustmentReason.trim()) return;
    await record.mutateAsync({
      teacherId,
      month,
      year,
      amountPaidEtb: paidNum,
      bankReference: bankReference.trim(),
      paymentDate,
      note: note.trim() || undefined,
      adjustmentReason: needsAdjustment ? adjustmentReason.trim() : undefined,
    });
    back();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('salaries.recordPaymentTitle')}
        subtitle={search.teacherName}
        onBack={back}
      />
      <PageBody>
        <div className="max-w-md space-y-4 rounded-xl border border-cream-dark bg-surface p-4">
          <p className="text-sm text-muted-foreground">{formatEthiopianMonthYear(month, year)}</p>
          {rankAmount > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground">{t('salaries.rankAmount')}</p>
              <p className="font-medium">{formatEtb(rankAmount)}</p>
            </div>
          ) : null}
          <div>
            <label className="text-xs text-muted-foreground">{t('salaries.amountPaid')}</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="field-input mt-1 w-full"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
          </div>
          {needsAdjustment ? (
            <div>
              <p className="text-xs text-amber-800 mb-1">{t('salaries.adjustmentWarning')}</p>
              <label className="text-xs text-muted-foreground">{t('salaries.adjustmentReason')}</label>
              <textarea
                className="field-input mt-1 w-full min-h-[60px]"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          ) : null}
          <div>
            <label className="text-xs text-muted-foreground">{t('salaries.bankReference')}</label>
            <input
              className="field-input mt-1 w-full"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('salaries.paymentDate')}</label>
            <input
              type="date"
              className="field-input mt-1 w-full"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('salaries.note')}</label>
            <textarea
              className="field-input mt-1 w-full min-h-[60px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-primary-inline w-full"
            disabled={record.isPending || !amountPaid || !bankReference.trim()}
            onClick={() => void onSubmit()}
          >
            {t('salaries.submitPayment')}
          </button>
        </div>
      </PageBody>
    </div>
  );
};
