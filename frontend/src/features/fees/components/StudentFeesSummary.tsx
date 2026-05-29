import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { formatEtb } from '../utils/money';

type FeeStatus = {
  status: string;
  outstandingBalanceEtb: number;
  month: number;
  year: number;
};

type Props = {
  studentId: string;
  medresaId: string;
  feeStatus: FeeStatus | null;
};

export const StudentFeesSummary = ({ studentId, medresaId, feeStatus }: Props) => {
  const { t } = useTranslation();

  if (!feeStatus) {
    return <p className="text-xs text-muted-foreground">{t('fees.noFeeData')}</p>;
  }

  return (
    <div className="space-y-1">
      <p className="text-sm">
        {t(`fees.status${feeStatus.status}`)} ·{' '}
        {t('fees.outstandingShort', { amount: formatEtb(feeStatus.outstandingBalanceEtb) })}
      </p>
      <Link
        to="/medresa/students/$studentId"
        params={{ studentId }}
        search={{ medresaId, tab: 'fees' }}
        className="text-xs text-teal-700 underline"
      >
        {t('fees.viewHistory')}
      </Link>
    </div>
  );
};
