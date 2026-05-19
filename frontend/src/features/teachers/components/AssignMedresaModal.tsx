import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMedresaRoleLabel } from '../../auth/utils/medresaRoleLabel';
import { useMedresas } from '../../medresas/hooks/useMedresas';
import type { useTeachers } from '../hooks/useTeachers';

type AssignMedresaModalProps = {
  teacherId: string;
  open: boolean;
  onClose: () => void;
  assignMedresa: ReturnType<typeof useTeachers>['assignMedresa'];
  bulkAssignMedresa: ReturnType<typeof useTeachers>['bulkAssignMedresa'];
  existingMedresaIds: string[];
};

export const AssignMedresaModal = ({
  teacherId,
  open,
  onClose,
  assignMedresa,
  bulkAssignMedresa,
  existingMedresaIds,
}: AssignMedresaModalProps) => {
  const { t } = useTranslation();
  const { medresas, isLoading } = useMedresas();
  const activeMedresas = medresas.filter(
    (m) => m.status === 'ACTIVE' && !existingMedresaIds.includes(m.id)
  );

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [medresaId, setMedresaId] = useState('');
  const [role, setRole] = useState<'TEACHER' | 'ADMIN'>('TEACHER');
  const [assignedSince, setAssignedSince] = useState(new Date().toISOString().slice(0, 10));
  const [bulkRows, setBulkRows] = useState<Record<string, 'TEACHER' | 'ADMIN'>>({});

  if (!open) return null;

  const toggleBulkMedresa = (id: string) => {
    setBulkRows((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 'TEACHER';
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'single') {
      if (!medresaId) return;
      assignMedresa.mutate(
        {
          teacherId,
          medresaId,
          role,
          assignedSince: new Date(assignedSince).toISOString(),
        },
        { onSuccess: () => onClose() }
      );
      return;
    }

    const assignments = Object.entries(bulkRows).map(([mid, r]) => ({
      medresaId: mid,
      role: r,
      assignedSince: new Date(assignedSince).toISOString(),
    }));
    if (assignments.length === 0) return;
    bulkAssignMedresa.mutate({ teacherId, assignments }, { onSuccess: () => onClose() });
  };

  const pending = assignMedresa.isPending || bulkAssignMedresa.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">Assign to medresa</h3>
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-3 py-1 rounded-full text-xs ${mode === 'single' ? 'bg-teal-50 text-teal-600' : ''}`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`px-3 py-1 rounded-full text-xs ${mode === 'bulk' ? 'bg-teal-50 text-teal-600' : ''}`}
          >
            Bulk
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Assignment date</label>
            <input
              type="date"
              className="field-input"
              value={assignedSince}
              onChange={(e) => setAssignedSince(e.target.value)}
            />
          </div>
          {mode === 'single' ? (
            <>
              <div>
                <label className="field-label">Medresa</label>
                <select
                  className="field-input"
                  value={medresaId}
                  onChange={(e) => setMedresaId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select medresa</option>
                  {activeMedresas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Role</label>
                <select
                  className="field-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'TEACHER' | 'ADMIN')}
                >
                  <option value="TEACHER">{getMedresaRoleLabel('TEACHER', t)}</option>
                  <option value="ADMIN">{getMedresaRoleLabel('ADMIN', t)}</option>
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeMedresas.length === 0 && (
                <p className="text-sm text-muted-foreground">No medresas available to assign.</p>
              )}
              {activeMedresas.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(bulkRows[m.id])}
                    onChange={() => toggleBulkMedresa(m.id)}
                  />
                  <span className="flex-1">{m.name}</span>
                  {bulkRows[m.id] && (
                    <select
                      className="field-input py-1 text-xs w-28"
                      value={bulkRows[m.id]}
                      onChange={(e) =>
                        setBulkRows((prev) => ({
                          ...prev,
                          [m.id]: e.target.value as 'TEACHER' | 'ADMIN',
                        }))
                      }
                    >
                      <option value="TEACHER">{getMedresaRoleLabel('TEACHER', t)}</option>
                      <option value="ADMIN">{getMedresaRoleLabel('ADMIN', t)}</option>
                    </select>
                  )}
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="btn-primary flex-1">
              {pending ? 'Saving...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
