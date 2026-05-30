import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { getMedresaRoleLabel } from '../../auth/utils/medresaRoleLabel';
import { useMedresas } from '../../medresas/hooks/useMedresas';
import { StaffCredentialsFields } from './StaffCredentialsFields';
import { TeacherFormFields } from './TeacherFormFields';
import {
  createTeacherFormSchema,
  getTeacherMutationError,
  toTeacherApiPayload,
  type CreateTeacherFormValues,
} from '../schemas/teacher.schemas';
import type { useTeachers } from '../hooks/useTeachers';

type CreateTeacherModalProps = {
  open: boolean;
  onClose: () => void;
  createTeacher: ReturnType<typeof useTeachers>['createTeacher'];
  uploadPhoto: ReturnType<typeof useTeachers>['uploadPhoto'];
};

const defaultValues: CreateTeacherFormValues = {
  fullName: '',
  phone: '',
  email: '',
  specializationEn: '',
  specializationAm: '',
  specializationAr: '',
  dateJoined: new Date().toISOString().slice(0, 10),
  cbeAccount: '',
  assignToMedresa: false,
  medresaId: '',
  assignmentRole: 'TEACHER',
  assignmentDate: new Date().toISOString().slice(0, 10),
  setTemporaryPassword: false,
  temporaryPassword: '',
  confirmTemporaryPassword: '',
  sendInviteEmail: false,
};

export const CreateTeacherModal = ({
  open,
  onClose,
  createTeacher,
  uploadPhoto,
}: CreateTeacherModalProps) => {
  const { t } = useTranslation();
  const { medresas, isLoading: medresasLoading } = useMedresas();
  const activeMedresas = medresas.filter((m) => m.status === 'ACTIVE');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateTeacherFormValues>({
    resolver: zodResolver(createTeacherFormSchema),
    defaultValues,
  });

  const assignToMedresa = watch('assignToMedresa');

  if (!open) return null;

  const onSubmit = (data: CreateTeacherFormValues) => {
    createTeacher.mutate(toTeacherApiPayload(data), {
      onSuccess: (teacher) => {
        const finish = () => {
          reset(defaultValues);
          setPhotoFile(null);
          onClose();
        };

        if (photoFile) {
          uploadPhoto.mutate(
            { id: teacher.id, file: photoFile },
            { onSettled: finish }
          );
        } else {
          finish();
        }
      },
    });
  };

  const apiError = createTeacher.isError
    ? (getTeacherMutationError(createTeacher.error) ?? 'Could not create teacher.')
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">Add teacher</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TeacherFormFields register={register} errors={errors} />

          <div className="space-y-3 rounded-xl border border-cream-dark p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" {...register('assignToMedresa')} />
              <span className="text-sm text-teal-800">Assign to medresa now</span>
            </label>
            {assignToMedresa && (
              <>
                <div>
                  <label className="field-label">Medresa</label>
                  <select
                    className="field-input"
                    {...register('medresaId')}
                    disabled={medresasLoading}
                  >
                    <option value="">Select medresa</option>
                    {activeMedresas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  {errors.medresaId && (
                    <p className="text-xs text-danger-text mt-1">{errors.medresaId.message}</p>
                  )}
                </div>
                <div>
                  <label className="field-label">Role</label>
                  <select className="field-input" {...register('assignmentRole')}>
                    <option value="TEACHER">{getMedresaRoleLabel('TEACHER', t)}</option>
                    <option value="ADMIN">{getMedresaRoleLabel('ADMIN', t)}</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Assignment date</label>
                  <input type="date" className="field-input" {...register('assignmentDate')} />
                </div>
              </>
            )}
          </div>

          <StaffCredentialsFields
            register={register}
            errors={errors}
            watch={watch}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword((v) => !v)}
          />

          <div>
            <label className="field-label">Photo (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="field-input"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {apiError && <p className="text-xs text-danger-text">{apiError}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTeacher.isPending || uploadPhoto.isPending}
              className="btn-primary flex-1"
            >
              {createTeacher.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
