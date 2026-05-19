import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MedresaCourseListItem } from '../types';
import type { useMedresaCourses } from '../hooks/useMedresaCourses';

type AssignTeacherModalProps = {
  open: boolean;
  onClose: () => void;
  course: MedresaCourseListItem | null;
  teachers: Array<{ id: string; fullName: string; email: string }>;
  assignTeacher: ReturnType<typeof useMedresaCourses>['assignTeacher'];
};

export const AssignTeacherModal = ({
  open,
  onClose,
  course,
  teachers,
  assignTeacher,
}: AssignTeacherModalProps) => {
  const { t } = useTranslation();
  const [teacherId, setTeacherId] = useState('');

  if (!open || !course) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;
    assignTeacher.mutate(
      { medresaCourseId: course.medresaCourseId, teacherId },
      {
        onSuccess: () => {
          setTeacherId('');
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <h3 className="text-lg font-medium text-teal-800 mb-4">{t('courses.assignTeacherTitle')}</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="field-label">{t('courses.form.teacher')}</label>
            <select
              className="field-input"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
            >
              <option value="">{t('courses.selectTeacher')}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </div>
          {teachers.length === 0 && (
            <p className="text-xs text-danger-text">{t('courses.noTeachersInMedresa')}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {t('courses.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={assignTeacher.isPending || !teacherId}
            >
              {assignTeacher.isPending ? t('courses.saving') : t('courses.assign')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
