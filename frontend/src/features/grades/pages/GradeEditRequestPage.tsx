import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { useCreateGradeEditRequest } from '../hooks/useGrades';

export const GradeEditRequestPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    gradeId?: string;
    currentScore?: string;
    studentName?: string;
    examTypeName?: string;
    medresaCourseId?: string;
    examTypeId?: string;
  };

  const gradeId = search.gradeId ?? '';
  const currentScore = search.currentScore ?? '';
  const studentName = search.studentName ?? '';
  const examTypeName = search.examTypeName ?? '';
  const medresaCourseId = search.medresaCourseId ?? '';
  const examTypeId = search.examTypeId ?? '';

  const [requestedScore, setRequestedScore] = useState('');
  const [reason, setReason] = useState('');
  const createRequest = useCreateGradeEditRequest();

  const backToEntry = () =>
    void navigate({
      to: '/teacher/grades/entry',
      search: { medresaCourseId, examTypeId },
    });

  const onSubmit = async () => {
    if (!gradeId || !requestedScore.trim() || !reason.trim()) return;
    await createRequest.mutateAsync({
      gradeId,
      requestedScore: Number.parseInt(requestedScore, 10),
      reason: reason.trim(),
    });
    backToEntry();
  };

  if (!gradeId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('grades.editRequestTitle')} />
        <PageBody>
          <Link to="/teacher/grades" className="text-sm text-teal-700 underline">
            {t('grades.backToHub')}
          </Link>
        </PageBody>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('grades.editRequestTitle')}
        subtitle={t('grades.editRequestSubtitle')}
        onBack={backToEntry}
      />
      <PageBody>
        <div className="max-w-md space-y-4 rounded-xl border border-cream-dark bg-surface p-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('grades.student')}</p>
            <p className="font-medium">{studentName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('grades.examTypeLabel')}</p>
            <p className="font-medium">{examTypeName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('grades.currentScore')}</p>
            <p className="font-medium tabular-nums">{currentScore}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('grades.newScore')}</label>
            <input
              type="number"
              min={0}
              className="field-input mt-1 w-full"
              value={requestedScore}
              onChange={(e) => setRequestedScore(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('grades.reasonLabel')}</label>
            <textarea
              className="field-input mt-1 w-full min-h-[80px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('grades.reasonPlaceholder')}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('grades.editRequestHint')}</p>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={backToEntry}>
              {t('grades.cancel')}
            </button>
            <button
              type="button"
              className="btn-primary-inline flex-1"
              disabled={
                createRequest.isPending ||
                !requestedScore.trim() ||
                !reason.trim()
              }
              onClick={() => void onSubmit()}
            >
              {t('grades.submitEditRequest')}
            </button>
          </div>
        </div>
      </PageBody>
    </div>
  );
};
