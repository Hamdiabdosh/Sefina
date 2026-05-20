import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMedresaRoleLabel } from '../../auth/utils/medresaRoleLabel';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { AssignMedresaModal } from '../components/AssignMedresaModal';
import { DeactivateTeacherDialog } from '../components/DeactivateTeacherDialog';
import { EditTeacherModal } from '../components/EditTeacherModal';
import { SetStaffPasswordModal } from '../components/SetStaffPasswordModal';
import { TeacherAvatar } from '../components/TeacherAvatar';
import { useTeacherDetail, useTeachers } from '../hooks/useTeachers';
import { useUserAccountActions } from '../hooks/useUserAccountActions';
import type { TeacherListItem } from '../types';
import { getLocalizedValue } from '../utils/localizedJson';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const toListItem = (t: NonNullable<ReturnType<typeof useTeacherDetail>['data']>): TeacherListItem => ({
  id: t.id,
  fullName: t.fullName,
  phone: t.phone,
  email: t.email,
  specialization: t.specialization,
  dateJoined: t.dateJoined,
  photoUrl: t.photoUrl,
  status: t.status,
  medresaAssignments: t.medresaAssignments,
});

export const TeacherDetailPage = () => {
  const { t } = useTranslation();
  const { teacherId } = useParams({ strict: false }) as { teacherId: string };
  const { data: teacher, isLoading, error } = useTeacherDetail(teacherId);
  const {
    updateTeacher,
    uploadPhoto,
    deactivateTeacher,
    reactivateTeacher,
    updateAssignmentRole,
    removeFromMedresa,
    assignMedresa,
    bulkAssignMedresa,
  } = useTeachers();
  const { resendInvite, setPassword } = useUserAccountActions(teacher?.userId);
  const [showEdit, setShowEdit] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title="Teacher" subtitle="Loading..." />
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title="Teacher" subtitle="" />
        <PageBody>
          <p className="mb-4 text-center text-danger-text">Teacher not found.</p>
          <Link to="/admin/teachers" search={{ medresaId: undefined }} className="text-center text-teal-600 hover:underline text-sm block">
            Back
          </Link>
        </PageBody>
      </div>
    );
  }

  const listItem = toListItem(teacher);
  const existingMedresaIds = teacher.medresaAssignments.map((a) => a.medresaId);

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-24">
      <Link
        to="/admin/teachers"
        search={{ medresaId: undefined }}
        className="inline-flex items-center gap-1.5 px-4 pt-4 text-sm text-teal-600 md:hidden"
      >
        <ArrowLeft size={16} /> Back
      </Link>
      <PageTopBar
        title={teacher.fullName}
        subtitle={`${getLocalizedValue(teacher.specialization)} · Since ${formatDate(teacher.dateJoined)}`}
      />
      <PageBody className="flex flex-col items-center space-y-6">
        <TeacherAvatar
          teacherId={teacher.id}
          name={teacher.fullName}
          photoUrl={teacher.photoUrl}
          size="lg"
        />
        <p className="text-sm">
          <Phone size={14} className="inline" /> {teacher.phone}
        </p>
        <p className="text-sm">
          <Mail size={14} className="inline" /> {teacher.email}
        </p>

        <section className="w-full max-w-md bg-white rounded-xl border border-cream-dark p-4">
          <h3 className="text-xs uppercase text-muted-foreground mb-3">Account</h3>
          {teacher.status === 'ACTIVE' && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={resendInvite.isPending}
                onClick={() => {
                  resendInvite.mutate(undefined, {
                    onSuccess: () => {
                      setInviteSent(true);
                      setTimeout(() => setInviteSent(false), 3000);
                    },
                  });
                }}
                className="text-sm text-teal-600 hover:underline disabled:opacity-50"
              >
                {inviteSent ? 'Invite sent' : 'Resend invite email'}
              </button>
              <button
                type="button"
                onClick={() => setShowSetPassword(true)}
                className="text-sm text-teal-600 hover:underline"
              >
                Set temporary password
              </button>
            </div>
          )}
          {teacher.status !== 'ACTIVE' && (
            <p className="text-sm text-muted-foreground">Reactivate to manage account access.</p>
          )}
        </section>

        <section className="w-full max-w-md bg-white rounded-xl border border-cream-dark p-4">
          <h3 className="text-xs uppercase text-muted-foreground mb-3">Medresa assignments</h3>
          {teacher.medresaAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">None</p>
          ) : (
            <ul className="space-y-3">
              {teacher.medresaAssignments.map((a) => (
                <li key={a.id} className="text-sm border-b border-cream-dark pb-2">
                  <p className="font-medium text-teal-800">{a.medresaName}</p>
                  <p className="text-xs text-muted-foreground">Since {formatDate(a.assignedSince)}</p>
                  <select
                    className="field-input py-1 text-xs mt-1"
                    value={a.role}
                    onChange={(e) =>
                      updateAssignmentRole.mutate({
                        teacherId: teacher.id,
                        medresaId: a.medresaId,
                        role: e.target.value as 'TEACHER' | 'ADMIN',
                      })
                    }
                  >
                    <option value="TEACHER">{getMedresaRoleLabel('TEACHER', t)}</option>
                    <option value="ADMIN">{getMedresaRoleLabel('ADMIN', t)}</option>
                  </select>
                  <button
                    type="button"
                    className="text-xs text-danger-text block mt-1"
                    onClick={() =>
                      removeFromMedresa.mutate({ teacherId: teacher.id, medresaId: a.medresaId })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex gap-2 w-full max-w-md flex-wrap">
          <button type="button" className="btn-secondary flex-1 min-w-[7rem]" onClick={() => setShowEdit(true)}>
            Edit
          </button>
          <button type="button" className="btn-secondary flex-1 min-w-[7rem]" onClick={() => setShowAssign(true)}>
            Assign
          </button>
          <button
            type="button"
            className="flex-1 min-w-[7rem] text-white rounded-md py-3 bg-danger-text"
            onClick={() => setShowStatus(true)}
          >
            {teacher.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </PageBody>

      <EditTeacherModal
        teacher={showEdit ? listItem : null}
        onClose={() => setShowEdit(false)}
        updateTeacher={updateTeacher}
        uploadPhoto={uploadPhoto}
      />
      <DeactivateTeacherDialog
        teacher={showStatus ? listItem : null}
        onClose={() => setShowStatus(false)}
        deactivateTeacher={deactivateTeacher}
        reactivateTeacher={reactivateTeacher}
      />
      <AssignMedresaModal
        teacherId={teacher.id}
        open={showAssign}
        onClose={() => setShowAssign(false)}
        assignMedresa={assignMedresa}
        bulkAssignMedresa={bulkAssignMedresa}
        existingMedresaIds={existingMedresaIds}
      />
      <SetStaffPasswordModal
        open={showSetPassword}
        onClose={() => setShowSetPassword(false)}
        setPassword={setPassword}
      />
    </div>
  );
};
