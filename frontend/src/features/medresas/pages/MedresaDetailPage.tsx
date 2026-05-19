import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { getMedresaRoleLabel } from '../../auth/utils/medresaRoleLabel';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  MapPin,
  Phone,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { DeactivateMedresaDialog } from '../components/DeactivateMedresaDialog';
import { EditMedresaModal } from '../components/EditMedresaModal';
import { useMedresaDetail, useMedresas } from '../hooks/useMedresas';
import type { MedresaDetail, MedresaListItem } from '../types';

const TEACHER_PREVIEW_LIMIT = 5;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const toListItem = (detail: MedresaDetail): MedresaListItem => ({
  id: detail.id,
  name: detail.name,
  location: detail.location,
  phone: detail.phone,
  status: detail.status,
  created_at: detail.created_at,
  updated_at: detail.updated_at,
});

export const MedresaDetailPage = () => {
  const { t } = useTranslation();
  const { medresaId } = useParams({ strict: false }) as { medresaId: string };
  const { data: medresa, isLoading, error } = useMedresaDetail(medresaId);
  const { updateMedresa, deactivateMedresa, reactivateMedresa } = useMedresas();

  const [showEdit, setShowEdit] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <PageHeader title="Medresa" subtitle="Loading..." />
        <div className="p-4 space-y-4">
          <div className="h-32 bg-white rounded-xl animate-pulse border border-cream-dark" />
        </div>
      </div>
    );
  }

  if (error || !medresa) {
    return (
      <div className="min-h-screen bg-cream p-8 text-center">
        <p className="text-danger-text mb-4">Medresa not found.</p>
        <Link to="/admin/medresas" className="text-teal-600 hover:underline text-sm">
          Back to medresas
        </Link>
      </div>
    );
  }

  const studentCount = medresa.students?.length ?? 0;
  const teacherCount = medresa.teacher_medresas?.length ?? 0;
  const courseCount = medresa.medresa_courses?.length ?? 0;
  const teachers = medresa.teacher_medresas ?? [];
  const listItem = toListItem(medresa);

  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="px-4 pt-4">
        <Link
          to="/admin/medresas"
          className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:underline mb-2"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>
      <PageHeader title={medresa.name} subtitle={medresa.location} />

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-cream-dark p-4 text-center">
            <Users className="mx-auto text-teal-400 mb-2" size={20} />
            <p className="text-2xl font-medium text-teal-800">{studentCount}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </div>
          <div className="bg-white rounded-xl border border-cream-dark p-4 text-center">
            <GraduationCap className="mx-auto text-teal-400 mb-2" size={20} />
            <p className="text-2xl font-medium text-teal-800">{teacherCount}</p>
            <p className="text-xs text-muted-foreground">Teachers</p>
          </div>
          <div className="bg-white rounded-xl border border-cream-dark p-4 text-center">
            <BookOpen className="mx-auto text-teal-400 mb-2" size={20} />
            <p className="text-2xl font-medium text-teal-800">{courseCount}</p>
            <p className="text-xs text-muted-foreground">Courses</p>
          </div>
        </div>

        <section className="bg-white rounded-xl border border-cream-dark p-4 space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</h3>
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-teal-400 shrink-0" />
            <span>{medresa.location}</span>
          </div>
          {medresa.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={16} className="text-teal-400 shrink-0" />
              <span>{medresa.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${medresa.status === 'ACTIVE' ? 'bg-success-text' : 'bg-danger-text'}`}
            />
            <span>
              {medresa.status === 'ACTIVE' ? 'Active' : 'Inactive'} since {formatDate(medresa.created_at)}
            </span>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-cream-dark p-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Teachers</h3>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {teachers.slice(0, TEACHER_PREVIEW_LIMIT).map((tm) => (
                <li key={tm.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-teal-800">{tm.teacher.full_name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      tm.role === 'ADMIN'
                        ? 'bg-info-bg text-info-text'
                        : 'bg-cream-dark text-muted-foreground'
                    }`}
                  >
                    {getMedresaRoleLabel(tm.role, t)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {teachers.length > TEACHER_PREVIEW_LIMIT && (
            <Link
              to="/admin/teachers"
              search={{ medresaId: medresa.id }}
              className="text-xs text-teal-600 mt-3 inline-block hover:underline"
            >
              View all {teacherCount} teachers
            </Link>
          )}
        </section>

        <div className="flex gap-2">
          <button type="button" onClick={() => setShowEdit(true)} className="btn-secondary flex-1">
            Edit
          </button>
          <button
            type="button"
            onClick={() => setShowStatusDialog(true)}
            className={`flex-1 rounded-md py-3 px-5 text-sm font-medium text-white ${
              medresa.status === 'ACTIVE'
                ? 'bg-danger-text hover:opacity-90'
                : 'bg-teal-400 hover:bg-teal-600'
            }`}
          >
            {medresa.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </div>

      <EditMedresaModal
        medresa={showEdit ? listItem : null}
        onClose={() => setShowEdit(false)}
        updateMedresa={updateMedresa}
      />
      <DeactivateMedresaDialog
        medresa={showStatusDialog ? listItem : null}
        onClose={() => setShowStatusDialog(false)}
        deactivateMedresa={deactivateMedresa}
        reactivateMedresa={reactivateMedresa}
      />
    </div>
  );
};
