import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssignTeacherRank, useSalaryRanks } from '../hooks/useSalaries';
import { getTodayCalendarEt } from '../utils/ethiopian';

type Props = {
  teacherId: string;
  teacherName: string;
  onClose: () => void;
};

export const AssignRankModal = ({ teacherId, teacherName, onClose }: Props) => {
  const { t } = useTranslation();
  const ranks = useSalaryRanks();
  const assign = useAssignTeacherRank();
  const [salaryRankId, setSalaryRankId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(getTodayCalendarEt());

  const onSubmit = async () => {
    if (!salaryRankId) return;
    await assign.mutateAsync({ teacherId, salaryRankId, effectiveFrom });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-cream-dark bg-surface p-4 shadow-lg">
        <h3 className="text-sm font-medium text-teal-800">{t('salaries.assignRankTitle')}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{teacherName}</p>
        <div className="mt-4 space-y-3">
          <label className="block text-xs text-muted-foreground">
            {t('salaries.selectRank')}
            <select
              className="field-input mt-1 w-full"
              value={salaryRankId}
              onChange={(e) => setSalaryRankId(e.target.value)}
            >
              <option value="">{t('salaries.selectRankPlaceholder')}</option>
              {(ranks.data?.items ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {(r.name.en as string) ?? r.id} — {r.monthlyAmountEtb} ETB
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            {t('salaries.effectiveFrom')}
            <input
              type="date"
              className="field-input mt-1 w-full"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('salaries.cancel')}
          </button>
          <button
            type="button"
            className="btn-primary-inline"
            disabled={!salaryRankId || assign.isPending}
            onClick={() => void onSubmit()}
          >
            {t('salaries.assignRank')}
          </button>
        </div>
      </div>
    </div>
  );
};
