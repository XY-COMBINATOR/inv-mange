import { useState } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';

export function DeleteItemGroupDialog({ open, onClose, group = null }) {
  const { products, deleteItemGroup } = useStore();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  if (!group) return null;

  const linkedProducts = products.filter(
    (p) => p.groupId === group.id || p.category?.toLowerCase() === group.name?.toLowerCase()
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItemGroup(group.id);
      showToast(`Item group "${group.name}" removed.`);
      onClose();
    } catch {
      showToast('Failed to delete item group.', { error: true });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Delete Item Group"
      headline={`Delete "${group.name}"?`}
      icon="warning"
      actions={
        <>
          <Button variant="text" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
            icon={deleting ? undefined : 'delete'}
          >
            {deleting ? 'Deleting...' : 'Delete Group'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="md-body-medium">
          Are you sure you want to permanently remove this item group?
        </p>

        {linkedProducts.length > 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: 12,
              borderRadius: 8,
              backgroundColor: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
            }}
          >
            <Icon name="warning" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
              <strong>Notice:</strong> There are <strong>{linkedProducts.length} product(s)</strong> currently categorized under this group. Deleting this group will unassign them.
            </div>
          </div>
        ) : (
          <p className="md-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            No products are currently assigned to this item group.
          </p>
        )}
      </div>
    </Dialog>
  );
}

