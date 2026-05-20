import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { useRecordFeePayment } from '../hooks/useFees';
import { formatEtb } from '../utils/money';
import { formatEthiopianMonthYear, getTodayCalendarEt } from '../utils/ethiopian';

export const RecordPaymentPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    studentId?: string;
    studentName?: string;
    medresaId?: string;
    month?: number;
    year?: number;
    amountDueEtb?: number;
  };

  const studentId = search.studentId ?? '';
  const medresaId = search.medresaId ?? '';
  const month = Number(search.month) || 1;
  const year = Number(search.year) || 2017;
  const amountDue = Number(search.amountDueEtb) || 0;

  const [amountPaid, setAmountPaid] = useState('');
  const [method, setMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [bankReference, setBankReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayCalendarEt());
  const [note, setNote] = useState('');

  const record = useRecordFeePayment();

  const back = () =>
    void navigate({ to: '/medresa/fees', search: { medresaId } });

  const onSubmit = async () => {
    const paid = Number.parseFloat(amountPaid);
    if (!studentId || !medresaId || !paid || paid <= 0) return;
    await record.mutateAsync({
      studentId,
      medresaId,
      month,
      year,
      amountPaidEtb: paid,
      paymentMethod: method,
      bankReference: method === 'BANK_TRANSFER' ? bankReference : undefined,
      paymentDate,
      note: note.trim() || undefined,
    });
    back();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('fees.recordPaymentTitle')}
        subtitle={search.studentName}
        onBack={back}
      />
      <PageBody>
        <div className="max-w-md space-y-4 rounded-xl border border-cream-dark bg-surface p-4">
          <p className="text-sm text-muted-foreground">
            {formatEthiopianMonthYear(month, year)}
          </p>
          <div>
            <p className="text-xs text-muted-foreground">{t('fees.amountDue')}</p>
            <p className="font-medium">{formatEtb(amountDue)}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('fees.amountPaid')}</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="field-input mt-1 w-full"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('fees.paymentMethod')}</p>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={method === 'CASH'}
                  onChange={() => setMethod('CASH')}
                />
                {t('fees.cash')}
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={method === 'BANK_TRANSFER'}
                  onChange={() => setMethod('BANK_TRANSFER')}
                />
                {t('fees.bankTransfer')}
              </label>
            </div>
          </div>
          {method === 'BANK_TRANSFER' ? (
            <div>
              <label className="text-xs text-muted-foreground">{t('fees.bankReference')}</label>
              <input
                className="field-input mt-1 w-full"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
              />
            </div>
          ) : null}
          <div>
            <label className="text-xs text-muted-foreground">{t('fees.paymentDate')}</label>
            <input
              type="date"
              className="field-input mt-1 w-full"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('fees.note')}</label>
            <textarea
              className="field-input mt-1 w-full min-h-[60px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-primary-inline w-full"
            disabled={record.isPending || !amountPaid}
            onClick={() => void onSubmit()}
          >
            {t('fees.submitPayment')}
          </button>
        </div>
      </PageBody>
    </div>
  );
};
