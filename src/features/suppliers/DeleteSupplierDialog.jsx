import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';

export function DeleteSupplierDialog({ open, onClose, supplier }) {
  const { products, deleteSupplier } = useStore();
  const { showToast } = useToast();

  if (!supplier) return null;

  const linked = products.filter(
    (product) => product.supplierId === supplier.id,
  ).length;

  const handleDelete = () => {
    deleteSupplier(supplier.id);
    onClose();
    showToast(`${supplier.name} removed.`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Remove ${supplier.name}?`}
      description="Products linked to this supplier will stay in your catalog."
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" icon="delete" onClick={handleDelete}>
            Remove supplier
          </Button>
        </>
      }
    >
      <div className="delete-summary">
        <Avatar name={supplier.name} size={44} />
        <div className="delete-summary__body">
          <p className="md-title-small">{supplier.name}</p>
          <p className="md-body-small text-muted">
            {supplier.contactName || 'No contact person'} ·{' '}
            {supplier.leadTime || 0} day lead time
          </p>
          <p className="md-body-small text-muted">
            {linked} linked product{linked === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      <div className="form-note form-note--warning">
        <Icon name="info" size={20} />
        <p className="md-body-small">
          {linked > 0
            ? `${linked} product${linked === 1 ? '' : 's'} will be marked as having no supplier. Stock levels are not affected.`
            : 'No products are linked to this supplier.'}
        </p>
      </div>
    </Dialog>
  );
}
