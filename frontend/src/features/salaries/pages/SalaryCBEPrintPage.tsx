import { Link, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { useSalaryPayments } from '../hooks/useSalaries';
import { formatEthiopianMonthYear } from '../utils/ethiopian';
import type { SalaryBreakdown, SalaryPaymentListRow } from '../types';

const formatAmount = (amount: number): string =>
  amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const roleLabel = (breakdown: SalaryBreakdown | null): string => {
  if (breakdown === 'ADMIN_ONLY') return 'Admin';
  if (breakdown === 'TEACHER_ADMIN_COMBINED') return 'Ustag + Admin';
  return 'Ustag';
};

export const SalaryCBEPrintPage = () => {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as { month?: number; year?: number };
  const month = search.month ?? 1;
  const year = search.year ?? 2017;

  const { data, isLoading } = useSalaryPayments(month, year, 'ALL', undefined);

  const rows = (data?.items ?? []).filter(
    (row): row is SalaryPaymentListRow & { monthlyAmountEtb: number } =>
      row.monthlyAmountEtb != null && row.monthlyAmountEtb > 0
  );

  const grandTotal = rows.reduce((sum, row) => sum + row.monthlyAmountEtb, 0);
  const preparedDate = new Date().toLocaleDateString('en-GB', {
    timeZone: 'Africa/Addis_Ababa',
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <div className="print:hidden">
        <PageTopBar
          title={t('salaries.cbeOrderTitle')}
          subtitle={formatEthiopianMonthYear(month, year)}
          onBack={() => window.history.back()}
          actions={
            <button type="button" className="btn-primary" onClick={() => window.print()}>
              {t('salaries.printButton')}
            </button>
          }
        />
      </div>

      <PageBody>
        {isLoading ? (
          <p className="print:hidden text-muted-foreground">{t('salaries.loading')}</p>
        ) : (
          <div className="cbe-print-document mx-auto max-w-4xl bg-white p-8 font-serif text-[11pt] text-black print:block print:p-0">
            <header className="mb-6 border-b border-[#999] pb-4">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-wide">
                    Harari Medresa Network
                  </h1>
                  <p className="text-sm">Harar, Ethiopia</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Sefinatu Nejah</p>
                  <p dir="rtl" className="text-sm">
                    سَفِينَةُ النَّجَاحِ
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                <p className="text-base font-bold uppercase">{t('salaries.cbeOrderTitle')}</p>
                <p>Via: Commercial Bank of Ethiopia (CBE)</p>
                <p>
                  Period: {formatEthiopianMonthYear(month, year)} (Ethiopian Calendar)
                </p>
                <p>
                  {t('salaries.printDate')}: {preparedDate}
                </p>
              </div>
            </header>

            <table className="mb-6 w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-[#999] px-2 py-1 text-left">No.</th>
                  <th className="border border-[#999] px-2 py-1 text-left">Teacher Name</th>
                  <th className="border border-[#999] px-2 py-1 text-left">CBE Account</th>
                  <th className="border border-[#999] px-2 py-1 text-left">Role</th>
                  <th className="border border-[#999] px-2 py-1 text-right">Amount ETB</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.teacherId}
                    className={!row.cbeAccount ? 'bg-amber-50 print:bg-amber-50' : undefined}
                  >
                    <td className="border border-[#999] px-2 py-1">{index + 1}</td>
                    <td className="border border-[#999] px-2 py-1">{row.fullName}</td>
                    <td className="border border-[#999] px-2 py-1">{row.cbeAccount ?? '—'}</td>
                    <td className="border border-[#999] px-2 py-1">{roleLabel(row.breakdown)}</td>
                    <td className="border border-[#999] px-2 py-1 text-right">
                      {formatAmount(row.monthlyAmountEtb)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={4}
                    className="border border-[#999] px-2 py-2 text-right font-bold uppercase"
                  >
                    {t('salaries.grandTotal')}
                  </td>
                  <td className="border border-[#999] px-2 py-2 text-right font-bold">
                    {formatAmount(grandTotal)} ETB
                  </td>
                </tr>
              </tfoot>
            </table>

            <footer className="space-y-6 border-t border-[#999] pt-4 text-sm">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p>{t('salaries.authorisedBy')}: _____________________</p>
                  <p className="mt-4">Date: _____________________</p>
                </div>
                <div>
                  <p>Position: Super Admin</p>
                </div>
              </div>
              <p dir="rtl" className="text-center text-base">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <p className="text-center text-xs text-[#666]">
                Harari Medresa Network · Harar · Ethiopia
              </p>
            </footer>
          </div>
        )}

        <div className="mt-4 print:hidden">
          <Link to="/admin/salaries" className="text-sm text-teal-700 underline">
            {t('salaries.paymentList')}
          </Link>
        </div>
      </PageBody>
    </div>
  );
};
