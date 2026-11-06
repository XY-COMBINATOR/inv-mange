import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';
import { formatCurrency } from '../../utils/format';
import { getStockStatus } from '../../utils/stock';

export function DeleteProductDialog({ open, onClose, product }) {
  const { movements, deleteProduct, restoreProduct } = useStore();
  const { showToast } = useToast();

  if (!product) return null;

  const historyCount = movements.filter(
    (movement) => movement.productId === product.id,
  ).length;
  const status = getStockStatus(product);

  const handleDelete = () => {
    deleteProduct(product.id);
    onClose();
    showToast(`${product.name} deleted.`, {
      actionLabel: 'Undo',
      onAction: () => restoreProduct(product),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Delete ${product.name}?`}
      description="This cannot be undone from the catalog view."
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" icon="delete" onClick={handleDelete}>
            Delete product
          </Button>
        </>
      }
    >
      <div className="delete-summary">
        <span className="delete-summary__icon" aria-hidden="true">
          <Icon name="inventory_2" size={24} />
        </span>
        <div className="delete-summary__body">
          <p className="md-title-small">{product.name}</p>
          <p className="md-body-small text-muted">
            {product.sku} · {product.location || 'No location'} ·{' '}
            {formatCurrency(product.price)}
          </p>
          <p className="md-body-small text-muted">
            {product.quantity} units · {status.label} · {historyCount} recorded
            movement{historyCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      <div className="form-note form-note--warning">
        <Icon name="info" size={20} />
        <p className="md-body-small">
          The product is removed from inventory and supplier reports. Its stock
          movement history is kept for your audit trail.
        </p>
      </div>
    </Dialog>
  );
}
