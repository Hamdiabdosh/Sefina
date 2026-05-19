import type { MedresaListItem } from '../types';
import type { useMedresas } from '../hooks/useMedresas';

type DeactivateMedresaDialogProps = {
  medresa: MedresaListItem | null;
  onClose: () => void;
  deactivateMedresa: ReturnType<typeof useMedresas>['deactivateMedresa'];
  reactivateMedresa: ReturnType<typeof useMedresas>['reactivateMedresa'];
};

export const DeactivateMedresaDialog = ({
  medresa,
  onClose,
  deactivateMedresa,
  reactivateMedresa,
}: DeactivateMedresaDialogProps) => {
  if (!medresa) return null;

  const isActive = medresa.status === 'ACTIVE';

  const handleConfirm = () => {
    if (isActive) {
      deactivateMedresa.mutate(medresa.id, { onSuccess: () => onClose() });
    } else {
      reactivateMedresa.mutate(medresa.id, { onSuccess: () => onClose() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-lg font-medium text-teal-800 mb-2">
          {isActive ? 'Deactivate medresa' : 'Reactivate medresa'}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {isActive
            ? `Deactivate ${medresa.name}? It will be hidden from the network. All data will be preserved.`
            : `Reactivate ${medresa.name}? It will appear in the network again.`}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deactivateMedresa.isPending || reactivateMedresa.isPending}
            className={`flex-1 rounded-md py-3 px-5 text-sm font-medium text-white ${
              isActive ? 'bg-danger-text hover:opacity-90' : 'bg-teal-400 hover:bg-teal-600'
            }`}
          >
            {isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </div>
    </div>
  );
};
