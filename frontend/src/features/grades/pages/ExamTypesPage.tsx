import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { ContentCard } from '../../../components/ui/ContentCard';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { useCreateExamType, useExamTypes, useUpdateExamType } from '../hooks/useGrades';
import type { ExamTypeDTO } from '../types';

type NameFields = { en: string; am: string; ar: string };

const emptyName = (): NameFields => ({ en: '', am: '', ar: '' });

const nameFromDto = (name: ExamTypeDTO['name']): NameFields => ({
  en: typeof name === 'object' && name && 'en' in name ? String(name.en ?? '') : '',
  am: typeof name === 'object' && name && 'am' in name ? String(name.am ?? '') : '',
  ar: typeof name === 'object' && name && 'ar' in name ? String(name.ar ?? '') : '',
});

export const ExamTypesPage = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useExamTypes();
  const createMutation = useCreateExamType();
  const updateMutation = useUpdateExamType();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExamTypeDTO | null>(null);
  const [name, setName] = useState<NameFields>(emptyName());
  const [maxScore, setMaxScore] = useState(100);
  const [weight, setWeight] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const items = data?.items ?? [];
  const activeWeight = items
    .filter((i) => i.status === 'ACTIVE')
    .reduce((s, i) => s + i.weight, 0);

  const openCreate = () => {
    setEditing(null);
    setName(emptyName());
    setMaxScore(100);
    setWeight(0);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (et: ExamTypeDTO) => {
    setEditing(et);
    setName(nameFromDto(et.name));
    setMaxScore(et.maxScore);
    setWeight(et.weight);
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError(null);
  };

  const apiErrorMessage = (err: unknown): string => {
    const ax = err as { response?: { data?: { error?: { code?: string } } } };
    const code = ax.response?.data?.error?.code;
    if (code === 'WEIGHT_SUM_INVALID') return t('grades.weightSumInvalid');
    return t('grades.saveFailed');
  };

  const onSave = async () => {
    if (!name.en.trim()) return;
    setFormError(null);
    const payload = {
      name: {
        en: name.en.trim(),
        ...(name.am.trim() ? { am: name.am.trim() } : {}),
        ...(name.ar.trim() ? { ar: name.ar.trim() } : {}),
      },
      maxScore,
      weight,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createMutation.mutateAsync({ ...payload, status: 'ACTIVE' });
      }
      closeForm();
    } catch (e) {
      setFormError(apiErrorMessage(e));
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('grades.examTypesTitle')}
        subtitle={t('grades.examTypesSubtitle', { sum: activeWeight })}
        actions={
          <button type="button" className="btn-primary-inline" onClick={openCreate}>
            {t('grades.addExamType')}
          </button>
        }
      />
      <PageBody>
        {activeWeight !== 100 ? (
          <p className="mb-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {t('grades.weightSumWarning', { sum: activeWeight })}
          </p>
        ) : null}

        {showForm ? (
          <div className="mb-4 rounded-xl border border-cream-dark bg-surface p-4 space-y-3">
            <h3 className="text-sm font-medium text-teal-800">
              {editing ? t('grades.editExamType') : t('grades.addExamType')}
            </h3>
            <input
              className="field-input w-full"
              placeholder={t('grades.nameEn')}
              value={name.en}
              onChange={(e) => setName((n) => ({ ...n, en: e.target.value }))}
            />
            <input
              className="field-input w-full"
              placeholder={t('grades.nameAm')}
              value={name.am}
              onChange={(e) => setName((n) => ({ ...n, am: e.target.value }))}
            />
            <input
              className="field-input w-full"
              placeholder={t('grades.nameAr')}
              value={name.ar}
              onChange={(e) => setName((n) => ({ ...n, ar: e.target.value }))}
            />
            <div className="flex gap-3">
              <input
                type="number"
                className="field-input"
                placeholder={t('grades.maxScoreLabel')}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
              />
              <input
                type="number"
                className="field-input"
                placeholder={t('grades.weightLabel')}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </div>
            {formError ? <p className="text-xs text-danger-text">{formError}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary-inline"
                disabled={!name.en.trim() || createMutation.isPending || updateMutation.isPending}
                onClick={() => void onSave()}
              >
                {t('grades.save')}
              </button>
              <button type="button" className="btn-secondary" onClick={closeForm}>
                {t('grades.cancel')}
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : (
          <ul className="space-y-2">
            {items.map((et) => (
              <li key={et.id}>
                <ContentCard>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{getLocalizedValue(et.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('grades.maxScore', { max: et.maxScore })} ·{' '}
                        {t('grades.weight', { w: et.weight })} · {et.status}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        className="text-xs text-teal-700 underline"
                        onClick={() => openEdit(et)}
                      >
                        {t('grades.edit')}
                      </button>
                      {et.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline"
                          onClick={() =>
                            void updateMutation.mutateAsync({ id: et.id, status: 'INACTIVE' })
                          }
                        >
                          {t('grades.deactivate')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-teal-700 underline"
                          onClick={() =>
                            void updateMutation.mutateAsync({ id: et.id, status: 'ACTIVE' })
                          }
                        >
                          {t('grades.activate')}
                        </button>
                      )}
                    </div>
                  </div>
                </ContentCard>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </div>
  );
};
